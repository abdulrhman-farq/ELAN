-- ÉLAN security & financial hardening — idempotent (safe to re-apply).
-- Captures the fixes applied during the production-hardening pass.

-- 1) Identity: remove email-based RLS (use auth_user_id only).
drop policy if exists members_self_email_select on public.members;
drop policy if exists members_self_email_update on public.members;

-- 2) One member per email (deterministic linking).
create unique index if not exists members_email_unique
  on public.members (lower(email)) where email is not null;

-- 3) Payments: credits recorded at sale, applied only when paid.
alter table public.payments add column if not exists credits integer not null default 0;

-- 4) Idempotency: a payment funds at most ONE 'purchase' credit-ledger row.
create unique index if not exists credit_ledger_purchase_once
  on public.credit_ledger (ref_id) where reason = 'purchase' and ref_id is not null;

-- 5) Prevent double-booking the same class while an active booking exists.
create unique index if not exists uniq_active_booking
  on public.bookings (class_instance_id, member_id)
  where status in ('confirmed','waitlisted');

-- 6) Pin search_path on all custom functions (defense in depth).
alter function public.is_admin() set search_path = public, pg_temp;
alter function public.current_member_id() set search_path = public, pg_temp;
alter function public.handle_new_user() set search_path = public, pg_temp;
alter function public.book_class(uuid, uuid, booking_source) set search_path = public, pg_temp;
alter function public.book_class_self(uuid, booking_source) set search_path = public, pg_temp;
alter function public.booking_eligibility(uuid, uuid) set search_path = public, pg_temp;
alter function public.booking_eligibility_self(uuid) set search_path = public, pg_temp;
alter function public.cancel_booking(uuid, uuid) set search_path = public, pg_temp;
alter function public.cancel_booking_self(uuid) set search_path = public, pg_temp;
alter function public.elan_credit_balance(uuid) set search_path = public, pg_temp;
alter function public.fulfill_purchase(uuid, payment_type, uuid, text) set search_path = public, pg_temp;
alter function public.mark_no_show(uuid) set search_path = public, pg_temp;
alter function public.simulate_purchase(payment_type, uuid) set search_path = public, pg_temp;

-- 7) Column guard: a non-admin member may only edit safe profile fields on her
--    own row; level/role/email/auth_user_id/lead_status/source stay locked.
create or replace function public.members_guard_self_update()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $fn$
begin
  if not public.is_admin() then
    new.level             := old.level;
    new.role              := old.role;
    new.auth_user_id      := old.auth_user_id;
    new.email             := old.email;
    new.phone             := coalesce(new.phone, old.phone);
    new.lead_status       := old.lead_status;
    new.source            := old.source;
    new.recommended_class := old.recommended_class;
    new.waiver_accepted   := old.waiver_accepted;
  end if;
  return new;
end $fn$;

drop trigger if exists members_guard_self_update_trg on public.members;
create trigger members_guard_self_update_trg
  before update on public.members
  for each row execute function public.members_guard_self_update();
