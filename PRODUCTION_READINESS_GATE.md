# ÉLAN Portal v2 — Production Readiness Gate (Evidence-Based)

**Date:** 2026-06-26 · **Branch:** `claude/magical-ritchie-q78vic` · **Live project:** `knldyssbwygrkxamttez`
**Merge status:** HELD per directive — PR #25 is mergeable but NOT merged to production pending this gate.
Every result below is backed by a query output, test run, or advisor result. Where I lack proof, it is marked **UNVERIFIED**.

---

## Phase 1 — Version & Environment

| Check | Result | Evidence |
|---|---|---|
| Production runs latest squashed work | ✅ | `elan-rosy.vercel.app` → deploy `dpl_E7HRe…`, commit `c875946` (PR #24), READY |
| Schedule fix in production | ❌ NOT YET | Fix is on the branch (PR #25); merge held per gate |
| Migrations applied live | ✅ | `0001`–`0005` applied; verified functions/indexes exist (queries below) |
| Schema ↔ code match | ✅ | All columns referenced by queries exist (class_types/instructors/availability verified) |
| Env: app uses the data project | ⚠️ UNVERIFIED at runtime | config default = `knldyssbwygrkxamttez`; the admin can log in + generate there, which writes the data I audited. A `[schedule]` diagnostic log (added) will print the live `ref` + row count on next deploy to confirm with proof. |

> Honest note: I cannot read Vercel's env values from here, so "production reads the same project" is inferred (admin auth + writes land in `knldyssbwygrkxamttez`), not yet log-proven. The added diagnostic proves it on deploy.

## Phase 2 — Database Audit (all outputs from live DB)

**Row counts:** class_instances **92**, class_types 4, instructors 3, bookings 0, members 5, payments 7, credit_ledger 8, membership_plans 2, credit_packs 2.

**Integrity (0 = clean):**
- orphan class_instances.class_type_id → **0**
- null class_type_id → **0**
- orphan class_instances.instructor_id → **0**
- null instructor_id → **0**
- orphan bookings.class_instance_id → **0**

**RLS & indexes:** **All 25 public tables have RLS enabled**, each with ≥1 policy and indexes (e.g. members 5 policies/4 idx, bookings 3/4, class_instances 2/4, payments 3/3, credit_ledger 2/4).

**FKs (class_instances):** `class_type_id→class_types`, `instructor_id→instructors`, `room_id→rooms` — all single, unambiguous (no `!constraint` needed).

**Data for 2026-06-28:** **8 class_instances** (09:00–16:00 Riyadh = 06:00–13:00 UTC), all `status='scheduled'`, readable by **anon AND authenticated** (RLS verified by `set role` tests). The availability view returns 8 for the window. → The empty schedule is NOT a data/RLS problem.

## Phase 3 — Backend / Query Audit

**Root cause of empty schedule (proven by code + DB):** `fetchBetween` ran one PostgREST query with **embedded joins** (`class_types(...)`, `instructors(...)`) and **discarded the `error`** (`const { data: rows } = …`). supabase-js does not throw — on any embed/PostgREST error it returns `{data:null,error}`, which the code read as "no rows" → empty day. The old **mock fallback masked this**; removing the mock exposed it. No Vercel runtime error is logged precisely because the error was discarded, not thrown.

**Fix applied (`src/lib/queries.ts`):**
- base `class_instances` query selects scalar FK columns only; `class_types`/`instructors` fetched by id and **joined in JS** (eliminates embed fragility entirely);
- the query `error` is now **logged with the project ref** (no secrets) and never silently `[]`;
- a temporary `[schedule] date=… window=… ref=… rows=…` log prints on every load for production proof;
- `is_bookable_now` defaults to `true` so generated classes are bookable.

**Silent-failure sweep:** remaining `return []`/`return null` are legitimate (admin guards, React early-returns, empty states). All `queries.ts` catch blocks now `console.error` and re-throw in production (mock only under `DEMO`).

## Phase 4–7 — Auth, Frontend, CRUD (status)

- **Payments/credits (verified live, rolled-back txns):** member denied `simulate_purchase` (permission denied); pending purchase grants 0; member denied `confirm_payment` (FORBIDDEN); admin double-confirm grants once (8→13→13); refund reverses once (8→13→8→8).
- **Auth gating (e2e, 9/9 pass):** all member routes + `/admin` redirect to `/login` unauthenticated; login renders RTL with no demo buttons (DEMO off).
- **Frontend states:** localized `not-found`/`error`/`global-error`; 10 loading skeletons; confirmations on cancel/delete class, no-show, mark-paid, comp, disable-promo; admin actions surface toast success/error.
- **CRUD:** class generate/cancel/delete, member create/edit, promo CRUD, sale/comp/discount — all admin-gated server-side (re-checked `is_admin()`), audited to `pricing_audit`. **UNVERIFIED end-to-end via UI in production** (requires deploy + manual run).

## Phase 8 — Performance

- N+1 on members removed (single `credit_ledger` query); server-side pagination (`.range`); `next/font`, `next/image`; build route sizes 103–118 kB except `/login` 172 kB (Supabase SDK in client bundle — known, documented).

## Phase 9 — Security

- `simulate_purchase` / trigger functions revoked from anon/authenticated/public (advisor warnings cleared). Remaining advisor WARNs are intentional self-guarding SECURITY DEFINER RPCs; one ERROR (`class_instance_availability` view is SECURITY DEFINER) is a reviewed exception (aggregate counts only, needs to see all bookings for capacity). No secrets in repo; service-role key only read server-side in the webhook. `npm audit`: 0 critical/high, 2 moderate (Next-bundled postcss).

## Phase 10 — Failure handling

- Errors now propagate to `error.tsx`/`global-error.tsx` instead of fabricating data. Webhook is inert (503) without keys; bad signature → 401.

## Build / Test evidence

`npm run typecheck` ✅ · `npm run lint` ✅ (0 warnings) · `npm test` ✅ 36 passed / 14 integration specs skipped · e2e 9/9 public ✅.

---

## Errors found & severity

| # | Issue | Sev | Root cause | Files | Fixed? | Follow-up |
|---|---|---|---|---|---|---|
| 1 | Empty member schedule | **Critical** | `fetchBetween` discarded query error + fragile embedded joins; mock masked it | `src/lib/queries.ts` | ✅ in branch | Verify in production after merge (diagnostic log will prove ref+rows) |
| 2 | "0 created" reads as failure | Low | idempotent skip not explained | `ScheduleGenerator.tsx` | ✅ in branch | — |
| 3 | Prod env→project not log-proven | Medium | can't read Vercel env here | — | n/a | Diagnostic `[schedule]` log on deploy confirms `ref` |
| 4 | `/login` bundle 172 kB | Low | Supabase SDK client-side | `login/page.tsx` | ⬜ | optional dynamic import |
| 5 | Settings page / profile rows placeholders | Medium | not wired | settings/profile | ⬜ | wire or hide |

## Final recommendation

**⚠️ Ready with notes — one gated step remains to reach ✅.**

Everything I can verify without a production deploy passes with evidence: DB integrity is clean, RLS is on for all tables, the data for the 28th exists and is readable by all roles, payments/refunds are provably safe and idempotent, auth gating passes e2e, and build/lint/typecheck/tests are green. The schedule Critical bug has a root-cause fix in the branch (PR #25).

**The single remaining proof** — "2026-06-28 shows 8 classes in production with no mock" — **requires deploying the branch**, which this gate intentionally blocks. To close the gate: merge PR #25 (or deploy its preview), reload `/schedule?date=2026-06-28`, and read the `[schedule] … ref=knldyssbwygrkxamttez rows=8` log. I will produce that log as the final evidence the moment you authorize the merge/preview test.
