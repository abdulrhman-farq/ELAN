# ELAN — Launch Readiness Status

> Single source of truth for the non-payment production-readiness program.
> Payments are **out of scope** (gateway, checkout, billing, refunds, invoices, ZATCA, subscriptions).
> Branch: `feature/launch-hardening`. Last updated: 2026-06-28.

## Verification gates (this branch)

| Gate | Status | Notes |
|------|--------|-------|
| `npm run lint` | ✅ pass | no warnings/errors |
| `npm run typecheck` | ✅ pass | clean |
| `npm test` | ✅ pass | 39 passing, 14 skipped (live-DB integration — see Backend) |
| `npm run build` | ✅ pass | with Supabase env set; **fails fast without env by design** |
| e2e — public/legal/a11y | ✅ CI (required) | `e2e-public` job; deterministic, no secrets needed |
| e2e — authenticated/member/admin | ⏳ pending staging | `e2e-authenticated` job; **non-blocking** (`continue-on-error`), runs only when `E2E_*` secrets exist |

### CI jobs & required checks
- **Required (must pass to merge):** `verify` (lint · typecheck · unit tests · build) and `e2e-public` (public + legal + a11y).
- **Non-blocking:** `e2e-authenticated` — gated on staging `E2E_*` secrets; no-ops with a CI notice until staging Supabase is provisioned, and `continue-on-error: true` so it never fails the PR.
- ⚠️ **Owner action:** in GitHub branch-protection for `main`, add `verify` and `e2e-public` as required status checks; do **not** add `e2e-authenticated`. (Branch protection is a repo setting, not in the YAML.)

## Done (implemented + verified in-repo)

### Security & Auth
- **Env fail-fast** — `src/lib/supabase/config.ts` throws in production if `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` are unset (no silent demo-DB fallback). Covered by `src/lib/__tests__/config.test.ts`.
- **Security headers** — `next.config.ts` adds X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS on all routes.
- **Middleware** — `src/middleware.ts` refreshes the Supabase session each request and gates protected segments (defense-in-depth behind RLS). Excludes `/api/*` so the webhook raw body is untouched.

### Frontend & UX
- **Profile editing** — new `/profile/edit` route + `EditProfileForm` + `updateProfileAction`; name/phone editable, email read-only (locked by RLS/trigger). Dead "Payment method" row removed; "Personal details" → edit page; "Notifications" → in-app inbox anchor.
- **Confirmation status** — `confirmation/[bookingId]` now branches on `status` (waitlisted vs confirmed); no more false "confirmed" for waitlisted bookings.
- **Home "Today" bug** — next-class label uses the real day (`isTodayInRiyadh` + `fmtDayHeading`).
- **Login** — rebuilt as a locale-aware server/client pair; **magic link is the primary CTA**, staff password behind a disclosure; all strings moved into the dictionary (no hardcoded Arabic); legal links added.
- **i18n** — `WatchButton` strings moved into the dictionary; new `watch`, `legal`, login and profile-edit keys in both locales.
- **App version** — sourced from `package.json` via `next.config` env (`APP_VERSION`), no longer hardcoded.
- **Studio location** — confirmation shows "ÉLAN Studio · Riyadh"; full address on `/contact`.

### Compliance & Legal
- **Privacy, Terms, Contact** pages — `src/app/(legal)/*`, bilingual AR/EN, PDPL-aware content in `src/lib/legal.ts`; linked from login and profile.
- Contact/studio facts read from env (`NEXT_PUBLIC_CONTACT_*`, `NEXT_PUBLIC_STUDIO_ADDRESS_*`) with public defaults — **must be set to real values before launch** (see Handoff).

### DevOps
- **CI** — `.github/workflows/ci.yml`: `verify` job (install→lint→typecheck→test→build) + `e2e` job, gating PRs to `main`.

### QA
- New `config.test.ts` (fail-fast). `e2e/public.spec.ts` updated for the new login UX + protected-route redirects, and extended with legal-page coverage.

### Cycle 2 (safe in-repo, PR #38 follow-on)
- **Home discover** now shows upcoming bookable classes across the next 7 days (`getDiscoverClasses`), not just today; tiles show a day label.
- **Cookie consent** notice (`CookieConsent`), bilingual/PDPL-aware, mounted in the root layout, persisted to `localStorage`, links to `/privacy`.
- **Accessibility tests** — `@axe-core/playwright` + `e2e/a11y.spec.ts` scanning `/login`, `/privacy`, `/terms`, `/contact` for serious/critical WCAG 2 A/AA violations.
- **Playwright config** hardened: Chromium executablePath is now conditional so CI (`npx playwright install`) auto-detects the browser instead of failing on the sandbox path.
- **i18n cleanup** — moved the membership "Selected" label into the dictionary; remaining Arabic literals are the intentionally Arabic-only admin/trainer console and language-toggle endonyms.

## Backend (Milestone 2) — written in-repo, ⏳ PENDING STAGING VALIDATION
All artifacts below exist in the repo as **ready-to-apply, forward-only** migrations/scripts/tests. They are **not validated** — none has run against a Supabase DB. Apply to a **staging** project first (see `docs/BACKEND_DB_HANDOFF.md`), run `scripts/verify_rls.sql` + the integration suite, then promote. **Do not apply to production unverified.**

- **`0018_harden_handle_new_user.sql` (S1)** — gates email-based member linking on `email_confirmed_at` (account-takeover fix) and re-points the auth trigger to fire on confirmation. ⚠️ Verify the existing trigger name + that Supabase "Confirm email" is enabled before applying.
- **`0019_adjust_credits_admin.sql` (B1)** — atomic, staff-only, floored credit RPC (row lock + `INSUFFICIENT_CREDITS`). App wiring in `src/admin-actions.ts` flips to call it **after** it exists in the connected DB (not yet wired — see handoff).
- **`0020_suspension_aware_eligibility.sql` (B3)** — adds a `SUSPENDED` branch to `booking_eligibility`. App side is wired now (`cta.ts` + `i18n` + class page) and is harmless until the migration lands (the function simply never returns `SUSPENDED` yet).
- **`0021_notification_delivery_queue.sql` (B2)** — additive `attempts`/`last_error`/`updated_at` columns + partial pending index, consumed by the worker.
- **Notification worker** — `src/app/api/cron/notifications/route.ts` + `vercel.json` cron (`*/2 * * * *`). Inert (503) without `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY`.
- **B4 capture** — `scripts/dump_functions.sh` dumps the live function bodies still missing from version control; `scripts/verify_rls.sql` asserts RLS + sensitive-function grants. A full from-scratch `supabase db reset` will not pass until B4 capture is committed.

### Conditional integration tests (run on staging only)
`src/lib/__tests__/integration.test.ts` (replaces the 14 skipped stubs) covers RLS isolation, admin-action authorization, duplicate-booking, capacity, suspension-blocks-booking, and credit-floor. Gated on `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` / `SUPABASE_TEST_SERVICE_ROLE_KEY` — **skips cleanly** without them (keeps `npm test` green), runs for real when set.

## Owner / external actions (cannot be done from repo)
- Enable **"Confirm email"** in Supabase Auth; restrict redirect URLs (S1 — account-takeover).
- Create the **staging Supabase project** + Vercel Preview env; set prod env vars; **rotate** the committed demo anon key.
- Apply migrations `0018`–`0021` + the B4 capture to **staging**, run `scripts/verify_rls.sql` and the integration suite (set `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` / `SUPABASE_TEST_SERVICE_ROLE_KEY`), then promote.
- Set `CRON_SECRET` + `SUPABASE_SERVICE_ROLE_KEY` (server-only) so the notification worker runs; pick a messaging provider (Resend/WhatsApp) for real delivery.
- Provision **hCaptcha** (CAPTCHA on OTP), **Sentry** DSN, **Resend** custom SMTP, uptime monitor.
- Provide real **legal/contact facts** (registered entity, CR/VAT, DPO, address, phone, email).

## Remaining true blockers (external access required)
1. Staging Supabase project — gates all DB/RLS validation (the single biggest blocker).
2. Supabase Auth "Confirm email" toggle — gates the S1 takeover fix going live.
3. B4 function capture from the live DB — gates a reproducible from-scratch rebuild.
4. Prod env vars + key rotation + branch-protection required checks — gate cutover.

## Risks
- Middleware uses `@supabase/ssr` on the Edge runtime — build shows the known `process.version` warning from supabase-js; compiles and runs, but watch for Edge runtime issues; can pin middleware to Node runtime if needed.
- Discover-on-home still shows today-only classes (Medium polish, deferred).
