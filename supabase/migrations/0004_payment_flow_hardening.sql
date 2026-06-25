-- 0004_payment_flow_hardening.sql
-- Close the critical financial hole: members could fulfill purchases for free.
--
-- Root cause: simulate_purchase (SECURITY DEFINER) was EXECUTE-granted to
-- anon/authenticated/public and called fulfill_purchase, inserting a paid
-- payment + credits/membership with NO real payment. Any signed-in member
-- could call /rest/v1/rpc/simulate_purchase and self-grant unlimited credits.
--
-- Correct flow enforced here:
--   create_pending_purchase  -> payment(status='initiated'), NO credits
--   confirm_payment (admin)  -> status='paid' THEN fulfillment + ledger/membership
--
-- Fulfillment is centralised in ONE atomic, idempotent function and is never
-- reachable by a member. simulate_purchase is locked to service_role only.

begin;

-- ── 1. Member-initiated pending purchase (no fulfillment) ───────────────────
create or replace function public.create_pending_purchase(p_type payment_type, p_ref_id uuid)
returns payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_member  uuid;
  v_pay     payments;
  v_price   numeric(10,2);
  v_credits int;
begin
  select id into v_member from members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;
  if p_type not in ('credit_pack', 'membership') then raise exception 'BAD_TYPE'; end if;

  -- Idempotent-ish: reuse an existing pending purchase for the same item so a
  -- member double-clicking "buy" does not litter the table with duplicates.
  select * into v_pay
  from payments
  where member_id = v_member and type = p_type and ref_id = p_ref_id and status = 'initiated'
  order by created_at desc
  limit 1;
  if v_pay.id is not null then return v_pay; end if;

  if p_type = 'credit_pack' then
    select price_sar, credits into v_price, v_credits from credit_packs where id = p_ref_id and active;
    if v_price is null then raise exception 'PACK_NOT_FOUND'; end if;
    insert into payments (member_id, amount_sar, currency, status, type, ref_id, credits)
      values (v_member, v_price, 'SAR', 'initiated', 'credit_pack', p_ref_id, v_credits)
      returning * into v_pay;
  else
    select price_sar into v_price from membership_plans where id = p_ref_id and active;
    if v_price is null then raise exception 'PLAN_NOT_FOUND'; end if;
    insert into payments (member_id, amount_sar, currency, status, type, ref_id)
      values (v_member, v_price, 'SAR', 'initiated', 'membership', p_ref_id)
      returning * into v_pay;
  end if;

  return v_pay;
end;
$$;

-- ── 2. Single, atomic, idempotent fulfillment (admin / service only) ────────
create or replace function public.confirm_payment(p_payment_id uuid)
returns payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pay      payments;
  v_bal      int;
  v_interval billing_interval;
  v_period   interval;
begin
  -- Only an admin (or service_role, which bypasses RLS) may confirm a payment.
  if not is_admin() then raise exception 'FORBIDDEN'; end if;

  -- Lock the row so concurrent confirms serialise; the status guard below makes
  -- fulfillment run exactly once on the initiated -> paid transition.
  select * into v_pay from payments where id = p_payment_id for update;
  if v_pay.id is null then raise exception 'PAYMENT_NOT_FOUND'; end if;

  -- Idempotent: anything other than 'initiated' is already settled — no-op.
  if v_pay.status <> 'initiated' then return v_pay; end if;

  update payments set status = 'paid' where id = p_payment_id returning * into v_pay;

  if v_pay.type = 'credit_pack' then
    if coalesce(v_pay.credits, 0) > 0 then
      select coalesce(elan_credit_balance(v_pay.member_id), 0) into v_bal;
      -- credit_ledger_purchase_once (unique on ref_id where reason='purchase')
      -- is the second guard against double credits.
      insert into credit_ledger (member_id, change, reason, balance_after, ref_id)
        values (v_pay.member_id, v_pay.credits, 'purchase', v_bal + v_pay.credits, v_pay.id)
        on conflict do nothing;
    end if;
  elsif v_pay.type = 'membership' then
    select billing_interval into v_interval from membership_plans where id = v_pay.ref_id;
    v_period := case v_interval
      when 'weekly'    then interval '7 days'
      when 'monthly'   then interval '1 month'
      when 'quarterly' then interval '3 months'
      when 'yearly'    then interval '1 year'
      else interval '1 month'
    end;
    insert into member_memberships (member_id, plan_id, status, started_at, current_period_start, current_period_end)
      values (v_pay.member_id, v_pay.ref_id, 'active', now(), now(), now() + v_period);
  end if;

  return v_pay;
end;
$$;

-- ── 3. Lock down the exposed functions ──────────────────────────────────────
-- simulate_purchase: dev/sandbox only — must NOT be reachable by app users.
revoke execute on function public.simulate_purchase(payment_type, uuid) from public, anon, authenticated;

-- Trigger functions are not meant to be callable as RPCs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.members_guard_self_update() from public, anon, authenticated;

-- New functions: deny PUBLIC/anon, allow only signed-in users.
revoke execute on function public.create_pending_purchase(payment_type, uuid) from public, anon;
grant  execute on function public.create_pending_purchase(payment_type, uuid) to authenticated;

revoke execute on function public.confirm_payment(uuid) from public, anon;
grant  execute on function public.confirm_payment(uuid) to authenticated; -- self-guards via is_admin()

commit;
