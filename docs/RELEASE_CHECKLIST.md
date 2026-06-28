# ELAN — Release Checklist

> Pre-deploy → Deploy → Post-deploy gate for shipping to production.
> Deploy target: **Vercel** project `elan` · GitHub `abdulrhman-farq/ELAN` · branch `main`.
> Payments are **out of scope** — no billing/checkout steps here.
> See also: [`RUNBOOK.md`](./RUNBOOK.md) · [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md) · [`LAUNCH_STATUS.md`](./LAUNCH_STATUS.md)

---

## 0. Pre-flight (once per environment, re-check on changes)

### Environment variables set per Vercel environment (Production / Preview)
Set in Vercel → Project `elan` → Settings → Environment Variables. Server-only keys must **never** carry the `NEXT_PUBLIC_` prefix. Full reference: [`RUNBOOK.md`](./RUNBOOK.md#environment-variables).

- [ ] `NEXT_PUBLIC_SUPABASE_URL` set (real project, not demo) — **fail-fast**: build/runtime throws in prod if unset
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (rotated; committed demo key is **not** used in prod) — **fail-fast**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only — never `NEXT_PUBLIC`)
- [ ] `NEXT_PUBLIC_SITE_URL` set to the production URL
- [ ] `NEXT_PUBLIC_ELAN_DEMO` **OFF / unset in production** (demo flag must be off in prod)
- [ ] `CRON_SECRET` set (server-only) — required for the notification worker
- [ ] `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` set (Sentry is inert without them)
- [ ] `NEXT_PUBLIC_CONTACT_*` + `NEXT_PUBLIC_STUDIO_ADDRESS_*` set to **real** legal/contact facts (defaults are placeholders)
- [ ] Preview env mirrors staging Supabase (not prod) so previews never touch prod data

### Supabase Auth (owner action, external)
- [ ] "Confirm email" enabled (gates the S1 account-takeover fix — required before `0018` goes live)
- [ ] Redirect / allow-list URLs restricted to known hosts

### Branch protection on `main` (GitHub repo setting — not in YAML)
- [ ] `verify` added as a **required** status check
- [ ] `e2e-public` added as a **required** status check
- [ ] `e2e-authenticated` **NOT** required (non-blocking, `continue-on-error`)

---

## 1. Pre-deploy

### CI green on the PR
- [ ] `verify` job green (lint · typecheck · unit tests · build)
- [ ] `e2e-public` job green (public + legal + a11y)
- [ ] `e2e-authenticated` reviewed if it ran (informational only; never blocks)
- [ ] PR approved and up to date with `main`

### Database migrations — staging FIRST, in order
> Forward-only. No down-migrations. Never apply unverified migrations to prod.
- [ ] B4 function capture committed (`scripts/dump_functions.sh`) so a clean `supabase db reset` succeeds
- [ ] Migrations `0018` → `0019` → `0020` → `0021` applied to **staging** in numeric order
- [ ] `scripts/verify_rls.sql` passes on staging (RLS on every table; no `anon`/`authenticated` EXECUTE on sensitive funcs)
- [ ] Integration suite run on staging with `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` / `SUPABASE_TEST_SERVICE_ROLE_KEY`
- [ ] App wiring flipped only after the matching migration exists in the connected DB (e.g. `adjust_credits_admin` call after `0019`)
- [ ] Migrations `0018`–`0021` are **PENDING STAGING VALIDATION** — confirm validation done before promoting

### Promote DB to production
- [ ] Same migrations applied to **production** in the same order, after staging is green
- [ ] `scripts/verify_rls.sql` re-run against production

---

## 2. Deploy

- [ ] Merge PR to `main` (triggers Vercel production deployment)
- [ ] Vercel build succeeds (env present → no fail-fast throw)
- [ ] Note the new deployment ID / commit SHA for rollback reference
- [ ] Cron registered: `/api/cron/notifications` (`*/2 * * * *`) present in `vercel.json` and shown in Vercel Crons

---

## 3. Post-deploy smoke tests

- [ ] Home loads (EN + AR), no console errors
- [ ] `/login` renders; magic-link CTA primary; legal links present
- [ ] `/privacy`, `/terms`, `/contact` load with real contact facts (not placeholders)
- [ ] Member: book a class → confirmation reflects correct `confirmed` vs `waitlisted` status
- [ ] Admin console reachable; member search works
- [ ] `/admin/health` green
- [ ] `/admin/export` produces a CSV (writes a `pricing_audit` row)
- [ ] Confirm `NEXT_PUBLIC_ELAN_DEMO` is off (no demo banner / demo data in prod)

### Observability
- [ ] Sentry receiving events (trigger a test error or confirm a real event lands in the prod project)
- [ ] Uptime monitor pinging the prod URL and green

### Notification worker
- [ ] `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` set → worker returns 200 (not 503) on the next run
- [ ] A pending notification gets `status='sent'` + `sent_at` within one cron interval

---

## 4. Sign-off

- [ ] Smoke tests pass
- [ ] No new SEV alerts in the first 30 min (see [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md))
- [ ] `LAUNCH_STATUS.md` updated if gates changed
- [ ] Rollback path confirmed: Vercel Instant Rollback to the prior deployment; DB = forward-fix or owner-approved PITR

---

## Rollback quick reference
- **App / release-related:** Vercel → Deployments → previous good deployment → **Instant Rollback**.
- **Database:** **no down-migrations** — ship a forward-fix migration, or owner-approved **PITR** (see [`RUNBOOK.md`](./RUNBOOK.md) and [`INCIDENT_RESPONSE.md`](./INCIDENT_RESPONSE.md)).
