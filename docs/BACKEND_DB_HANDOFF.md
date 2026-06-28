# Backend / Database Handoff — live-DB-gated work

These items change Postgres functions/RLS and **must be applied against the staging
Supabase project first**, verified, then promoted to prod. They are documented here
(not committed as migrations) because several depend on the *current live* function
bodies, which are referenced from code but absent from `supabase/migrations/`.
Applying a reconstructed body blindly risks diverging from production data behaviour.

## Step 0 — Capture ground truth (critical path, do first)

```bash
# Against the live project (read-only dump of routines + policies):
supabase db dump --db-url "$PROD_DB_URL" --schema public -f supabase/migrations/0018_capture_live_functions.sql
```
Reconcile the dump so a clean `supabase db reset` rebuilds without "function does not
exist" errors. Functions known to be referenced but undefined in-repo:
`_elan_membership_covers`, `_elan_add_ledger`, `elan_credit_balance`,
`booking_eligibility_self`, `book_class_self`, `mark_no_show`, `checkin_by_code`,
`handle_new_user`, `simulate_purchase`, `fulfill_purchase`.

Acceptance: `supabase db reset` green on a fresh DB; `scripts/verify_rls.sql` passes.

## B1 — Atomic admin credit ledger (fixes race + negative balance)

Replace the read-compute-insert sequences in `src/admin-actions.ts` (≈L327, L514)
with a single DEFINER RPC. Draft:

```sql
create or replace function public.adjust_credits_admin(
  p_member uuid, p_delta int, p_reason text, p_ref uuid default null
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_bal int;
begin
  if not is_staff() then raise exception 'NOT_AUTHORIZED'; end if;
  perform 1 from members where id = p_member for update;          -- row lock
  v_bal := elan_credit_balance(p_member);
  if v_bal + p_delta < 0 then raise exception 'INSUFFICIENT_CREDITS'; end if;
  perform _elan_add_ledger(p_member, p_delta, p_reason, p_ref);   -- single writer
end $$;
revoke execute on function public.adjust_credits_admin(uuid,int,text,uuid) from public, anon, authenticated;
```
Then call it via the existing `staffClient()` path; keep the `pricing_audit` insert in
the same transaction as the booking/ledger mutation.

Acceptance: a concurrency test (two parallel adjustments) never corrupts
`balance_after` and never goes below 0.

## B3 — Suspension in booking eligibility

After capturing the live `booking_eligibility` body, add the suspension branch so the
CTA is disabled instead of failing on submit:

```sql
-- inside booking_eligibility / booking_eligibility_self, before the ELIGIBLE return:
if exists (
  select 1 from members m
  where m.id = v_member and m.member_suspended_until is not null
    and m.member_suspended_until > now()
) then
  return 'SUSPENDED';
end if;
```
Map `'SUSPENDED'` in `src/lib/cta.ts` to a disabled CTA + explanatory label.

Acceptance: a suspended member sees a disabled "Book" with reason; never reaches a
failed booking attempt.

## B2 — Notification delivery worker

`notifications` rows are inserted with `status='pending'` but never sent
(`getMessageProvider()` is never called). Add a cron-driven drainer.

1. `vercel.json` cron (Node runtime route):
```json
{ "crons": [{ "path": "/api/cron/notifications", "schedule": "*/2 * * * *" }] }
```
2. `src/app/api/cron/notifications/route.ts` — authenticate with `CRON_SECRET`
   (`Authorization: Bearer`), use a **service-role** client, select pending rows,
   call `getMessageProvider().send(...)`, set `sent_at`/`status='sent'`, and mark
   `status='failed'` with a retry counter on error (dead-letter after N attempts).

Acceptance: a pending notification is delivered and stamped `sent_at` within one cron
interval; failures retry then dead-letter. Prioritise waitlist-promotion + spot-opened.

## RLS verification (CI gate)

`scripts/verify_rls.sql` should assert: RLS enabled on every table; expected policies
present; and **no `anon`/`authenticated` EXECUTE** on `simulate_purchase`. Wire into
the CI `verify` job after a `supabase db reset` against an ephemeral DB.

## Security follow-ups (DB-side)
- Gate `handle_new_user` member-linking on `new.email_confirmed_at is not null` (S1).
- Harden the admin member-search `.or()` filter in `src/lib/admin.ts` (use the array form).
