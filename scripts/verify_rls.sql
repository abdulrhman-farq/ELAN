-- =============================================================================
-- scripts/verify_rls.sql  (workstream B4 — RLS verification)
-- =============================================================================
-- READ-ONLY diagnostic script. This file performs NO writes, DDL, or DML.
-- It only inspects the PostgreSQL catalogs (pg_class, pg_namespace, pg_policies,
-- pg_proc) and reports potential security gaps.
--
-- HOW TO RUN:
--     psql "$DB_URL" -f scripts/verify_rls.sql
--
-- SAFETY:
--   * Run against STAGING first, then production.
--   * Nothing here modifies data or schema; it is safe to run on a live DB.
--   * Output is organized as labeled result sets (check_name + detail columns)
--     so it is readable under `psql -f`.
--
-- This script does NOT mark anything as "verified". It surfaces findings that an
-- operator must review. Treat any row under a FAILURE/GAP check as action-needed.
-- =============================================================================

\echo '==================================================================='
\echo 'ELAN RLS VERIFICATION (read-only)'
\echo '==================================================================='

-- -----------------------------------------------------------------------------
-- CHECK 1: Tables in schema "public" that DO NOT have RLS enabled.
-- These are GAPS: any base table without row-level security is fully exposed to
-- whatever table-level grants exist.
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- CHECK 1: public tables WITHOUT RLS enabled (GAPS) ---'

SELECT
    '1_rls_disabled'                       AS check_name,
    'GAP: RLS not enabled on public.' || c.relname AS detail,
    c.relname                              AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'              -- ordinary (base) tables only
  AND c.relrowsecurity = false
ORDER BY c.relname;

-- -----------------------------------------------------------------------------
-- CHECK 2: Tables in "public" WITH RLS enabled but ZERO policies.
-- RLS-on + no policy == default-deny for non-owners, which is often a mistake
-- (the table becomes inaccessible) OR a sign that policies were never written.
-- Flag for review either way.
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- CHECK 2: public tables with RLS ENABLED but NO policies ---'

SELECT
    '2_rls_on_no_policy'                                          AS check_name,
    'RLS on but no policy on public.' || c.relname               AS detail,
    c.relname                                                    AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN (
    SELECT schemaname, tablename, count(*) AS policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
) p ON p.schemaname = n.nspname AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND COALESCE(p.policy_count, 0) = 0
ORDER BY c.relname;

-- -----------------------------------------------------------------------------
-- CHECK 3: Summary count of policies per table (schema public).
-- Informational. Lets the operator eyeball coverage at a glance.
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- CHECK 3: policy count per public table (summary) ---'

SELECT
    '3_policy_summary'                  AS check_name,
    tablename                           AS table_name,
    count(*)                           AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- -----------------------------------------------------------------------------
-- CHECK 4: EXECUTE-privilege check on sensitive functions.
-- For each sensitive function we report whether anon / authenticated can
-- EXECUTE it. The payment/fulfillment family must NOT be executable by anon or
-- authenticated; any TRUE there is a FAILURE to flag.
--
-- Robustness:
--   * We only consider functions that actually exist (joined from pg_proc), so a
--     not-yet-created function simply produces no row instead of erroring.
--   * has_function_privilege is called with the function OID, avoiding ambiguity
--     and avoiding errors for non-existent signatures.
-- -----------------------------------------------------------------------------
\echo ''
\echo '--- CHECK 4: EXECUTE privilege on sensitive functions ---'
\echo '    (TRUE for anon/authenticated on payment/fulfillment fns = FAILURE)'

WITH sensitive(fname, is_payment_family) AS (
    VALUES
        ('simulate_purchase',   true),
        ('fulfill_purchase',    true),
        ('confirm_payment',     true),
        ('refund_payment',      true),
        ('adjust_credits_admin', false)   -- admin fn: still report, not auto-fail
),
fns AS (
    SELECT
        s.fname,
        s.is_payment_family,
        p.oid AS func_oid
    FROM sensitive s
    -- LEFT JOIN so a missing function still yields a row labeled MISSING.
    LEFT JOIN pg_proc p
        ON p.proname = s.fname
       AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
SELECT
    '4_func_execute_grants'             AS check_name,
    f.fname                             AS function_name,
    CASE WHEN f.func_oid IS NULL THEN '(not present in DB)'
         ELSE 'public.' || f.fname || '(...)'
    END                                AS detail,
    CASE WHEN f.func_oid IS NULL THEN NULL
         ELSE has_function_privilege('anon',          f.func_oid, 'EXECUTE')
    END                                AS anon_can_execute,
    CASE WHEN f.func_oid IS NULL THEN NULL
         ELSE has_function_privilege('authenticated', f.func_oid, 'EXECUTE')
    END                                AS authenticated_can_execute,
    CASE
        WHEN f.func_oid IS NULL THEN 'MISSING (not in DB)'
        WHEN f.is_payment_family AND (
                 has_function_privilege('anon',          f.func_oid, 'EXECUTE')
              OR has_function_privilege('authenticated', f.func_oid, 'EXECUTE')
             )
            THEN 'FAILURE: payment/fulfillment fn executable by client role'
        ELSE 'review'
    END                                AS verdict
FROM fns f
ORDER BY f.fname;

\echo ''
\echo '==================================================================='
\echo 'END OF RLS VERIFICATION. Review every GAP / FAILURE / no-policy row.'
\echo 'This report does NOT certify the DB; an operator must act on findings.'
\echo '==================================================================='
