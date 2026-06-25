# ÉLAN — Full System Dossier (for external review)

> A women's Pilates studio booking platform (Riyadh) — member-facing app + admin
> console + financial accounting. Arabic-first (RTL). This single file documents the
> tech, UI, flows, data model, security, and known gaps so an external reviewer
> (e.g. GPT) can audit and propose fixes.
>
> Live: https://elan-rosy.vercel.app · Admin: /admin · Member: / · Login: /login
> Generated: 2026-06-25.

---

## 1. Product overview

- **Two surfaces, one codebase:**
  - **Member app** (`/`, `/schedule`, `/class/[id]`, `/bookings`, `/memberships`, `/profile`) — browse timetable, book/cancel classes, view credits & membership.
  - **Admin console** (`/admin/*`) — dashboard, members CRM, schedule generation, financial sales/discounts, promo codes, reports.
- **Roles:** Admin (studio manager, email+password) · Member/subscriber (email magic-link or password) · logged-out visitor (demo showcase).
- **Currency:** SAR. All money stored as **halalas (integers)**, 1 SAR = 100 halalas. VAT 15%.
- **Canonical pricing (from the dossier):** single class net **150 SAR**, +15% VAT = **172.50 SAR** gross. Bundles: 8/12-class packs, unlimited monthly, private. Studio capacity = **6** (6 reformers).

---

## 2. Tech stack

| Layer | Tech |
|---|---|
| Framework | **Next.js 15.1** (App Router, RSC + Server Actions), **React 19** |
| Language | TypeScript 5.6 |
| Styling | Tailwind CSS 3.4 (custom design tokens), Google Fonts (Amiri / Tajawal / Bodoni Moda) |
| Backend | **Supabase** (Postgres + Auth + RLS), `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.45 |
| Validation | zod 3.23 (light usage) |
| Tests | **vitest** 2.1 (28 tests) |
| Hosting | **Vercel** (project `elan-rosy`), region iad1 |
| Auth | Supabase email/password (admin) + email OTP/magic-link (members) |

**Scripts:** `dev`, `build`, `start`, `lint` (eslint not installed), `test` (vitest).

---

## 3. Repository structure (`src/`)

```
app/
  layout.tsx                 root layout (fonts, dir=rtl)
  globals.css                design tokens + component classes
  login/page.tsx             admin password + member magic-link
  auth/callback/route.ts     OTP code exchange + links member by email
  (app)/                     MEMBER app (route group)
    layout.tsx               redirects admins → /admin; auth gate when !DEMO
    page.tsx                 home (greeting, credits, next class)
    schedule/page.tsx        timetable (real for logged-in members)
    class/[id]/page.tsx      class detail + book button
    bookings/page.tsx        my bookings + cancel
    memberships/page.tsx     plans & packs catalogue
    confirmation/[bookingId] booking confirmation
    profile/page.tsx
  admin/                     ADMIN console
    layout.tsx               is_admin gate + nav
    page.tsx                 dashboard (KPIs, alerts, today, waitlist, overdue tasks)
    members/page.tsx         directory (search, filter, remaining, expiry, CSV)
    members/[id]/page.tsx    member detail (edit, money, tasks, notes, bookings, quiz result)
    members/export/route.ts  CSV export (admin-gated)
    schedule/page.tsx        schedule + generator + cancel/delete
    reports/page.tsx         financial breakdown
    promo/page.tsx           promo codes
    trainers/page.tsx        instructors
    settings/page.tsx        studio config (static)
    class/[id]/page.tsx      class roster + attendance
components/                  24 components (member + admin/*)
  admin/ NewMemberDialog, EditMemberDialog, MemberMoney (sell bundle + comp/discount),
         PromoManager, ScheduleGenerator, ClassRowActions, ClassQuiz, MemberTasks,
         WhatsAppActions, AddNoteForm, MemberStatusSelect, AttendanceButtons, AdminNav...
lib/
  supabase/{client,server,config}.ts   browser + cookie-bound server clients; rpc() helper
  queries.ts        member-app data (getTimetable, getClass, getMyBookings, getMemberContext)
  admin.ts          admin data (dashboard, members, reports, schedule, financials, promo, quiz opts)
  pricing.ts        pricing engine (halalas, VAT, discounts) — TESTED
  quiz.ts           7-question class-fit quiz scoring — TESTED
  cta.ts            booking button state machine — TESTED
  format.ts         dates/times (Riyadh tz), money
  demo.ts           DEMO flag (NEXT_PUBLIC_ELAN_DEMO !== "false")
  mock.ts           demo/showcase data
  i18n.ts           ar/en dictionaries
  classColor.ts     class accent colours + images
admin-actions.ts    "use server" mutations (members, money, promo, schedule, tasks)
actions/index.ts    member booking/cancel/purchase actions
actions/admin.ts    attendance (mark attended / no-show)
```

---

## 4. Routes ↔ data ↔ tables (UI wiring)

| Screen | Reads (lib) | Writes (action) | Tables/RPC |
|---|---|---|---|
| Admin dashboard | `getDashboard`, `getOverdueTasks` | — | class_instances, class_instance_availability, bookings, payments, members, member_tasks |
| Members list | `getMembersOverview` | — | members, member_memberships, credit_ledger(rpc) |
| Member detail | `getMemberDetail`, `getMemberTasks`, `getMemberFinancials` | `updateMemberAction`, `sellPackageAction`, `applyBookingDiscountAction`, `compBookingAction`, `setLeadStatusAction`, `addNoteAction`, `createTaskAction`, `setTaskStatusAction` | members, payments, bookings, credit_ledger, member_notes, member_tasks, pricing_audit, promo_* |
| New client dialog | `getScheduleFormOptions`(quiz n/a) | `createMemberAction` → `sellPackageAction` | members, payments, credit_ledger |
| Schedule | `getAdminSchedule`, `getScheduleFormOptions` | `generateScheduleAction`, `cancelClassAction`, `deleteClassAction` | class_instances, class_types, instructors, class_instance_availability |
| Reports | `getReports` | — | payments, bookings |
| Promo | `getPromoCodes` | `createPromoCodeAction`, `setPromoCodeActiveAction` | promo_codes, promo_redemptions, pricing_audit |
| CSV export | `getMembersForExport` | — (GET route, is_admin) | members, member_memberships, credit_ledger |
| Member home/schedule/book | `getMemberContext`, `getTimetable`, `getClass`, `getMyBookings` | `bookAction`, `cancelAction` | members, class_instances, bookings, RPC book_class_self / cancel_booking_self / current_member_id / booking_eligibility_self |
| Login / callback | — | `signInWithPassword`, `signInWithOtp`, `exchangeCodeForSession` | auth.users, members (link by email), handle_new_user trigger |

---

## 5. Auth & roles

- **Admin:** `auth.users` row + `admin_users` row (`active=true`). `is_admin()` = `exists(select 1 from admin_users where auth_user_id=auth.uid() and active)`.
- **Member:** `members` row created by admin (with email). On magic-link login, `handle_new_user` trigger **links** the auth user to the existing member by email (`auth_user_id`), or creates one if none. `current_member_id()` resolves the member from `auth.uid()`.
- **DEMO mode** (`NEXT_PUBLIC_ELAN_DEMO`, default ON): logged-out visitors see mock showcase. A real signed-in member sees real data (hybrid in `getMemberContext`). Admins are redirected from the member app to `/admin`.
- **Login routing:** password login → `is_admin()` ? `/admin` : `/`. Magic-link → `/auth/callback` → `/`.

---

## 6. Data model (Postgres, schema `public`)

Money columns are integer **halalas**. `USER-DEFINED` = Postgres enum.

- **members**: id, auth_user_id, full_name, phone, email, locale, role, level, lead_status, source, recommended_class, created_at, modified …
- **admin_users**: id, auth_user_id, name, role(admin_role), active, created_at
- **class_types**: id, name_ar/en, description_ar/en, default_level, duration_minutes, default_capacity(=6), category_id, pricing(jsonb), **base_net_halalas(=15000), vat_bps(=1500)**
- **class_instances**: id, class_type_id, instructor_id(nullable), starts_at, ends_at, capacity, level, status(class_instance_status: scheduled/cancelled…), booking_opens_at, booking_closes_at, room/room_id, is_online
- **class_instance_availability** (VIEW): class_instance_id, capacity, is_bookable_now, confirmed_count, spots_left, waitlist_count, display_status (derived from booking windows + bookings + studio_settings.max_waitlist_size)
- **instructors**: id, name_ar/en, bio_ar/en, photo_url, active
- **bookings**: id, class_instance_id, member_id, status(booking_status: confirmed/waitlisted/cancelled/attended/no_show/late_cancelled), source(web/admin), credits_used, payment_audience(payg/member), **+ accounting**: base_net_halalas, discount_type, discount_value, discount_amount_halalas, final_net_halalas, vat_bps, vat_amount_halalas, final_gross_halalas, currency, pricing_source(single/package_credit/unlimited_membership/manual/complimentary), list_value_halalas, effective_paid_halalas, discount_reason, promo_code_id
- **payments**: id, member_id, amount_sar, sales_tax_sar, currency, status(payment_status: initiated/paid/failed/refunded), type(payment_type: membership/credit_pack/penalty/single_class/private_session), ref_id, **+ accounting**: base_net_halalas, discount_type, discount_value, discount_amount_halalas, net_halalas, vat_amount_halalas, gross_halalas, promo_code_id, **method**(cash/mada/transfer/online/other), **starts_at**(bundle start, may be future)
- **credit_ledger**: id, member_id, change(+/-), reason(credit_ledger_reason: purchase/booking/refund/admin/penalty), balance_after, ref_id  → balance = `elan_credit_balance(member)` = sum(change)
- **membership_plans / credit_packs**: catalogue (price_sar, credits, valid_days, billing_interval, classes_per_period, active)
- **member_memberships**: member_id, plan_id, status, current_period_start/end, is_subscription, is_payg, pause(jsonb)…
- **promo_codes**: code, discount_type(percentage/fixed), discount_value(percentage→bps, fixed→halalas), starts_at, expires_at, max_redemptions, per_member_limit, active
- **promo_redemptions**: promo_code_id, member_id, booking_id, payment_id, discount_amount_halalas
- **pricing_audit**: entity_type, entity_id, action, field, old_value, new_value, reason, actor_id, created_at
- **member_notes / member_tasks**: CRM notes & follow-up tasks (title, due_date, status open/done)
- Others: rooms, class_categories, class_instance_trainers, linked_accounts, member_consents, notifications, payment_methods, penalties, penalty_settings, studio_settings (timezone, sales_tax_pct, max_waitlist_size, booking windows…)

---

## 7. Database functions (RPC)

| Function | Security | Purpose |
|---|---|---|
| `is_admin()` | definer | current user is an active admin |
| `current_member_id()` | definer | member id for `auth.uid()` (via auth_user_id) |
| `handle_new_user()` (trigger on auth.users) | definer | link new auth user to existing member by email, else create |
| `book_class(member,ci,source)` / `book_class_self(ci,source)` | definer | book with eligibility/credits/capacity/waitlist |
| `cancel_booking(member,booking)` / `cancel_booking_self(booking)` | definer | cancel + refund logic |
| `booking_eligibility(member,ci)` / `booking_eligibility_self(ci)` | definer/invoker | eligibility string |
| `elan_credit_balance(member)` | invoker | sum of credit_ledger |
| `mark_no_show(booking)` | definer | mark no-show (+ penalty) |
| `fulfill_purchase(...)` / `simulate_purchase(type,ref)` | definer | purchase fulfilment (Moyasar / sandbox) |
| helpers `_elan_*` | invoker | ledger, consent, level rank, membership coverage |

---

## 8. Row-Level Security (RLS) policy map

- **Public read (`using true`):** class_types, class_instances, class_categories, instructors, rooms, class_instance_trainers, penalty_settings, studio_settings; credit_packs & membership_plans = `active OR is_admin()`.
- **Member-scoped read (`member_id = current_member_id() OR is_admin()`):** bookings, credit_ledger, member_memberships, member_consents, notifications, payment_methods, penalties, linked_accounts.
- **members:** self read/update by `auth_user_id=auth.uid()` OR by email (`lower(email)=lower(jwt email)`); admin select/update; `members_admin_insert` INSERT.
- **Admin-only (`is_admin()` ALL):** payments(write), bookings(write), credit_ledger(write), class_instances(write), promo_codes, promo_redemptions, pricing_audit, member_notes, member_tasks.
- **admin_users:** self select only.

---

## 9. Pricing & accounting engine (`lib/pricing.ts`)

```
finalNet  = max(0, baseNet − discount)         // discount on NET, before VAT
vatAmount = round(finalNet × vatBps / 10000)   // vatBps = 1500 (15%)
finalGross = finalNet + vatAmount
```
- Discount: percentage (bps) or fixed (halalas); clamped so net ≥ 0; 100% = complimentary.
- **pricing_source** drives accounting: `single`(cash → payment), `package_credit`(deduct 1 credit, record list value), `unlimited_membership`(no credit, record utilization), `complimentary`(gross 0, list retained), `manual`.
- Every money mutation writes **pricing_audit** (who/when/reason/old/new).
- **Reports** separate: gross / net / VAT / discounts (from payments) + comp / package-util / unlimited-util / no-show / cancellation (from bookings list_value). Pending payments (`initiated`) excluded from revenue.

---

## 10. Core flows (end-to-end)

1. **Admin onboards client:** New client → optional class-fit quiz (7 Q → Reformer/Sculpt/Center/Cardio-Power) → pick bundle → `createMemberAction` + `sellPackageAction` (credits + payment + audit). Bundle sale supports discount/promo, **start date (future allowed), payment status (paid/pending), method**.
2. **Subscriber login:** admin sets email → member opens `/login` → magic link → `/auth/callback` links `auth_user_id` → sees real name/credits.
3. **Booking:** member `/schedule` → class → `book_class_self` (eligibility + credit + capacity 6 + waitlist) → appears in admin dashboard alerts.
4. **Schedule generation:** admin sets first time (09:00), duration (50), cleaning buffer (10) ⇒ hourly slots, 8/day × N active days, skip days off, capacity 6, rotate class types; opens booking now, closes at start; dedups; validates before allowing generate.
5. **Money ops:** sell bundle / per-booking discount / comp; reports + member financial summary update.

---

## 11. Known gaps / risks / required config (for the reviewer to weigh)

1. **Email delivery:** Supabase built-in email is rate-limited (~3–4/hr) — production needs SMTP (e.g. Resend) + Site URL set to the prod domain + `/auth/callback` in Redirect URLs.
2. **`members_admin_insert` policy is `WITH CHECK true`** (any authenticated user can insert a member row). Server actions gate on `is_admin()`, but the raw policy is permissive — tighten to `is_admin()`.
3. **No real payment gateway** — payments are recorded manually (cash/mada/transfer). Moyasar wiring (`fulfill_purchase`) exists but unused in the admin flow.
4. **Bundle credits granted regardless of payment status** — a "pending" sale still adds credits (revenue excluded until paid). No "mark as paid" UI yet.
5. **Future bundle `starts_at` is informational** — credits are usable immediately (no time-gating of credits).
6. **Unlimited-membership pricing_source** is modelled but there is no admin UI to sell an unlimited subscription (only credit packs).
7. **eslint not installed** — only typecheck (via `next build`) + vitest run in CI-equivalent.
8. **Generated `database.types.ts` is stale** for new columns/tables — code uses untyped accessors (`anyFrom`/`tbl`) as a workaround; regenerating types would restore type-safety.
9. **No weekly auto-repeat / recurring schedule** (one-shot generation only).
10. **i18n:** UI is bilingual but locale is cookie-driven; admin copy is mostly Arabic.
11. **DEMO fallback** can mask "not logged in" as the showcase member for logged-out visitors (by design, but worth noting).

---

## 12. Live state snapshot (2026-06-25)

- Build ✅ · 28/28 tests ✅ · 0 runtime errors (last 3h).
- 5 members (4 auth-linked, 1 with quiz result) · 48 upcoming classes over 6 days · 0 bookings yet · 3 paid payments (2,748.50 SAR gross) · 2 active admins · 5 audit rows · 0 promo codes.

---

## 13. Suggested review prompts for GPT

- Audit the **RLS policies** (esp. `members_admin_insert`, email-based self policies) for privilege-escalation or data-leak risks.
- Review the **accounting model** for double-counting between `bookings` and `payments`, and correctness of VAT rounding in halalas.
- Evaluate the **booking concurrency** (capacity 6 + waitlist) in `book_class` for race conditions.
- Assess **auth linking** (`handle_new_user` by email) for account-takeover edge cases (email case, unverified emails, collisions).
- Suggest a migration path to **disable DEMO** safely and make the member app fully real.
- Recommend **payment-status lifecycle** (pending → paid) and gateway integration design.
