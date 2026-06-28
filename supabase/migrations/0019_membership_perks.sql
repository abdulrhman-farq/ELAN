-- 0019 Membership functional perks (#3): freeze/pause, tier-priority waitlist,
-- early-booking window by tier.

-- Freeze/pause: while frozen the membership doesn't cover bookings; paid time is
-- compensated by extending the period (handled in the freeze action).
alter table public.member_memberships add column if not exists frozen_until timestamptz;

-- Tier rank from the member's active subscription (higher = more priority):
--   4 = Unlimited, 3 = Signature (12), 2 = any other active subscription,
--   1 = drop-in / pack / none.
create or replace function public._elan_member_tier_rank(p_member uuid)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce((
    select case
             when mp.classes_per_period >= 9999 then 4
             when mp.classes_per_period >= 12 then 3
             else 2
           end
    from member_memberships mm
    join membership_plans mp on mp.id = mm.plan_id
    where mm.member_id = p_member and mm.status = 'active'
      and mm.current_period_end > now() and mp.is_subscription
      and (mm.frozen_until is null or mm.frozen_until <= now())
    order by mp.classes_per_period desc limit 1
  ), 1);
$$;
grant execute on function public._elan_member_tier_rank(uuid) to authenticated;

-- Coverage now ignores frozen periods.
create or replace function public._elan_membership_covers(p_member uuid)
returns boolean language plpgsql stable set search_path to 'public' as $function$
declare v_allow int; v_used int; v_start timestamptz;
begin
  select mp.classes_per_period, mm.current_period_start into v_allow, v_start
  from member_memberships mm
  join membership_plans mp on mp.id = mm.plan_id
  where mm.member_id = p_member and mm.status = 'active' and mm.current_period_end > now()
    and (mm.frozen_until is null or mm.frozen_until <= now())
  order by mm.current_period_end desc limit 1;
  if v_allow is null then return false; end if;
  select count(*) into v_used from bookings
  where member_id = p_member and credits_used = 0
    and status in ('confirmed', 'attended') and created_at >= v_start;
  return v_used < v_allow;
end; $function$;

-- Early-booking window: Signature/Unlimited (rank >= 3) may book up to 48h
-- before booking opens; everyone else waits for booking_opens_at.
create or replace function public.book_class(p_member uuid, p_class_instance_id uuid, p_source booking_source default 'web'::booking_source)
returns public.bookings
language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
declare
  v_inst class_instances;
  v_confirmed int; v_spots int; v_max_wait int; v_wait_count int; v_next_pos int;
  v_audience payment_audience; v_credits int := 0;
  v_booking bookings;
begin
  select * into v_inst from class_instances where id = p_class_instance_id for update;
  if not found then raise exception 'CLASS_NOT_FOUND'; end if;
  if v_inst.status <> 'scheduled' or now() >= v_inst.booking_closes_at then
    raise exception 'BOOKING_CLOSED';
  end if;
  if now() < v_inst.booking_opens_at then
    -- Before the public window: allow only high-tier members, within 48h of open.
    if not (now() >= v_inst.booking_opens_at - interval '48 hours'
            and public._elan_member_tier_rank(p_member) >= 3) then
      raise exception 'BOOKING_CLOSED';
    end if;
  end if;
  if exists (select 1 from bookings where class_instance_id = p_class_instance_id
             and member_id = p_member and status in ('confirmed','waitlisted')) then
    raise exception 'ALREADY_BOOKED';
  end if;

  select count(*) into v_confirmed from bookings
    where class_instance_id = p_class_instance_id and status = 'confirmed';
  v_spots := v_inst.capacity - v_confirmed;

  if v_spots > 0 then
    if _elan_membership_covers(p_member) then
      v_audience := 'member'; v_credits := 0;
    elsif elan_credit_balance(p_member) >= 1 then
      v_audience := 'payg'; v_credits := 1;
    else
      raise exception 'NO_CREDITS';
    end if;
    insert into bookings (class_instance_id, member_id, status, source, credits_used, payment_audience)
      values (p_class_instance_id, p_member, 'confirmed', p_source, v_credits, v_audience)
      returning * into v_booking;
    if v_credits > 0 then perform _elan_add_ledger(p_member, -1, 'booking', v_booking.id); end if;
  else
    select max_waitlist_size into v_max_wait from studio_settings where id;
    select count(*) into v_wait_count from bookings
      where class_instance_id = p_class_instance_id and status = 'waitlisted';
    if v_wait_count >= v_max_wait then raise exception 'WAITLIST_FULL'; end if;
    select coalesce(max(waitlist_position), 0) + 1 into v_next_pos from bookings
      where class_instance_id = p_class_instance_id and status = 'waitlisted';
    insert into bookings (class_instance_id, member_id, status, waitlist_position, source, credits_used, payment_audience)
      values (p_class_instance_id, p_member, 'waitlisted', v_next_pos, p_source, 0, 'payg')
      returning * into v_booking;
  end if;
  return v_booking;
end; $function$;

-- Tier-priority promotion: when a seat frees, promote the highest-tier waitlisted
-- member first (ties broken by waitlist position). Body identical to 0011 except
-- the candidate ordering.
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
    if v_ps.active then
      insert into penalties (member_id, booking_id, kind, amount_credits, amount_sar)
        values (p_member, v_booking.id, 'late_cancel', v_ps.late_cancel_fee_credits, v_ps.late_cancel_fee_sar);
      if v_booking.credits_used = 0 and v_ps.late_cancel_fee_credits > 0 then
        perform _elan_add_ledger(p_member, -v_ps.late_cancel_fee_credits, 'penalty', v_booking.id);
      end if;
    end if;
  end if;

  loop
    select b.* into v_cand from bookings b
      where b.class_instance_id=v_inst.id and b.status='waitlisted'
      order by public._elan_member_tier_rank(b.member_id) desc, b.waitlist_position asc
      limit 1 for update;
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

  perform elan_notify_watchers(v_inst.id);

  return v_booking;
end; $function$;

-- Freeze an active membership for N days: pause coverage + extend the period so
-- no paid time is lost. Staff-gated.
create or replace function public.freeze_membership(p_member uuid, p_days integer)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_days int := greatest(1, coalesce(p_days,0));
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select id into v_id from public.member_memberships
    where member_id = p_member and status = 'active' and current_period_end > now()
    order by current_period_end desc limit 1;
  if v_id is null then raise exception 'NO_ACTIVE_MEMBERSHIP'; end if;
  update public.member_memberships
    set frozen_until = now() + make_interval(days => v_days),
        current_period_end = current_period_end + make_interval(days => v_days)
    where id = v_id;
end; $$;
revoke execute on function public.freeze_membership(uuid, integer) from anon;
grant execute on function public.freeze_membership(uuid, integer) to authenticated;

-- Lift a freeze early: return the unused frozen days back (shorten the extension).
create or replace function public.unfreeze_membership(p_member uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_frozen timestamptz; v_left interval;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select id, frozen_until into v_id, v_frozen from public.member_memberships
    where member_id = p_member and frozen_until is not null
    order by current_period_end desc limit 1;
  if v_id is null then return; end if;
  if v_frozen > now() then
    v_left := v_frozen - now();
    update public.member_memberships
      set frozen_until = null, current_period_end = current_period_end - v_left
      where id = v_id;
  else
    update public.member_memberships set frozen_until = null where id = v_id;
  end if;
end; $$;
revoke execute on function public.unfreeze_membership(uuid) from anon;
grant execute on function public.unfreeze_membership(uuid) to authenticated;

notify pgrst, 'reload schema';
