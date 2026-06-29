-- 0020 First-trial offers (عروض التجربة الأولى)
-- Intro pricing that only a brand-new member may buy once. A pack/plan flagged
-- first_time_only is purchasable only by a member who has never paid and never
-- held a class seat. Enforced in create_pending_purchase so it cannot be
-- bypassed by calling the RPC directly.

-- 1. Offer flag on both catalogue tables.
alter table public.credit_packs     add column if not exists first_time_only boolean not null default false;
alter table public.membership_plans add column if not exists first_time_only boolean not null default false;

-- 2. First-time test: no paid payment and no seat-holding booking, ever.
create or replace function public.elan_is_first_time(p_member uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select not exists (select 1 from payments  where member_id = p_member and status = 'paid')
     and not exists (select 1 from bookings  where member_id = p_member
                       and status in ('confirmed','attended','no_show','late_cancelled'));
$$;
grant execute on function public.elan_is_first_time(uuid) to authenticated;

-- 3. Re-create the pending-purchase RPC with the first-time guard added.
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
  v_first   boolean;
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
    select price_sar, credits, first_time_only into v_price, v_credits, v_first
      from credit_packs where id = p_ref_id and active;
    if v_price is null then raise exception 'PACK_NOT_FOUND'; end if;
    if v_first and not public.elan_is_first_time(v_member) then raise exception 'NOT_FIRST_TIME'; end if;
    insert into payments (member_id, amount_sar, currency, status, type, ref_id, credits)
      values (v_member, v_price, 'SAR', 'initiated', 'credit_pack', p_ref_id, v_credits)
      returning * into v_pay;
  else
    select price_sar, first_time_only into v_price, v_first
      from membership_plans where id = p_ref_id and active;
    if v_price is null then raise exception 'PLAN_NOT_FOUND'; end if;
    if v_first and not public.elan_is_first_time(v_member) then raise exception 'NOT_FIRST_TIME'; end if;
    insert into payments (member_id, amount_sar, currency, status, type, ref_id)
      values (v_member, v_price, 'SAR', 'initiated', 'membership', p_ref_id)
      returning * into v_pay;
  end if;

  return v_pay;
end;
$$;

-- 4. Admin write policies so the offers can be toggled from the console
--    (catalogue was previously service-role / SQL managed only).
drop policy if exists credit_packs_admin_write on public.credit_packs;
create policy credit_packs_admin_write on public.credit_packs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists membership_plans_admin_write on public.membership_plans;
create policy membership_plans_admin_write on public.membership_plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. Flag the existing ÉLAN Trial pack as a first-visit-only intro offer.
update public.credit_packs
   set first_time_only = true
 where lower(name_en) like '%trial%' or name_ar like '%تجربة%';

notify pgrst, 'reload schema';
