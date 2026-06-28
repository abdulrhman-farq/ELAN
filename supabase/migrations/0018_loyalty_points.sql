-- 0018 Loyalty points (#2)
-- Earn 1 point per 1 SAR spent (on any paid payment). 1000 points = 50 SAR of
-- studio credit, redeemable on products/drinks/workshops only (NOT subscriptions,
-- so it never discounts core recurring revenue). Earning is automatic; redeeming
-- and manual adjustments are staff-gated.

create table if not exists public.loyalty_ledger (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  points integer not null,                 -- +earn / -redeem / +/-adjust
  reason text not null,                     -- 'earn' | 'redeem' | 'adjust'
  payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists loyalty_ledger_member_idx on public.loyalty_ledger(member_id);
alter table public.loyalty_ledger enable row level security;

drop policy if exists loyalty_select_own on public.loyalty_ledger;
create policy loyalty_select_own on public.loyalty_ledger
  for select to authenticated
  using (member_id = public.current_member_id() or public.is_staff());

create or replace function public.elan_points_balance(p_member uuid)
returns integer language sql stable security definer set search_path = public, pg_temp as $$
  select coalesce(sum(points), 0)::int from public.loyalty_ledger where member_id = p_member;
$$;
grant execute on function public.elan_points_balance(uuid) to authenticated;

-- Award points when a payment becomes paid (idempotent: one 'earn' row per payment).
create or replace function public._elan_award_points()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
declare v_pts int;
begin
  if new.status = 'paid' and (tg_op = 'INSERT' or old.status is distinct from 'paid') then
    v_pts := floor(coalesce(new.gross_halalas, round(coalesce(new.amount_sar,0) * 100)) / 100.0);
    if v_pts > 0 and not exists (select 1 from public.loyalty_ledger where payment_id = new.id and reason = 'earn') then
      insert into public.loyalty_ledger (member_id, points, reason, payment_id)
        values (new.member_id, v_pts, 'earn', new.id);
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists payments_award_points on public.payments;
create trigger payments_award_points after insert or update of status on public.payments
  for each row execute function public._elan_award_points();

-- Redeem points (staff): converts points to SAR studio credit value. Returns the
-- SAR value redeemed (points / 1000 * 50). Does not touch class credits.
create or replace function public.redeem_points(p_member uuid, p_points integer)
returns numeric language plpgsql security definer set search_path = public, pg_temp as $$
declare v_bal int;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_points is null or p_points <= 0 then raise exception 'BAD_AMOUNT'; end if;
  select public.elan_points_balance(p_member) into v_bal;
  if v_bal < p_points then raise exception 'INSUFFICIENT_POINTS'; end if;
  insert into public.loyalty_ledger (member_id, points, reason) values (p_member, -p_points, 'redeem');
  return round((p_points / 1000.0) * 50, 2);
end; $$;
revoke execute on function public.redeem_points(uuid, integer) from anon;
grant execute on function public.redeem_points(uuid, integer) to authenticated;

-- Manual adjustment (staff): +/- points with a reason.
create or replace function public.adjust_points(p_member uuid, p_points integer, p_reason text default 'adjust')
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_points is null or p_points = 0 then raise exception 'BAD_AMOUNT'; end if;
  insert into public.loyalty_ledger (member_id, points, reason) values (p_member, p_points, coalesce(p_reason,'adjust'));
end; $$;
revoke execute on function public.adjust_points(uuid, integer, text) from anon;
grant execute on function public.adjust_points(uuid, integer, text) to authenticated;

-- Backfill points for already-paid payments.
insert into public.loyalty_ledger (member_id, points, reason, payment_id)
select p.member_id, floor(coalesce(p.gross_halalas, round(coalesce(p.amount_sar,0)*100))/100.0)::int, 'earn', p.id
from public.payments p
where p.status = 'paid'
  and floor(coalesce(p.gross_halalas, round(coalesce(p.amount_sar,0)*100))/100.0) > 0
  and not exists (select 1 from public.loyalty_ledger l where l.payment_id = p.id and l.reason = 'earn');

notify pgrst, 'reload schema';
