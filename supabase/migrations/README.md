# ÉLAN — Supabase migrations

The production schema was originally provisioned directly on Supabase. These
files retrofit it into version control.

| File | Purpose | Re-runnable on live DB? |
|---|---|---|
| `0001_baseline.sql` | Enums + tables (IF NOT EXISTS) + constraints + indexes + the `class_instance_availability` view. Captured from the live DB. | Tables/enums yes; raw `ADD CONSTRAINT` lines assume a **fresh** project. |
| `0002_rls_policies.sql` | All Row-Level Security policies (`drop policy if exists` + `create`). | ✅ Idempotent |
| `0003_security_financial_hardening.sql` | Email-policy removal, email unique index, `payments.credits`, credit idempotency index, `uniq_active_booking`, `search_path` pinning, member self-update column guard. | ✅ Idempotent |

## Notes
- **Function bodies** (`book_class`, `cancel_booking`, `handle_new_user`,
  `fulfill_purchase`, `is_admin`, `current_member_id`, `elan_credit_balance`,
  the `*_self` wrappers and `_elan_*` helpers) are documented verbatim in
  `docs/SYSTEM_CODE_APPENDIX.md`. They already exist on the live DB; `0003` only
  hardens their `search_path`.
- For a 100% authoritative baseline of an existing project, run the Supabase CLI
  locally: `supabase db pull` (not runnable in this environment).
- Trigger `on_auth_user_created` on `auth.users` executes `public.handle_new_user()`.
