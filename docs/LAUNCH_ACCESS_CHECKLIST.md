# ÉLAN — Production Launch Access Requirements
### Access checklist for an autonomous implementation agent (non-payment scope)

> Prepared by: DevOps / Security Architecture / Product Eng / TPM
> Scope: **all non-payment** production-readiness work — security/auth, Supabase config, RLS & migrations, profile/account flows, login UX, notifications, legal pages, CI/CD, monitoring, backups, rollback, tests, deployment readiness.
> **Out of scope (do NOT provision):** payment processors, billing, invoices, subscriptions, refunds, PSP dashboards, Apple/Google Pay, Mada/HyperPay/Tap/Stripe, settlement/payout tooling.

Stack: Next.js 15 (App Router) · React 19 · Supabase (Postgres/RLS/Auth) · Vercel · bilingual AR/EN · KSA market (PDPL).

Known identifiers (fill/confirm before handoff):
- GitHub repo: `abdulrhman-farq/elan`
- Vercel team: `abdulrhman-farqs-projects` · project: `elan` · prod URL: `elan-rosy.vercel.app`
- Supabase **production** project ref: `knldyssbwygrkxamttez`
- Supabase **staging** project ref: `__TBD — create one__`

---

## 1. Executive summary

To finish the non-payment launch work with minimal manual help, the agent needs **scoped, least-privilege access to three planes** — GitHub (code + CI), Vercel (build/deploy/runtime), Supabase (data/auth/RLS) — plus a handful of **notification and observability credentials**. Everything else (legal text, business facts, consent wording) is **input you provide once**, not access.

Three principles drive every line below:

1. **Least privilege, time-boxed.** Prefer *Write* over *Admin*, *Developer* over *Owner*, a **scoped staging key** over a production service-role key. Grant Admin/Owner only for the few one-time setup tasks that genuinely require it, then downgrade.
2. **Staging ≠ Production.** The agent should do ~90% of the work against a **separate staging Supabase project** and Vercel **Preview** deployments. Production access is granted late, narrowly, and ideally with a human approving the final promote.
3. **Secrets never travel through chat.** Tokens/keys go into **GitHub Actions secrets** and **Vercel Environment Variables**, or a shared vault — never pasted into a conversation, commit, PR, or log.

> ملخص بالعربي: العميل يحتاج صلاحيات محدودة (أقل امتياز) على GitHub وVercel وSupabase، مع فصل واضح بين بيئة الاختبار (staging) والإنتاج (production). المفاتيح والتوكنات تُضاف كـ "secrets" ولا تُرسل في المحادثة إطلاقًا. كل ما يخص الدفع مستثنى تمامًا.

**Critical gap to close first:** there is currently **one** Supabase project (production) and no dedicated staging DB. Create a **staging Supabase project** + a Vercel **Preview/Staging** environment before granting any destructive access — this lets the agent run migrations, RLS changes, and auth experiments safely.

---

## 2. Required access (table)

| # | Access item | Why needed | Min permission | Share directly? | Recommended owner | Risk if misused | Revoke / rotate |
|---|-------------|-----------|----------------|-----------------|-------------------|-----------------|-----------------|
| R1 | GitHub repo **Write** (collaborator or team) | Push branches, open PRs for all fixes | **Write** (not Admin) | Add as collaborator (no token in chat) | Repo owner | Med — code tampering, but PRs are reviewable | Remove collaborator after handoff |
| R2 | GitHub **Actions enabled** + ability to add workflow files | Build CI/CD, run tests, lint, typecheck, migration checks | Comes with Write (workflow files via PR) | n/a | Repo owner | Med — CI can run arbitrary code | Disable workflow / revoke Write |
| R3 | GitHub **repo/Actions secrets** management | Store CI test secrets, Supabase staging keys, Sentry DSN | **Admin** (one-time) *or* you add the secrets from a list the agent provides | Never share values in chat; you paste into Settings→Secrets | Repo owner | High — secrets store | Rotate each secret; remove Admin after setup |
| R4 | GitHub **branch protection** config | Enforce PR review, required checks on `main` | **Admin** (one-time) | n/a (config, not a secret) | Repo owner | Low | Leave protection on; downgrade agent to Write |
| R5 | Vercel project **Member (Developer)** on `elan` | Configure env vars, trigger/inspect Preview deploys, read build & runtime logs | **Member/Developer** | Invite by email | Vercel team owner | Med | Remove member after handoff |
| R6 | Vercel **Environment Variables** (Preview + Production) | Wire Supabase URL/keys, Sentry, Resend, feature flags, app config | Developer can manage env | Never paste values in chat; set in Vercel UI/CLI | Vercel team owner | High (prod env) | Rotate values; re-pull |
| R7 | Vercel **Preview deployments + logs** | Validate every change before prod; read runtime errors | Developer | n/a | Vercel team owner | Low | n/a |
| R8 | Vercel **production deploy + instant rollback** | Promote release, roll back on incident | Developer can deploy; **promote/rollback may need project Admin** depending on team policy | Grant late; prefer human-approved promote | Vercel team owner | High | Downgrade to Developer/remove |
| R9 | Supabase **STAGING** project — full project access (or access token scoped to it) | Run migrations, edit RLS, Auth settings, Edge Functions, SQL, logs, seed | Project **Developer/Admin on staging only** | Personal access token → store as secret, not chat | Supabase org owner | Low (staging) | Revoke token; project is disposable |
| R10 | Supabase **PRODUCTION** — migrations + RLS + SQL + read logs | Apply the *reviewed* migrations and RLS to prod; verify | Scoped **access token** / project Developer; service-role key **as env secret only** | Never share service-role key in chat | Supabase org owner | **Critical** — RLS/data | Rotate service-role + access token after handoff |
| R11 | Supabase **Auth settings** (staging, then prod) | Fix login UX: redirect URLs, email templates (magic link/OTP), session/JWT expiry, allowed domains, rate limits | Project Admin (dashboard) | n/a (config) | Supabase org owner | High (auth) | Re-review settings post-handoff |
| R12 | Supabase **anon** + **service-role** keys (env secrets) | App runtime (anon client) + server/webhook (service-role) | Provided via env, not chat | **Secret only** | Supabase org owner | Critical (service-role) | Rotate both after handoff |
| R13 | **Sentry** project + DSN + auth token | Error monitoring, source maps upload in CI | Project member; **scoped** auth token (`project:releases`) | DSN safe-ish (public client key); auth token = secret | Eng owner | Low–Med | Revoke auth token |
| R14 | **Email/notification provider** (Resend recommended) API key + verified domain | Auth magic-link/OTP deliverability + future waitlist/booking/cancellation emails | API key with send scope; DNS records for domain | API key = secret; DNS you add | Eng/Studio owner | Med (spoofing/spam) | Rotate API key; remove DNS |
| R15 | **Uptime monitor** (e.g. Better Stack/UptimeRobot) | External health checks + alerting on outage | Account or monitor-create access | n/a | Eng owner | Low | Delete monitor |
| R16 | **Legal/compliance inputs** (text + facts) | Privacy policy, Terms, contact, data-retention, PDPL consent wording, studio CR/VAT/registered name | Documents/answers, not system access | Provide as docs (no secrets) | Studio owner / legal | Low | n/a |
| R17 | **Test/seed accounts** on staging (member, trainer, manager, admin) | E2E/Playwright + manual QA across roles | Created in staging | Credentials via secret manager, not chat | Agent creates on staging | Low (staging) | Delete after QA |

---

## 3. Nice-to-have access (table)

| # | Access item | Why | Min permission | Owner | Notes |
|---|-------------|-----|----------------|-------|-------|
| N1 | Vercel **Analytics / Speed Insights** | Real-user perf + Web Vitals for launch sign-off | Developer | Vercel owner | Built into Vercel; just enable |
| N2 | Vercel **domain management** for prod custom domain | Move off `*.vercel.app` to `elan.sa`/`app.elan.sa` | Project/Team Admin | Vercel owner | Only if a custom domain is in scope; needs DNS |
| N3 | **GitHub environments** (`staging`,`production`) w/ required reviewers | Gate prod deploy behind manual approval | Admin (one-time) | Repo owner | Strong control for promote step |
| N4 | **Supabase log drain / observability** | Stream DB/Auth/Edge logs to Sentry/Logflare | Project Admin | Supabase owner | Better than ad-hoc log reads |
| N5 | **WhatsApp Business / Cloud API** (Meta) token + number | Primary KSA channel for booking/waitlist/cancellation; already queued in `notifications` table | System-user token (scoped) | Studio owner | Defer until ready; in-app already works |
| N6 | **Status page** (Better Stack/Instatus) | Public/internal incident comms | Account | Eng owner | Optional |
| N7 | **PostHog/GA4** product analytics | Funnels for booking/login conversion | Project member | Eng owner | Privacy/PDPL config required |
| N8 | **1Password/Bitwarden/Doppler** shared vault | The secure channel for handing over all secrets | Vault item share | Owner | Strongly recommended (see §7) |

---

## 4. Tokens & secrets checklist

These become **environment variables / CI secrets** — never chat, never committed.

**App runtime (Vercel env — Preview & Production sets, kept separate):**
- `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`) — staging value in Preview, prod value in Production
- `SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, never `NEXT_PUBLIC_*`, Production set only (and staging set for staging)
- `ELAN_WEBHOOK_SECRET` (signed webhook verification — existing pattern; non-payment notification/webhook use)
- `NEXT_PUBLIC_DEMO` / demo flag — must be **off/false** in Production
- `NEXT_PUBLIC_SITE_URL` — canonical URL for auth redirects & emails

**CI/CD (GitHub Actions secrets):**
- `SUPABASE_ACCESS_TOKEN` — scoped to **staging** for CI migration dry-runs
- `SUPABASE_PROJECT_REF_STAGING`
- `SUPABASE_DB_PASSWORD_STAGING` (if running `supabase db` against staging)
- `SENTRY_AUTH_TOKEN` (scope: releases/source maps) + `SENTRY_ORG` + `SENTRY_PROJECT`
- `RESEND_API_KEY` (if email tested in CI; otherwise Vercel env only)
- `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` (only if CI drives deploys; otherwise use Vercel Git integration)
- E2E test account creds (`E2E_MEMBER_EMAIL/PW`, `E2E_ADMIN_EMAIL/PW`, …) — **staging only**

**Observability (Vercel env / Sentry):**
- `NEXT_PUBLIC_SENTRY_DSN` (public client key — low sensitivity, still set as env)

> Rotation note: every token above must be **rotated or revoked after handoff** (see §9 and Final checklist).

---

## 5. What you should NEVER send in chat

🚫 Do not paste any of these into this conversation, a PR description, a commit, an issue, or a screenshot:

- Supabase **service-role key** (full DB bypass — RLS does not apply to it)
- Supabase **access token** / DB password
- **Vercel token**, **GitHub PAT**, **Sentry auth token**
- **Resend/SendGrid/WhatsApp** API keys or Meta system-user tokens
- `ELAN_WEBHOOK_SECRET` or any signing secret
- The admin login password (`Elan$…`) or any real user password — admin auth already lives only as a bcrypt hash in Supabase Auth; keep it that way
- Any production `.env` file contents
- Customer PII exports (member phone/email lists)

✅ Safe to mention in chat: project refs, public URLs, the **anon** key is low-sensitivity but still better as env, the **Sentry DSN** (public), and the *names* of variables you've set.

---

## 6. Staging vs Production separation (explicit)

| Plane | Staging (do work here) | Production (promote here) |
|-------|------------------------|---------------------------|
| Supabase | New project (`__TBD__`) — migrations, RLS, Auth experiments, seed data | `knldyssbwygrkxamttez` — apply only **reviewed** migrations; no seed/test data |
| Vercel | **Preview** deployments (every PR) bound to staging env | **Production** deployment bound to prod env, ideally human-approved |
| Keys | Staging anon/service-role + scoped access token | Separate prod keys; service-role as Production env secret only |
| Data | Synthetic seed + test users (member/trainer/manager/admin) | Real data — read for verification, never seed/destroy |
| Auth redirects | `*-git-*.vercel.app` preview URLs allowed | Only the canonical prod URL allowed |

The agent should treat production as **append-reviewed-migrations + verify-logs only** until the final promote.

---

## 7. Secure handoff process

1. **Stand up a shared vault** (1Password/Bitwarden/Doppler). This is the *only* channel for secrets.
2. **Create staging first** (Supabase staging project + Vercel Preview env). Most work happens here with low-risk credentials.
3. **Invite the agent identity** at least-privilege: GitHub *Write*, Vercel *Developer*, Supabase *staging* access token.
4. **You (owner) paste secret *values*** into GitHub Secrets / Vercel Env / the vault — using the variable list in §4. The agent supplies the **names and where they go**, never receives raw values in chat.
5. **One-time elevated tasks** (repo Admin for branch protection/secrets, Supabase Auth dashboard, prod env) are done in a short window, then **downgraded**.
6. **Production access granted last**, narrowly, for the reviewed migration apply + promote.
7. **Post-handoff:** rotate every token/key, remove the agent's memberships, confirm branch protection + required checks remain on.

---

## 8. Step-by-step onboarding for the implementation agent

**Phase 0 — Read-only orientation (no write access yet)**
- Read repo, `supabase/migrations/*`, existing RLS, audit docs; produce a work plan + the exact secret list it will need.

**Phase 1 — Staging environment**
- Create staging Supabase project; apply current migrations; seed synthetic data; create test users (member/trainer/manager/admin).
- Create Vercel Preview env bound to staging keys; confirm a preview build is green.

**Phase 2 — Build the fixes (PR-per-area, against staging)**
- Security/auth hardening, RLS & new migrations, profile/account flows, **login UX**, **notifications** (in-app now; email via Resend; WhatsApp deferred), **legal pages** (privacy/terms/PDPL consent), CI/CD (tests/lint/typecheck/migration check), monitoring (Sentry), backups & rollback runbook, E2E (Playwright).
- Every PR: preview deploy + checks must pass; you review.

**Phase 3 — Production cutover (least-privilege, late)**
- Apply reviewed migrations to prod; set prod env vars; configure prod Auth redirects/email; smoke-test; verify Sentry receives events; verify backups + rollback drill.
- Promote (human-approved) → monitor.

**Phase 4 — Handoff close-out**
- Rotate all secrets, downgrade/remove access, confirm protections, deliver runbooks.

---

## 9. Production safety: backups, restore, rollback, incident response

- **Backups:** Supabase takes automatic daily backups (+PITR on paid tiers). Agent needs project access to **verify** schedule and run a **restore drill on staging** (never test-restore prod). A downloadable CSV export already exists at `/admin/export`.
- **Restore drill:** performed on the **staging** project from a backup snapshot to prove RTO/RPO. Production restore is **owner-approved only**.
- **Rollback:** Vercel **Instant Rollback** to the previous good deployment (Developer/Admin per team policy). DB rollback = forward-fix migration or PITR (owner-approved).
- **Incident response:** Sentry alert → triage → Vercel rollback if release-related → DB forward-fix if data-related → status comms. Agent needs Sentry + Vercel logs + Supabase logs (read) to diagnose.
- **Emergency fix:** hotfix branch → PR → required checks → expedited review → promote. No direct pushes to `main` (branch protection).

---

## 10. Final permission checklist before work begins

**Environment**
- [ ] Staging Supabase project created; ref recorded
- [ ] Vercel Preview/Staging env created and bound to staging keys
- [ ] Shared secret vault created and agent invited

**GitHub**
- [ ] Agent has **Write** (not Admin)
- [ ] Actions enabled; workflow changes flow via PR
- [ ] Branch protection on `main`: required reviews + required checks
- [ ] All CI secrets (§4) added by owner — values never in chat

**Vercel**
- [ ] Agent is **Developer** on `elan`
- [ ] Preview + Production env var **sets** populated (separately) by owner
- [ ] DEMO flag confirmed **off** in Production
- [ ] Rollback path tested once

**Supabase**
- [ ] Staging access token issued (scoped) and stored as secret
- [ ] Prod access limited to reviewed-migration apply + read logs
- [ ] `service-role` key only in server env (never `NEXT_PUBLIC_*`, never chat)
- [ ] Auth redirect URLs: previews on staging, canonical only on prod
- [ ] Email (magic-link/OTP) templates + rate limits reviewed

**Notifications / Observability / Legal**
- [ ] Resend API key set + sending domain verified (DNS)
- [ ] Sentry DSN (env) + scoped auth token (CI)
- [ ] Uptime monitor configured
- [ ] Legal/PDPL inputs + studio business details provided
- [ ] (Deferred) WhatsApp token — not required for launch

**Close-out**
- [ ] Plan to **rotate every secret** and **remove agent access** after handoff documented

---

## 11. Coverage verification — every non-payment audit task maps to the access above

| Audit area | Enabled by |
|------------|-----------|
| Security/auth fixes | R1, R9–R12, R11 (Auth), branch protection |
| Supabase configuration | R9–R12, R11 |
| RLS policies & DB migrations | R9 (staging), R10 (prod apply), CI migration check (R3) |
| Profile/account flows | R1 (code), R9 (data/RLS) |
| Login UX | R11 (redirects/templates/expiry), R1 (code), R7 (preview) |
| Notifications | R14 (email), in-app (code+R9), R5/R6 (env); WhatsApp = N5 (deferred) |
| Legal pages | R1 (code) + R16 (content/PDPL) |
| CI/CD | R2, R3, N3 |
| Monitoring/observability | R13, R15, N1, N4 |
| Backups | R9/R10 (verify), §9 |
| Rollback strategy | R8 (Vercel), R10 (DB PITR), §9 |
| Tests (unit + E2E) | R2/R3 (CI), R17 (test users), R7 (preview) |
| Deployment readiness | R5–R8, N2 (domain, optional) |

✅ All listed non-payment tasks are completable with the **Required access** set; the **Nice-to-have** set only improves polish (analytics, custom domain, WhatsApp, status page). Payments intentionally excluded.
