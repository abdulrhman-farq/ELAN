# Staging Validation & Cutover — Owner Runbook

Exact commands for the owner-controlled steps. Nothing here runs against production.
**Never paste secrets into chat, commits, or logs** — secret values go only into the
Supabase/Vercel dashboards or GitHub Secrets.

Prereqs: `supabase` CLI, `psql`, `gh` CLI, Node 20, repo checked out on
`feature/launch-hardening`.

---

## 1. GitHub branch protection (needs repo ADMIN)

Required checks: `verify`, `e2e-public`. `e2e-authenticated` and `integration`
stay non-required. Direct pushes to `main` blocked (PR + 1 review).

```bash
gh api -X PUT repos/abdulrhman-farq/ELAN/branches/main/protection \
  -H "Accept: application/vnd.github+json" --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["verify", "e2e-public"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

UI alternative: Settings → Branches → Add rule for `main` → tick *Require a pull
request before merging* and *Require status checks to pass* → search and add
`verify` and `e2e-public` → enable *Require branches to be up to date*. (The check
names only appear in the list after the workflow has run at least once on a PR.)

---

## 2. Supabase — create staging & capture missing functions

1. Dashboard → New project → name `elan-staging` (same region as prod). Record the
   **project ref** and the **DB connection string** (Project Settings → Database).
2. Capture the live functions still missing from version control (B4) so the schema
   rebuilds cleanly. Run against the **current/live** DB (read-only dump):
   ```bash
   DB_URL="postgresql://...live-or-staging-source..." bash scripts/dump_functions.sh
   ```
   This writes `supabase/migrations/0099_captured_live_functions.sql`. Review it,
   renumber/split if needed, and commit it.

---

## 3. Apply migrations 0018–0022 to STAGING

```bash
supabase link --project-ref <STAGING_REF>     # paste the DB password when prompted
supabase db push                               # applies 0018–0022 (+ 0099 capture)
```
`db push` is non-destructive (forward-only). Confirm output lists 0018–0022 applied.

⚠️ Before applying: check the auth trigger name referenced by `0018` and fix the
`drop trigger` line if it differs:
```bash
psql "$STAGING_DB_URL" -c "select tgname from pg_trigger where tgrelid='auth.users'::regclass;"
```

---

## 4. Run the RLS verification script (read-only)

```bash
psql "$STAGING_DB_URL" -f scripts/verify_rls.sql
```
Expect: every public table RLS-enabled; no `anon`/`authenticated` EXECUTE on
`simulate_purchase`/`fulfill_purchase`/`confirm_payment`/`refund_payment`. Investigate
any row flagged GAP / FAILURE before promoting.

---

## 5. Run the integration test suite against STAGING

Set the staging values (shell env or a local untracked `.env.test` — never commit):
```bash
export SUPABASE_TEST_URL="https://<STAGING_REF>.supabase.co"
export SUPABASE_TEST_ANON_KEY="<staging anon key>"
export SUPABASE_TEST_SERVICE_ROLE_KEY="<staging service-role key>"
npm test
```
Without these the suite skips. With them, `src/lib/__tests__/integration.test.ts`
runs RLS isolation, admin authorization, duplicate-booking, capacity, suspension,
and credit-floor against staging. All must pass.

To run it in CI too, add the same three as **GitHub repo secrets**
(`SUPABASE_TEST_*`) — the non-blocking `integration` job picks them up.

---

## 6. Supabase Auth settings (staging, then prod)

- Authentication → Providers → Email → enable **Confirm email**.
- Authentication → URL Configuration → Redirect URLs: allow only the canonical
  `NEXT_PUBLIC_SITE_URL` (+ `*-git-*.vercel.app` previews for staging).
- (Optional) enable CAPTCHA (hCaptcha) and Auth rate limits.

---

## 7. Vercel environment variables

Set per environment (Project → Settings → Environment Variables). Server-only vars
**must not** have a `NEXT_PUBLIC_` prefix and must not be exposed to the client.

| Variable | Scope | Secret? | Value / where to get it |
|----------|-------|---------|-------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production / Preview | public | Supabase → Project Settings → API → Project URL (prod project for Production, staging for Preview) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production / Preview | public (RLS-protected) | Supabase → API → Project API keys → `anon` |
| `SUPABASE_SERVICE_ROLE_KEY` | Production (+ Preview if testing) | **SECRET, server-only** | Supabase → API → `service_role`. Never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | Production | public | Canonical URL, e.g. `https://elan-rosy.vercel.app` (or `https://app.elan.sa`) |
| `CRON_SECRET` | Production | **SECRET** | Generate: `openssl rand -hex 32` |
| `NEXT_PUBLIC_ELAN_DEMO` | All | public | `false` |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Production | DSN (semi-public) | Sentry project → Client Keys (DSN). Optional; inert if unset. |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Production (build) | token = **SECRET** | Sentry org/project slugs + an auth token (source-map upload). Optional. |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | Production | public | hCaptcha dashboard → site key. Optional; widget inert if unset. |
| `NEXT_PUBLIC_CONTACT_EMAIL` / `_PHONE` / `_WHATSAPP` | Production | public | Real studio contact (or rely on code defaults once set in `legal.ts`). |
| `NEXT_PUBLIC_STUDIO_ADDRESS_AR` / `_EN` | Production | public | Real studio address. |

Non-secret values you can set right now: `NEXT_PUBLIC_ELAN_DEMO=false`,
`NEXT_PUBLIC_SITE_URL=<canonical>`. Generate `CRON_SECRET` locally and paste it into
Vercel (don't share it here).

---

## 8. Promote to production (after staging is green)

1. Apply the same migrations (`0018`–`0022` + `0099`) to the **prod** Supabase project.
2. Run `scripts/verify_rls.sql` against prod (read-only) — confirm clean.
3. Set prod Vercel env (table above); **rotate the previously committed demo anon key**.
4. Enable "Confirm email" + redirect URLs on the prod project.
5. Merge PR #38 (CI required checks green) → Vercel deploys.
6. Smoke test: `/api/health` returns ok; magic-link login; book/cancel; Sentry receives
   a test event; cron hits `/api/cron/notifications` (200 with secret).

Rollback: Vercel Instant Rollback for the app; DB = forward-fix migration or
owner-approved PITR (see `docs/INCIDENT_RESPONSE.md`).
