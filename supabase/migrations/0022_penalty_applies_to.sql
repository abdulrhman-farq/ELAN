-- 0022_penalty_applies_to.sql
-- Honor penalty_settings.applies_to ('membership' | 'payg' | 'both') in the
-- late-cancel and no-show penalty paths. Previously penalties were applied
-- regardless of the booking's payment_audience, contradicting the setting.
--
-- Bodies below are cancel_booking (from 0011) and mark_no_show (from 0009)
-- reproduced VERBATIM, with the penalty block gated by _elan_penalty_applies().
--
-- ⚠️ PENDING STAGING VALIDATION — apply to staging and run the integration suite
-- before production. Forward-only; no data migration.

-- Audience match helper: maps the text setting to the booking's payment_audience.
create or replace function public._elan_penalty_applies(p_applies_to text, p_audience public.payment_audience)
returns boolean
language sql immutable set search_path = public, pg_temp as $$
  select p_applies_to = 'both'
      or (p_applies_to = 'membership' and p_audience = 'member')
      or (p_applies_to = 'payg'       and p_audience = 'payg');
$$;

create or replace function public.cancel_booking(p_member uuid, p_booking_id uuid)
returns public.bookings
language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
declare
  v_booking bookings; v_inst class_instances;
  v_ps penalty_settings; v_old_pos int;
  v_cand bookings; v_promoted bookings; v_inside boolean;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if v_booking.member_id <> p_member then raise exception 'FORBIDDEN'; end if;
  if v_booking.status not in ('confirmed','waitlisted') then raise exception 'NOT_CANCELLABLE'; end if;

  select * into v_inst from class_instances where id = v_booking.class_instance_id for update;
  select * into v_ps from penalty_settings where id;

  if v_booking.status = 'waitlisted' then
    v_old_pos := v_booking.waitlist_position;
    update bookings set status='cancelled', waitlist_position=null, cancelled_at=now()
      where id=v_booking.id returning * into v_booking;
    update bookings set waitlist_position = waitlist_position - 1
      where class_instance_id=v_inst.id and status='waitlisted'
        and waitlist_position > coalesce(v_old_pos, 2147483647);
    return v_booking;
  end if;

  v_inside := (v_inst.starts_at - now()) < make_interval(hours => v_ps.late_cancel_window_hours);

  if not v_inside then
    if v_booking.credits_used > 0 then
      perform _elan_add_ledger(p_member, 1, 'refund', v_booking.id);
    end if;
    update bookings set status='cancelled', cancelled_at=now()
      where id=v_booking.id returning * into v_booking;
  else
    update bookings set status='late_cancelled', cancelled_at=now()
      where id=v_booking.id returning * into v_booking;
    if v_ps.active and public._elan_penalty_applies(v_ps.applies_to, v_booking.payment_audience) then
      insert into penalties (member_id, booking_id, kind, amount_credits, amount_sar)
        values (p_member, v_booking.id, 'late_cancel', v_ps.late_cancel_fee_credits, v_ps.late_cancel_fee_sar);
      if v_booking.credits_used = 0 and v_ps.late_cancel_fee_credits > 0 then
        perform _elan_add_ledger(p_member, -v_ps.late_cancel_fee_credits, 'penalty', v_booking.id);
      end if;
    end if;
  end if;

  loop
    select * into v_cand from bookings
      where class_instance_id=v_inst.id and status='waitlisted'
      order by waitlist_position asc limit 1 for update;
    exit when not found;

    if _elan_membership_covers(v_cand.member_id) then
      update bookings set status='confirmed', waitlist_position=null, credits_used=0, payment_audience='member'
        where id=v_cand.id returning * into v_promoted;
    elsif elan_credit_balance(v_cand.member_id) >= 1 then
      update bookings set status='confirmed', waitlist_position=null, credits_used=1, payment_audience='payg'
        where id=v_cand.id returning * into v_promoted;
      perform _elan_add_ledger(v_cand.member_id, -1, 'booking', v_cand.id);
    else
      update bookings set status='cancelled', waitlist_position=null, cancelled_at=now() where id=v_cand.id;
      if _elan_has_consent(v_cand.member_id, 'in_app') then
        insert into notifications (member_id, channel, template, payload, status)
          values (v_cand.member_id, 'in_app', 'waitlist_promotion_failed',
                  jsonb_build_object('class_instance_id', v_inst.id), 'pending');
      end if;
      update bookings set waitlist_position = waitlist_position - 1
        where class_instance_id=v_inst.id and status='waitlisted'
          and waitlist_position > v_cand.waitlist_position;
      continue;
    end if;

    update bookings set waitlist_position = waitlist_position - 1
      where class_instance_id=v_inst.id and status='waitlisted';
    if _elan_has_consent(v_promoted.member_id, 'whatsapp') then
      insert into notifications (member_id, channel, template, payload, status)
        values (v_promoted.member_id, 'whatsapp', 'waitlist_promoted',
                jsonb_build_object('class_instance_id', v_inst.id, 'booking_id', v_promoted.id), 'pending');
    end if;
    exit;
  end loop;

  -- #19: if a seat is still open after waitlist handling, ping watchers.
  perform elan_notify_watchers(v_inst.id);

  return v_booking;
end; $function$;

create or replace function public.mark_no_show(p_booking_id uuid)
returns public.bookings
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_booking public.bookings; v_ps public.penalty_settings;
begin
  if not public.elan_can_manage_booking(p_booking_id) then raise exception 'FORBIDDEN'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if v_booking.status <> 'confirmed' then raise exception 'NOT_CONFIRMED'; end if;
  select * into v_ps from public.penalty_settings where id;
  update public.bookings set status = 'no_show' where id = v_booking.id returning * into v_booking;
  if v_ps.active and public._elan_penalty_applies(v_ps.applies_to, v_booking.payment_audience) then
    insert into public.penalties (member_id, booking_id, kind, amount_credits, amount_sar)
      values (v_booking.member_id, v_booking.id, 'no_show', v_ps.no_show_fee_credits, v_ps.no_show_fee_sar);
    if v_booking.credits_used = 0 and v_ps.no_show_fee_credits > 0 then
      perform public._elan_add_ledger(v_booking.member_id, -v_ps.no_show_fee_credits, 'penalty', v_booking.id);
    end if;
  end if;
  return v_booking;
end; $$;

notify pgrst, 'reload schema';
