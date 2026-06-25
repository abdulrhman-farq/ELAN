# ÉLAN — System state, environment & current errors

## 5. Environment (non-secret)

```
NEXT_PUBLIC_SUPABASE_URL=https://knldyssbwygrkxamttez.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public anon JWT — safe to ship; RLS enforces access>
NEXT_PUBLIC_ELAN_DEMO=        # unset/anything ⇒ DEMO ON; set to "false" to go fully live
NEXT_PUBLIC_SITE_URL=https://elan-rosy.vercel.app   # recommended; callback currently uses window.location.origin
NEXT_PUBLIC_ELAN_MEDIA_BASE=  # optional: Supabase Storage public base for class photos
```
**Never shared / server-only:** `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_PASSWORD`, `JWT_SECRET` (these are not used in the app code; the app uses only the public anon key + RLS).

> Note: config falls back to the live project URL + anon key when env is absent (see `src/lib/supabase/config.ts`). The anon key is public by design.

---

## 6. System-state answers

| # | Question | Answer |
|---|---|---|
| 1 | Payment: manual or electronic? | **Manual** — admin records sales (cash / mada / transfer / online) with a payment status (paid/pending). Electronic gateway (Moyasar) is modelled in the DB (`fulfill_purchase`, `payment_methods.moyasar_token`) but **not wired** into the admin flow. |
| 2 | Can a member book before paying? | Booking requires **credits or an active membership** (`book_class` raises `NO_CREDITS`). Admin can grant a bundle with **payment status = pending** — credits are granted immediately, so she **can book before the cash is collected** (revenue is only recognised when marked paid). No direct pay-then-book gateway. |
| 3 | Do bundles have start/end dates? | **Start:** yes — `payments.starts_at` (future allowed). **End:** memberships have `current_period_start/end`; credit packs have `valid_days` in the catalogue **but expiry is not currently enforced** on the credit ledger (credits are an open running balance). |
| 4 | Unlimited bundles? | **Modelled** (`pricing_source='unlimited_membership'`, `membership_plans` with `classes_per_period`), but there is **no admin UI** to sell an unlimited subscription yet (only credit packs via the sell-bundle dialog). |
| 5 | Frozen / paused memberships? | **DB-supported** (`membership_status='paused'` + `member_memberships.pause jsonb`), **no UI** to pause/resume yet. |
| 6 | Check-in? | **Admin attendance** only — "mark attended" (`markAttendedAction`) from the class roster. **No member self check-in.** |
| 7 | No-show? | **Yes** — `mark_no_show` RPC, `booking_status='no_show'`, penalties + no-show lost value in reports. |
| 8 | Instructor permissions? | **No** — instructors are data only (no auth account/role). Only `admin` (via `admin_users`) has privileges. |
| 9 | Multiple branches? | **No** — single studio (`studio_settings` is a single-row table). |
| 10 | Class capacity fixed or variable? | **Variable per class instance** (`class_instances.capacity`, 1–100); generator default = **6** (6 reformers). |
| 11 | Reports: accounting-accurate or operational? | Currently **operational + basic accounting** (gross/net/VAT/discounts/utilization/no-show/cancellation, VAT in halalas, audit trail). **Not** full double-entry/ZATCA e-invoicing. → *Decision needed: do you want proper accounting-grade (ZATCA-compliant invoices, refunds ledger) or keep operational?* |

---

## 7. Current errors / quality status

- **Build (`next build` / typecheck):** ✅ passing.
- **Tests (`vitest`):** ✅ 28/28 (pricing engine, quiz scoring, booking CTA logic).
- **Vercel runtime errors:** ✅ 0 in the last 3 hours.
- **Lint:** ⚠️ `next lint` not configured (eslint not installed) — only typecheck runs.
- **Browser console:** no known errors.
- **Recently fixed this build cycle:**
  1. `rpc()` helper lost `this` → "Cannot read properties of undefined (reading 'rest')" (Digest 1492116454) — fixed.
  2. Magic-link session not persisting (callback dropped cookies) → member showed as demo — fixed.
  3. `handle_new_user` duplicated members on login (empty "عضوة" row) → wrong name/credits — fixed (now links by email).
  4. Login email prefilled with invalid `.demo` address blocked OTP — fixed.
  5. Bundle sale failed (no admin write RLS on payments/ledger/bookings) — fixed.

---

## Document index (all review files)

- `SYSTEM_DOSSIER.md` — full overview, stack, structure, data model, flows, gaps.
- `SYSTEM_CODE_APPENDIX.md` — RLS SQL + key SECURITY DEFINER functions + 4 core files.
- `CODE_BUNDLE.md` — every source file + config (verbatim).
- `DB_SCHEMA.sql` — enums, constraints, indexes, view.
- `SYSTEM_STATE.md` — this file (env, state Q&A, errors).
- `FLOWS.md` — end-to-end flows.
