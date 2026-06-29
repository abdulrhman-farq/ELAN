-- 0023 Credit rollover (تدوير الرصيد)
-- Pay-as-you-go pack credits already never expire in this system (the ledger is
-- a running sum), so "rollover" applies to SUBSCRIPTIONS: unused classes from a
-- plan's monthly allotment can be banked as carry-over credits at renewal, up
-- to a per-plan cap. Run once per period (idempotent via rollover_applied_for).

alter table public.membership_plans  add column if not exists rollover_max integer not null default 0;
alter table public.member_memberships add column if not exists rollover_applied_for timestamptz;

-- Unused classes in the current period for the member's active subscription.
-- Unlimited plans (>=9999) never carry over. Returns 0 when no active sub.
create or replace function public.elan_unused_classes(p_member uuid)
returns integer language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_allow int; v_start timestamptz; v_used int;
begin
  select mp.classes_per_period, mm.current_period_start into v_allow, v_start
  from member_memberships mm
  join membership_plans mp on mp.id = mm.plan_id
  where mm.member_id = p_member and mm.status = 'active' and mm.current_period_end > now()
    and mp.is_subscription
  order by mm.current_period_end desc limit 1;
  if v_allow is null or v_allow >= 9999 then return 0; end if;
  select count(*) into v_used from bookings
   where member_id = p_member and credits_used = 0 and is_guest = false
     and status in ('confirmed','attended') and created_at >= v_start;
  return greatest(0, v_allow - v_used);
end; $$;
grant execute on function public.elan_unused_classes(uuid) to authenticated;

-- Bank the member's unused classes as carry-over credits (capped by the plan's
-- rollover_max). Staff-gated; applied at most once per billing period.
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
  if v_applied is not null and v_applied = v_end then return 0; end if; -- already banked this period

  v_grant := least(public.elan_unused_classes(p_member), v_cap);
  if v_grant > 0 then
    perform _elan_add_ledger(p_member, v_grant, 'admin', null);
  end if;
  update member_memberships set rollover_applied_for = v_end where id = v_id;
  return v_grant;
end; $$;
revoke execute on function public.apply_membership_rollover(uuid) from anon;
grant execute on function public.apply_membership_rollover(uuid) to authenticated;

notify pgrst, 'reload schema';
