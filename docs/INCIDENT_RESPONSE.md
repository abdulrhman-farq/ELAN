# ELAN — Incident Response

> What to do when production is broken or degraded.
> Stack: Next.js 15 on **Vercel** (`elan`) + **Supabase** (Postgres/RLS/Auth).
> Payments are **out of scope** — not covered here.
> See also: [`RUNBOOK.md`](./RUNBOOK.md) · [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md)

---

## Severity levels

| Sev | Definition | Examples | Target response |
|-----|-----------|----------|-----------------|
| **SEV1** | Prod down or critical data/security risk | Site 5xx for all users; auth broken; RLS bypass / data leak; data corruption | Immediate, all-hands |
| **SEV2** | Major feature broken, no full outage; workaround may exist | Booking fails; admin console down; notifications not sending; Sentry error spike on a key flow | Within the hour |
| **SEV3** | Minor / cosmetic / degraded | i18n string wrong; single non-critical page error; slow but working | Next business day |

When unsure, **round up** a level.

---

## Roles

- **Incident Lead (IL)** — runs triage, decides rollback vs forward-fix, owns comms. First responder defaults to IL until handed off.
- **Owner / DB approver** — required to approve any **PITR** or production DB change. Owns Supabase + Vercel project settings.
- **Comms** — posts status updates to the team channel (IL may also own this on smaller incidents).

---

## Detection

- **Sentry alert** — error spike or new issue in the prod project (requires `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN`).
- **Uptime monitor** — prod URL down / elevated latency.
- **`/admin/health`** — app + DB connectivity check.
- **User / staff report** — treat as valid signal; verify via the above.

---

## Response flow

```
Detect → Declare severity + IL → Triage (what changed?) →
  ├─ Release-related?  → Vercel Instant Rollback
  ├─ Data-related?     → DB forward-fix migration  (or owner-approved PITR)
  └─ Config/env?       → fix env var in Vercel, redeploy
→ Verify recovery → Comms → Post-incident review
```

### 1. Declare & triage
- [ ] Assign severity + name the Incident Lead
- [ ] Start a timeline (timestamps for every action)
- [ ] **What changed?** Check the latest Vercel deployment / merge to `main`, recent migrations, recent env-var edits
- [ ] Check Sentry, `/admin/health`, uptime monitor, Vercel logs to scope blast radius

### 2. Mitigate — release-related (most common)
- [ ] Vercel → Deployments → last known-good deployment → **Instant Rollback**
- [ ] Confirm recovery via smoke test + `/admin/health` + Sentry quieting
- [ ] If a bad migration shipped with the release, see step 3 (rollback of code does **not** revert DB)

### 3. Mitigate — data-related
> **No down-migrations.** Forward-fix is the default; PITR is owner-approved and a last resort.
- [ ] Prefer a **forward-fix migration**: validate on **staging** first, run `scripts/verify_rls.sql`, then apply to prod
- [ ] If data is corrupted / destroyed and forward-fix can't recover it → **owner-approved PITR** (Supabase point-in-time restore)
- [ ] Note: PITR rewinds the whole DB — coordinate, freeze writes if feasible, capture the restore point and data-loss window
- [ ] Re-run `scripts/verify_rls.sql` after any prod DB change

### 4. Mitigate — config / env
- [ ] Fix the env var in Vercel (correct env scope; server-only keys must not be `NEXT_PUBLIC`)
- [ ] Confirm `NEXT_PUBLIC_ELAN_DEMO` is off in prod
- [ ] Redeploy / re-run to pick up the change

### 5. Comms
- [ ] Post: what's affected, severity, current status, next update time
- [ ] Update on a cadence (SEV1: every ~30 min) until resolved
- [ ] Announce resolution + brief root cause

### 6. Recover & confirm
- [ ] Smoke test the affected flow(s) — see [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md#3-post-deploy-smoke-tests)
- [ ] Sentry quiet, uptime green, `/admin/health` green
- [ ] Downgrade / close severity

---

## Post-incident review (template)

> Fill within 48h. Blameless — focus on systems, not people.

```
Incident:        <short title>
Severity:        SEV_
Date / duration: <start> → <end>  (TTD: __  TTR: __)
Incident Lead:   <name>

Impact:          <who/what was affected, scope, any data-loss window>
Detection:       <how we found out — Sentry / uptime / health / report>

Timeline:
  HH:MM  <event>
  HH:MM  <event>

Root cause:      <the actual cause>
Trigger:         <what set it off — deploy / migration / env / external>
Resolution:      <Vercel rollback / forward-fix migration / PITR / env fix>

What went well:
  -
What went poorly:
  -

Action items (owner · due):
  - [ ]
  - [ ]
```
