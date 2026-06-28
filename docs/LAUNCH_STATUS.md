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
| `npm run test:e2e` | ⏳ CI | runs in CI `e2e` job (needs Playwright browsers) |

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

## In progress / Backend (live-DB-gated)
See `docs/BACKEND_DB_HANDOFF.md`. These require access to the live/staging Supabase DB and **cannot be safely completed from the repo alone**:
- **Migration capture (B4, critical path)** — `_elan_membership_covers`, `_elan_add_ledger`, `elan_credit_balance`, `booking_eligibility_self`, `book_class_self`, `mark_no_show`, `checkin_by_code`, `handle_new_user`, etc. are referenced but not defined in `supabase/migrations/`.
- **Atomic admin credit RPC (B1)** — replace the read-compute-insert ledger writes in `src/admin-actions.ts` with a DEFINER RPC (row lock + balance floor).
- **Suspension in eligibility (B3)** — add `member_suspended_until` to `booking_eligibility`.
- **Notification delivery (B2)** — cron worker to drain `notifications` (status `pending` → `sent`).
- **RLS verification** — `scripts/verify_rls.sql` + CI `db reset` job.

## Owner / external actions (cannot be done from repo)
- Enable **"Confirm email"** in Supabase Auth; restrict redirect URLs (S1 — account-takeover).
- Create the **staging Supabase project** + Vercel Preview env; set prod env vars; **rotate** the committed demo anon key.
- Provision **hCaptcha** (CAPTCHA on OTP), **Sentry** DSN, **Resend** custom SMTP, uptime monitor.
- Provide real **legal/contact facts** (registered entity, CR/VAT, DPO, address, phone, email).

## Risks
- Middleware uses `@supabase/ssr` on the Edge runtime — build shows the known `process.version` warning from supabase-js; compiles and runs, but watch for Edge runtime issues; can pin middleware to Node runtime if needed.
- Discover-on-home still shows today-only classes (Medium polish, deferred).
