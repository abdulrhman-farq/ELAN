# ELAN — Operations Runbook

> Operational reference for running ELAN in production.
> Stack: Next.js 15 on **Vercel** (`elan`) + **Supabase** (Postgres/RLS/Auth). KSA market, bilingual AR/EN.
> Payments are **out of scope**.
> See also: [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) · [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) · [`BACKEND_DB_HANDOFF.md`](./BACKEND_DB_HANDOFF.md) · [`LAUNCH_STATUS.md`](./LAUNCH_STATUS.md)

---

## Environment variables

Set per Vercel environment (Production / Preview). **Server-only** keys must **never** use the `NEXT_PUBLIC_` prefix — that prefix ships the value to the browser.

| Variable | Scope | Required | Notes |
|----------|-------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ | Supabase project URL. **Fail-fast**: prod build/runtime throws if unset (no demo fallback). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ | Anon key. **Rotate** the committed demo key before prod. **Fail-fast** if unset. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** | ✅ | Full-access key. **Never** `NEXT_PUBLIC`. Used by admin paths + notification worker. |
| `NEXT_PUBLIC_SITE_URL` | Public | ✅ | Canonical prod URL (links, redirects). |
| `NEXT_PUBLIC_ELAN_DEMO` | Public | ✅ off | Demo flag. **Must be off / unset in production.** |
| `CRON_SECRET` | **Server-only** | ✅ | Bearer token for `/api/cron/notifications`. Worker returns 503 without it. Never `NEXT_PUBLIC`. |
| `SENTRY_DSN` | **Server-only** | ⚠️ | Server-side Sentry. Sentry is inert without it. |
| `NEXT_PUBLIC_SENTRY_DSN` | Public | ⚠️ | Client-side Sentry. Inert without it. |
| `NEXT_PUBLIC_CONTACT_*` | Public | ✅ | Real contact facts (email/phone/etc.). Defaults are placeholders — set before launch. |
| `NEXT_PUBLIC_STUDIO_ADDRESS_*` | Public | ✅ | Real studio address (AR/EN). Placeholder defaults. |
| `APP_VERSION` | Build | auto | Sourced from `package.json` via `next.config`. |
| `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` / `SUPABASE_TEST_SERVICE_ROLE_KEY` | CI / staging | optional | Enable the live integration suite; tests skip cleanly without them. |
| `E2E_*` | CI | optional | Gate the non-blocking `e2e-authenticated` job. |

> Rule of thumb: if it's a secret (service role, cron secret, server DSN), it is **server-only**. If the browser needs it, it's `NEXT_PUBLIC_` and is therefore **not** a secret.

---

## Common operations

### Apply migrations (staging → prod)
> Forward-only. No down-migrations. **Validate on staging before prod.** Migrations `0018`–`0021` are **PENDING STAGING VALIDATION**.

1. Capture missing live functions first (B4) so a clean reset succeeds:
   ```bash
   bash scripts/dump_functions.sh        # or supabase db dump (see below)
   ```
2. Apply to **staging** in numeric order: `0018` → `0019` → `0020` → `0021`.
3. Verify on staging:
   ```bash
   psql "$STAGING_DB_URL" -f scripts/verify_rls.sql
   ```
4. Run the integration suite on staging with `SUPABASE_TEST_*` set.
5. Flip app wiring that depends on a migration only **after** it exists in the connected DB (e.g. the `adjust_credits_admin` RPC call after `0019`).
6. Promote: apply the same migrations to **prod** in the same order; re-run `verify_rls.sql`.

### Run RLS verification
```bash
psql "$DB_URL" -f scripts/verify_rls.sql
```
Asserts: RLS enabled on every table; expected policies present; **no `anon`/`authenticated` EXECUTE** on sensitive functions (e.g. `simulate_purchase`).

### Capture live function bodies (B4)
Several functions are referenced from code but missing from `supabase/migrations/` (`_elan_membership_covers`, `_elan_add_ledger`, `elan_credit_balance`, `booking_eligibility_self`, `book_class_self`, `mark_no_show`, `checkin_by_code`, `handle_new_user`, `simulate_purchase`, `fulfill_purchase`).
```bash
bash scripts/dump_functions.sh
# or, read-only dump of routines + policies:
supabase db dump --db-url "$PROD_DB_URL" --schema public -f supabase/migrations/0018_capture_live_functions.sql
```
Acceptance: a fresh `supabase db reset` rebuilds with no "function does not exist" errors and `verify_rls.sql` passes. Commit the capture.

### Rotate keys
1. Rotate in **Supabase** (anon / service-role) — Project Settings → API.
2. Update the matching values in **Vercel** env (correct env scope; keep service role server-only).
3. Redeploy so the app picks up new values; verify `/admin/health` and a smoke test.
4. After rotation, confirm the old key no longer works.

### Notification cron — trigger & inspect
- Schedule: `vercel.json` cron `*/2 * * * *` → `/api/cron/notifications`.
- Requires `CRON_SECRET` **and** `SUPABASE_SERVICE_ROLE_KEY` (returns **503** if either is missing).
- Manual invoke (sanity check):
  ```bash
  curl -s -H "Authorization: Bearer $CRON_SECRET" https://<prod-host>/api/cron/notifications
  ```
- Inspect: Vercel → Crons + Function logs; in the DB, pending rows have `status='pending'`, delivered rows get `status='sent'` + `sent_at`; failures increment `attempts` / set `last_error` (columns from `0021`) and dead-letter after N attempts.

### Read logs
- **Vercel** → Project `elan` → Logs (runtime + build) and Crons.
- **Sentry** → prod project for errors/traces.
- **`/admin/health`** for live app + DB connectivity.
- **Supabase** → Logs (Postgres / Auth / API).

### Rollback
- **App:** Vercel → Deployments → previous good → **Instant Rollback**.
- **DB:** forward-fix migration (validate on staging first) or **owner-approved PITR**. No down-migrations.

### Backups & export
- Supabase daily backups + PITR — **verify the plan actually includes PITR** before relying on it.
- Admin CSV export at `/admin/export` (writes a `pricing_audit` row per export).

---

## Never do

- ❌ **Never** edit / migrate the **production** DB without validating on **staging** first (run `scripts/verify_rls.sql` + integration suite).
- ❌ **Never** write a down-migration — fixes are forward-only; data recovery is owner-approved PITR.
- ❌ **Never** commit secrets to git (service role key, `CRON_SECRET`, server DSN). Use Vercel env vars.
- ❌ **Never** give a secret a `NEXT_PUBLIC_` prefix (it would ship to the browser).
- ❌ **Never** enable `NEXT_PUBLIC_ELAN_DEMO` in production.
- ❌ **Never** point Preview/staging at the **production** Supabase project.
- ❌ **Never** flip app wiring to call a DB function before that migration is applied to the connected environment.
- ❌ **Never** run a PITR without owner approval — it rewinds the entire database.
