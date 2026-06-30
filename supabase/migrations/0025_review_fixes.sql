-- 0025 Post-review fixes (from full security/correctness audit).
--
-- (A) book_class: the ALREADY_BOOKED guard counted the host's own GUEST rows
--     (same member_id, is_guest=true), so a host who added a guest first could
--     no longer book their own seat. Narrow the guard to non-guest rows, to
--     match the uniq_active_booking index (which 0021 already scoped to
--     is_guest=false). Body otherwise identical to 0019.
--
-- (B) apply_membership_rollover: banking unused classes mid-period let a member
--     keep using those same classes via membership coverage afterwards
--     (double-dip). Only allow banking near the end of the period.
--
-- (C) booking_eligibility(p_member,...) was executable by PUBLIC (read-only,
--     but takes an arbitrary p_member). Lock it to owner/service_role; the
--     booking_eligibility_self wrapper remains the member entry point.

-- ── (A) ─────────────────────────────────────────────────────────────────────
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
    if not (now() >= v_inst.booking_opens_at - interval '48 hours'
            and public._elan_member_tier_rank(p_member) >= 3) then
      raise exception 'BOOKING_CLOSED';
    end if;
  end if;
  if exists (select 1 from bookings where class_instance_id = p_class_instance_id
             and member_id = p_member and is_guest = false
             and status in ('confirmed','waitlisted')) then
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

-- ── (B) ─────────────────────────────────────────────────────────────────────
create or replace function public.apply_membership_rollover(p_member uuid)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_end timestamptz; v_applied timestamptz; v_cap int; v_grant int;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  select mm.id, mm.current_period_end, mm.rollover_applied_for, mp.rollover_max
    into v_id, v_end, v_applied, v_cap
  from member_memberships mm
  join membership_plans mp on mp.id = mm.plan_id
  where mm.member_id = p_member and mm.status = 'active' and mm.current_period_end > now()
    and mp.is_subscription
  order by mm.current_period_end desc limit 1;
  if v_id is null then return 0; end if;
  if v_cap is null or v_cap <= 0 then return 0; end if;
  if v_applied is not null and v_applied = v_end then return 0; end if;       -- already banked this period
  if v_end - now() > interval '7 days' then raise exception 'ROLLOVER_TOO_EARLY'; end if; -- only near renewal

  v_grant := least(public.elan_unused_classes(p_member), v_cap);
  if v_grant > 0 then
    perform _elan_add_ledger(p_member, v_grant, 'admin', null);
  end if;
  update member_memberships set rollover_applied_for = v_end where id = v_id;
  return v_grant;
end; $$;

-- ── (C) ─────────────────────────────────────────────────────────────────────
revoke execute on function public.booking_eligibility(uuid, uuid) from public;
revoke execute on function public.booking_eligibility(uuid, uuid) from anon;

notify pgrst, 'reload schema';
