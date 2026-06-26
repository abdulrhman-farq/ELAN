-- 0006_service_role_payment_rpcs.sql
-- P1 fix: a payment-gateway webhook authenticates with the service_role key, not
-- an admin member session. confirm_payment/refund_payment previously raised
-- FORBIDDEN unless is_admin(), so real paid/refunded webhooks could never fulfill
-- a purchase automatically. Allow EITHER an admin OR the service_role.

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
  if not (public.is_admin() or auth.role() = 'service_role') then raise exception 'FORBIDDEN'; end if;

  select * into v_pay from payments where id = p_payment_id for update;
  if v_pay.id is null then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if v_pay.status <> 'initiated' then return v_pay; end if;

  update payments set status = 'paid' where id = p_payment_id returning * into v_pay;

  if v_pay.type = 'credit_pack' then
    if coalesce(v_pay.credits, 0) > 0 then
      select coalesce(elan_credit_balance(v_pay.member_id), 0) into v_bal;
      insert into credit_ledger (member_id, change, reason, balance_after, ref_id)
        values (v_pay.member_id, v_pay.credits, 'purchase', v_bal + v_pay.credits, v_pay.id)
        on conflict do nothing;
    end if;
  elsif v_pay.type = 'membership' then
    select billing_interval into v_interval from membership_plans where id = v_pay.ref_id;
    v_period := case v_interval
      when 'weekly' then interval '7 days' when 'monthly' then interval '1 month'
      when 'quarterly' then interval '3 months' when 'yearly' then interval '1 year'
      else interval '1 month' end;
    insert into member_memberships (member_id, plan_id, status, started_at, current_period_start, current_period_end)
      values (v_pay.member_id, v_pay.ref_id, 'active', now(), now(), now() + v_period);
  end if;
  return v_pay;
end;
$$;

create or replace function public.refund_payment(p_payment_id uuid, p_amount_sar numeric default null, p_reason text default null)
returns payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_pay payments; v_bal int; v_reverse int;
begin
  if not (public.is_admin() or auth.role() = 'service_role') then raise exception 'FORBIDDEN'; end if;

  select * into v_pay from payments where id = p_payment_id for update;
  if v_pay.id is null then raise exception 'PAYMENT_NOT_FOUND'; end if;
  if v_pay.status <> 'paid' then return v_pay; end if;

  update payments set status = 'refunded' where id = p_payment_id returning * into v_pay;

  if v_pay.type = 'credit_pack' and coalesce(v_pay.credits, 0) > 0 then
    select coalesce(elan_credit_balance(v_pay.member_id), 0) into v_bal;
    v_reverse := least(v_pay.credits, greatest(v_bal, 0));
    if v_reverse > 0 then
      insert into credit_ledger (member_id, change, reason, balance_after, ref_id)
        values (v_pay.member_id, -v_reverse, 'refund', v_bal - v_reverse, v_pay.id)
        on conflict do nothing;
    end if;
  end if;
  return v_pay;
end;
$$;
