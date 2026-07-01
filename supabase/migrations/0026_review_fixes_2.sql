-- 0026 Second-round review fixes (Codex P2 findings on PR #42).
--
-- (D) create_pending_purchase: the "reuse existing initiated payment" early
--     return ran BEFORE the first-time eligibility guard, so a member who lost
--     first-time status (later paid/attended) could re-click an intro offer and
--     get the stale initiated payment back, bypassing the guard. Resolve the
--     catalogue flag and check eligibility FIRST, then dedupe.
--
-- (E) _elan_membership_covers: once a period's unused classes have been banked
--     as carry-over credits (rollover_applied_for = current_period_end), the
--     membership allowance for that period is spent — otherwise a member could
--     bank near renewal and still book membership-covered classes in the
--     remaining days (double-dip). Treat a banked period as no longer covering.

-- ── (D) ─────────────────────────────────────────────────────────────────────
create or replace function public.create_pending_purchase(p_type payment_type, p_ref_id uuid)
returns payments
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_member  uuid;
  v_pay     payments;
  v_price   numeric(10,2);
  v_credits int;
  v_first   boolean;
begin
  select id into v_member from members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;
  if p_type not in ('credit_pack', 'membership') then raise exception 'BAD_TYPE'; end if;

  -- Resolve catalogue item + first-time flag, and enforce eligibility BEFORE any
  -- reuse of a prior pending payment.
  if p_type = 'credit_pack' then
    select price_sar, credits, first_time_only into v_price, v_credits, v_first
      from credit_packs where id = p_ref_id and active;
    if v_price is null then raise exception 'PACK_NOT_FOUND'; end if;
  else
    select price_sar, first_time_only into v_price, v_first
      from membership_plans where id = p_ref_id and active;
    if v_price is null then raise exception 'PLAN_NOT_FOUND'; end if;
  end if;
  if v_first and not public.elan_is_first_time(v_member) then raise exception 'NOT_FIRST_TIME'; end if;

  -- Idempotent-ish: reuse an existing pending purchase for the same item so a
  -- member double-clicking "buy" does not litter the table with duplicates.
  select * into v_pay
  from payments
  where member_id = v_member and type = p_type and ref_id = p_ref_id and status = 'initiated'
  order by created_at desc
  limit 1;
  if v_pay.id is not null then return v_pay; end if;

  if p_type = 'credit_pack' then
    insert into payments (member_id, amount_sar, currency, status, type, ref_id, credits)
      values (v_member, v_price, 'SAR', 'initiated', 'credit_pack', p_ref_id, v_credits)
      returning * into v_pay;
  else
    insert into payments (member_id, amount_sar, currency, status, type, ref_id)
      values (v_member, v_price, 'SAR', 'initiated', 'membership', p_ref_id)
      returning * into v_pay;
  end if;

  return v_pay;
end;
$$;

-- ── (E) ─────────────────────────────────────────────────────────────────────
create or replace function public._elan_membership_covers(p_member uuid)
returns boolean language plpgsql stable set search_path to 'public' as $function$
declare v_allow int; v_used int; v_start timestamptz; v_end timestamptz; v_banked timestamptz;
begin
  select mp.classes_per_period, mm.current_period_start, mm.current_period_end, mm.rollover_applied_for
    into v_allow, v_start, v_end, v_banked
  from member_memberships mm
  join membership_plans mp on mp.id = mm.plan_id
  where mm.member_id = p_member and mm.status = 'active' and mm.current_period_end > now()
    and (mm.frozen_until is null or mm.frozen_until <= now())
  order by mm.current_period_end desc limit 1;
  if v_allow is null then return false; end if;
  -- Allowance already banked as carry-over credits for this period → spent.
  if v_banked is not null and v_banked = v_end then return false; end if;
  select count(*) into v_used from bookings
  where member_id = p_member and credits_used = 0
    and status in ('confirmed', 'attended') and created_at >= v_start;
  return v_used < v_allow;
end; $function$;

notify pgrst, 'reload schema';
