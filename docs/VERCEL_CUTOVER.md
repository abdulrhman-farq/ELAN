# ÉLAN — Vercel cutover checklist

Use this after merging the publish-readiness PR.

## 1. Supabase migrations

Run on **staging first**, then **production** (Supabase → SQL Editor):

```bash
node scripts/launch-cutover.mjs sql
```

Or apply via CLI (requires `SUPABASE_ACCESS_TOKEN` + project link):

```bash
supabase link --project-ref xpslluqnrvmeapfqkjsd   # staging
supabase db push
supabase link --project-ref knldyssbwygrkxamttez   # production
supabase db push
```

Verify:

```bash
node scripts/launch-cutover.mjs verify
```

## 2. Vercel environment variables

Project: `elan` · team: `abdulrhman-farqs-projects`

### Preview only (staging isolation)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xpslluqnrvmeapfqkjsd.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon (see `docs/STAGING_SETUP.md`) |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service_role (dashboard — secret) |
| `NEXT_PUBLIC_ELAN_DEMO` | `false` |
| `NEXT_PUBLIC_SITE_URL` | leave empty or use preview URL |

### Production

| Variable | Value | Required for launch |
|----------|-------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://knldyssbwygrkxamttez.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production anon | Yes |
| `NEXT_PUBLIC_SITE_URL` | `https://elan-rosy.vercel.app` (or custom domain) | Yes |
| `NEXT_PUBLIC_ELAN_DEMO` | `false` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | production service_role | For webhooks |
| `SENTRY_DSN` | from sentry.io project | Recommended |
| `RESEND_API_KEY` + `RESEND_FROM` | from resend.com | For email |
| `MOYASAR_SECRET_KEY` | from moyasar.com | For self-serve pay |
| `PAYMENT_WEBHOOK_SECRET` | random HMAC secret | With Moyasar |

CLI (after `vercel login`):

```bash
vercel link --project elan
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
# repeat per variable; use --environment production for prod set
```

## 3. Custom domain

1. Vercel → Project `elan` → **Settings → Domains**
2. Add `app.elan.sa` (or apex `elan.sa` with A record)
3. At DNS provider: CNAME `app` → `cname.vercel-dns.com`
4. Update `NEXT_PUBLIC_SITE_URL` in Production to `https://app.elan.sa`
5. Supabase → Auth → URL configuration: add `https://app.elan.sa/**` to redirect allow list

## 4. GitHub Actions secrets (acceptance E2E)

Repository → Settings → Secrets → Actions:

| Secret | Staging value |
|--------|---------------|
| `E2E_ADMIN_EMAIL` | `admin@staging.elan.test` |
| `E2E_ADMIN_PASSWORD` | `ElanStaging!2026` |
| `E2E_MEMBER_EMAIL` | `member@staging.elan.test` |
| `E2E_MEMBER_PASSWORD` | `ElanStaging!2026` |
| `STAGING_SUPABASE_URL` | staging URL |
| `STAGING_SUPABASE_ANON_KEY` | staging anon |

## 5. Acceptance test (local against staging)

```bash
npm run build
PORT=3001 \
NEXT_PUBLIC_SUPABASE_URL=https://xpslluqnrvmeapfqkjsd.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon> \
NEXT_PUBLIC_ELAN_DEMO=false \
npm run start &
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 \
E2E_ADMIN_EMAIL=admin@staging.elan.test \
E2E_ADMIN_PASSWORD='ElanStaging!2026' \
E2E_MEMBER_EMAIL=member@staging.elan.test \
E2E_MEMBER_PASSWORD='ElanStaging!2026' \
npm run test:e2e -- e2e/acceptance.spec.ts
```

## 6. Post-deploy smoke

- https://elan-rosy.vercel.app/login — legal links visible
- `/privacy` · `/terms` — bilingual
- `/admin/health` — all checks green or info-only
- Member login → schedule shows classes
