# ELAN — Decisions & Trade-offs

Plain log of the meaningful choices made while building, so a non-coder can
understand what's real, what's mocked, and what's intentionally simplified.

## Architecture

- **One Next.js app (App Router, TypeScript)** holds the member UI, the admin UI
  (`/admin`), and all server logic via Server Components + Server Actions. No
  separate backend server.
- **Supabase** (hosted PostgreSQL + Auth) is the single source of truth. All
  business logic that touches concurrency (booking, waitlist promotion,
  cancellation/penalties, credits) lives in **Postgres functions (RPC)** with
  row locking, so two members can never take the last spot. The app just calls
  them. Migrations are in `../supabase/migrations`, seed in `../supabase/seed.sql`.
- The booking engine was **built and verified first** (the priority): every rule
  — booking window, eligibility codes, membership-then-credit charging,
  waitlist auto-promotion with position shifting, refund vs. forfeit, and
  penalties — was tested directly against the live database via SQL.

## Zero-config / mocked by default

- `npm install && npm run setup && npm run dev` runs with **no keys**. `setup`
  creates `.env.local` from committed **public** defaults (the Supabase URL +
  anon key are public-safe; RLS enforces access).
- **Auth** uses Supabase **email/password** for the demo (works with no SMS
  provider). Two seeded accounts:
  - `noor@elan.demo / elan1234` — member (has credits + an active membership).
  - `owner@elan.demo / elan1234` — admin/owner (visit `/admin`).
  - Production should switch to **phone OTP** (primary) — just enable an SMS
    provider in Supabase; the auth screen already supports password sign-in and
    can be extended to OTP.
- **Providers** are interfaces, mocked by default, auto-switching to real when
  env keys exist (`src/lib/providers/index.ts`):
  - `PaymentProvider` → mock instant success. The member "Buy" flow fulfills via
    the `simulate_purchase` SQL function (writes a paid payment + credits/
    membership through the ledger). Real **Moyasar** (Mada/card/Apple Pay) is
    wired in the repo's API webhook path and switches on with `MOYASAR_*`.
  - `MessageProvider` → logs WhatsApp/SMS text to the console. Real **WhatsApp
    Cloud** switches on with `WHATSAPP_*`. All sends are **consent-gated** via
    `member_consents`.
  - `InvoiceProvider` → generates a placeholder ZATCA-style simplified invoice
    (number, 15% VAT split, QR placeholder). Real e-invoicing switches on later.

## Simplifications (and why)

- **Data layer uses Server Components + Server Actions** instead of TanStack
  Query on the client. Fewer moving parts, less client JS, and reads are always
  fresh. TanStack Query can be added later if rich client caching is needed.
- **shadcn/ui** components were hand-rolled as small Tailwind components (MD3
  tokens in `tailwind.config.ts`) to keep install zero-config and offline-safe.
- **Admin panel is a read-only dashboard** in this build (today's classes, fill
  rate, revenue). The destructive/operational admin actions (check-in, no-show,
  walk-in, schedule CRUD, recurring generation, member god-mode, refunds,
  reports, templates, settings) are **specified and backed by SQL** (e.g.
  `mark_no_show`, the ledger, penalty settings) but the admin **UI** for them is
  not built yet. This was the scope cut to keep the member engine solid first.
- **Reminders (24h/2h), intro offer + leads, linked accounts, audit log** are
  modeled in the data layer / planned but not yet surfaced in UI.

## What I'd do next (priority order)

1. Admin write actions behind role-checked SQL functions (grant `EXECUTE` to
   `authenticated`, gate by `is_admin()` inside): check-in/no-show, schedule
   CRUD + recurring generate, member god-mode + audit log.
2. Reports (SQL views + Recharts + CSV).
3. Reminders via a scheduled function; intro offer + lead capture.
4. Swap demo email/password for phone OTP once an SMS provider is set.

## Tests

- `npm test` runs offline unit tests for the server-driven CTA/eligibility
  mapping, level progression, Riyadh day-window math, and the invoice VAT split.
- The concurrency-sensitive booking/waitlist/penalty/credit logic lives in
  Postgres and was verified via SQL transactions against the live DB (outputs
  recorded during the build). Full DB-integration tests require network access
  to Supabase and should run in CI / locally against a Supabase instance.
