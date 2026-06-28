# ÉLAN — Staging Environment

Separate, throwaway environment for QA. **Fully isolated from production** —
its own Supabase project, its own data, its own test logins. Nothing here
touches the live studio database.

> Scope note: payment processing is intentionally **out of scope** for this
> environment (no PSP keys, no webhooks). Booking, credits, memberships,
> trainer/admin/manager portals, and check-in are all testable.

---

## 1. Supabase staging project

| Item | Value |
|---|---|
| Project name | `elan-pilates-staging` |
| Project ref | `xpslluqnrvmeapfqkjsd` |
| Region | `eu-central-1` |
| API URL | `https://xpslluqnrvmeapfqkjsd.supabase.co` |
| Production ref (do NOT mix) | `knldyssbwygrkxamttez` |

Schema was cloned 1:1 from production and parity-verified:
**29 tables · 46 functions · 49 RLS policies · 4 triggers · 1 exclusion constraint.**

### Public keys (safe to commit / share — RLS-gated)
- **Anon (legacy JWT):**
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc2xsdXFucnZtZWFwZnFranNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2NDkzNzYsImV4cCI6MjA5ODIyNTM3Nn0.cQi0B9W88GjYKMICuCNhkgaQKDuguxUchIo3Ip4KIGU`
- **Publishable (recommended):** `sb_publishable_BZy8BjpARLzG4CfwmAsglQ_ilIlFNaD`

### Secret key (NEVER commit, NEVER paste in chat)
- **Service role key** — copy from Supabase dashboard → **Project Settings → API
  → `service_role`** for project `xpslluqnrvmeapfqkjsd`. Set it only as an
  encrypted Vercel env var (see §3). It bypasses RLS — server-only.

---

## 2. Seeded test data

- **1 room** (Main Studio, capacity 6)
- **3 instructors** (نورة / سارة / ليان)
- **3 class types** (Reformer Flow, Mat Pilates, Reformer Advanced) @ 217.39 net halalas (= 250 SAR incl. VAT)
- **5 membership plans** (Single Class 250 · Monthly Essential 1800 · Monthly Signature 2280 *featured* · Unlimited 2900 · Annual Signature 24600)
- **4 credit packs** (ÉLAN Trial · Essential · Balance · Transformation)
- **~20 upcoming class instances** over the next 10 days (booking already open)

### Test logins — password for all: `ElanStaging!2026`

| Role | Email | Lands on | Notes |
|---|---|---|---|
| Member | `member@staging.elan.test` | `/` member app | Pre-loaded with **10 credits** |
| Trainer | `trainer@staging.elan.test` | `/trainer` | Linked to instructor "نورة" |
| Manager | `manager@staging.elan.test` | `/admin` (ops only) | No finance/provisioning access |
| Admin (owner) | `admin@staging.elan.test` | `/admin` (full) | Full access |

> These are disposable QA accounts on an isolated project — fine to share with
> testers. Do **not** reuse this password anywhere in production.

---

## 3. Vercel Preview wiring

Set these on the `elan` Vercel project, **Environment = Preview only**
(leave Production untouched). Without them, Preview deploys silently fall back
to the **production** Supabase project (see `src/lib/supabase/config.ts`) — so
these overrides are what keep Preview pointed at staging.

| Env var | Environment | Value source | Secret? |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Preview | `https://xpslluqnrvmeapfqkjsd.supabase.co` | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview | anon key above | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview | Supabase dashboard → Settings → API → `service_role` | **Yes** |

Optional (only if used by the feature under test):
`NEXT_PUBLIC_ELAN_MEDIA_BASE`, `NEXT_PUBLIC_ELAN_DEMO`.

Excluded by scope (do not set): `PAYMENT_WEBHOOK_SECRET` and any PSP keys.

### How to apply
1. Vercel → project `elan` → Settings → Environment Variables.
2. Add each row above, ticking **Preview** only.
3. Redeploy the Preview branch (or push a commit) so the new vars take effect.

---

## 4. Re-seeding / resetting

All seeds are idempotent for singletons and use fixed UUIDs, so re-running is
safe. To wipe bookings/members and re-seed test users, truncate the data tables
(not the catalogue) and re-run the `seed_test_users` migration. The
`handle_new_user` trigger auto-creates a member row for each auth user; trainer/
manager/admin links are added on top.
