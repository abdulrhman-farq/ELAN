-- 0008_remove_level_gating.sql
-- Product decision: any member can book any class regardless of level.
-- Recreate book_class / booking_eligibility WITHOUT the LEVEL_TOO_LOW check
-- (all other rules kept: booking window, already-booked, capacity, credits/
-- membership, waitlist).

create or replace function public.book_class(p_member uuid, p_class_instance_id uuid, p_source booking_source default 'web'::booking_source)
returns bookings language plpgsql security definer set search_path to 'public','pg_temp'
as $function$
declare
  v_inst class_instances;
  v_confirmed int; v_spots int; v_max_wait int; v_wait_count int; v_next_pos int;
  v_audience payment_audience; v_credits int := 0;
  v_booking bookings;
begin
  select * into v_inst from class_instances where id = p_class_instance_id for update;
  if not found then raise exception 'CLASS_NOT_FOUND'; end if;
  if v_inst.status <> 'scheduled' or now() < v_inst.booking_opens_at or now() >= v_inst.booking_closes_at then
    raise exception 'BOOKING_CLOSED';
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

create or replace function public.booking_eligibility(p_member uuid, p_class_instance_id uuid)
returns text language plpgsql stable set search_path to 'public','pg_temp'
as $function$
declare v_inst class_instances;
begin
  select * into v_inst from class_instances where id = p_class_instance_id;
  if not found then return 'BOOKING_CLOSED'; end if;
  if exists (select 1 from bookings where class_instance_id = p_class_instance_id
             and member_id = p_member and status in ('confirmed','waitlisted')) then
    return 'ALREADY_BOOKED';
  end if;
  if v_inst.status <> 'scheduled' or now() < v_inst.booking_opens_at or now() >= v_inst.booking_closes_at then
    return 'BOOKING_CLOSED';
  end if;
  if not _elan_membership_covers(p_member) and elan_credit_balance(p_member) < 1 then
    return 'NO_CREDITS';
  end if;
  return 'ELIGIBLE';
end; $function$;
