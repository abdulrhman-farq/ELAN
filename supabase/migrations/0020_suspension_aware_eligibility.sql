-- 0020_suspension_aware_eligibility.sql
-- B3: surface suspension in eligibility so the CTA is disabled instead of failing
-- on submit. book_class_self already raises SUSPENDED at book time; this mirrors it.
-- ⚠️ PENDING STAGING VALIDATION — apply to staging and verify before production.

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
  if public.member_suspended_until(p_member) > now() then
    return 'SUSPENDED';
  end if;
  if v_inst.status <> 'scheduled' or now() < v_inst.booking_opens_at or now() >= v_inst.booking_closes_at then
    return 'BOOKING_CLOSED';
  end if;
  if not _elan_membership_covers(p_member) and elan_credit_balance(p_member) < 1 then
    return 'NO_CREDITS';
  end if;
  return 'ELIGIBLE';
end; $function$;
