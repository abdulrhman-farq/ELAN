-- 0005_refunds_and_webhook.sql
-- Adds refund support to the payment flow and the idempotency guard the
-- (provider-agnostic) gateway webhook relies on. Idempotent / safe to re-apply.
--
-- Flow recap (see 0004):
--   create_pending_purchase -> payment 'initiated' (no credits)
--   confirm_payment(id)      -> 'paid' + fulfillment (credits / membership)
--   refund_payment(id)       -> 'refunded' + REVERSAL of any unused credits
--
-- refund_payment is the single, atomic, admin/service-only refund entry point.
-- It mirrors confirm_payment: SECURITY DEFINER, is_admin() guarded, row lock,
-- status guard, and a unique index makes the credit reversal run at most once.

begin;

-- ── 1. Ensure the 'refund' credit-ledger reason exists ──────────────────────
-- The baseline enum already includes 'refund'; this guarded add keeps the
-- migration correct against any project where it was missing. ALTER TYPE ... ADD
-- VALUE cannot run inside a transaction block in older PG, so it is wrapped in a
-- DO block that swallows the duplicate_object error.
do $$
begin
  alter type public.credit_ledger_reason add value if not exists 'refund';
exception
  when duplicate_object then null;
end$$;

-- ── 2. Idempotency guard: at most ONE 'refund' ledger row per payment ────────
-- Partial unique index on ref_id where reason='refund' is the second guard
-- (alongside the status check) preventing a payment from being reversed twice.
create unique index if not exists credit_ledger_refund_once
  on public.credit_ledger (ref_id) where reason = 'refund' and ref_id is not null;

-- ── 3. Atomic, idempotent, admin/service-only refund ────────────────────────
create or replace function public.refund_payment(
  p_payment_id uuid,
  p_amount_sar numeric default null,
  p_reason text default null
)
returns payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pay     payments;
  v_bal     int;
  v_reverse int;
begin
  -- Only an admin (or service_role, which bypasses RLS) may refund a payment.
  if not is_admin() then raise exception 'FORBIDDEN'; end if;

  -- Lock the row so concurrent refunds serialise; the status guard makes the
  -- reversal run exactly once on the paid -> refunded transition.
  select * into v_pay from payments where id = p_payment_id for update;
  if v_pay.id is null then raise exception 'PAYMENT_NOT_FOUND'; end if;

  -- Only a settled (paid) payment may be refunded. Anything else (initiated,
  -- failed, already refunded) is a no-op so retries are safe.
  if v_pay.status <> 'paid' then return v_pay; end if;

  update payments set status = 'refunded' where id = p_payment_id returning * into v_pay;

  -- Reverse unused credits for a credit pack. We never claw back credits the
  -- member has already spent: reverse only what remains of the grant, computed
  -- from the live balance. If the member has used some/all of the credits, the
  -- payment is still marked refunded and the ledger reflects reality.
  if v_pay.type = 'credit_pack' and coalesce(v_pay.credits, 0) > 0 then
    select coalesce(elan_credit_balance(v_pay.member_id), 0) into v_bal;
    v_reverse := least(v_pay.credits, greatest(v_bal, 0));
    if v_reverse > 0 then
      -- credit_ledger_refund_once (unique on ref_id where reason='refund') is
      -- the second guard against a double reversal.
      insert into credit_ledger (member_id, change, reason, balance_after, ref_id)
        values (v_pay.member_id, -v_reverse, 'refund', v_bal - v_reverse, v_pay.id)
        on conflict do nothing;
    end if;
  end if;

  return v_pay;
end;
$$;

-- ── 4. Lock down: deny PUBLIC/anon, allow signed-in users (self-guards) ──────
revoke execute on function public.refund_payment(uuid, numeric, text) from public, anon;
grant  execute on function public.refund_payment(uuid, numeric, text) to authenticated; -- self-guards via is_admin()

commit;
