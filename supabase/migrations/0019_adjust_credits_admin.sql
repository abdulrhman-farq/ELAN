-- 0019_adjust_credits_admin.sql
-- B1: atomic, floored admin credit adjustment. Replaces the read-compute-insert
-- ledger writes in src/admin-actions.ts (which had a race and could drive a
-- balance negative). Takes a row lock, re-reads the balance under it, refuses to
-- go below zero, and writes via the single _elan_add_ledger writer.
--
-- ⚠️ PENDING STAGING VALIDATION — apply to staging and run the integration tests
-- (credit balance cannot go negative; non-staff cannot call) before production.
-- The app wiring in admin-actions.ts is flipped to call this RPC only AFTER the
-- function exists in the connected DB (see docs/BACKEND_DB_HANDOFF.md).

create or replace function public.adjust_credits_admin(
  p_member uuid,
  p_delta  int,
  p_reason text,
  p_ref    uuid default null
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare v_bal int;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if p_delta = 0 then return; end if;

  -- Lock the member row so concurrent adjustments serialize on the same balance.
  perform 1 from public.members where id = p_member for update;
  if not found then raise exception 'MEMBER_NOT_FOUND'; end if;

  v_bal := coalesce(public.elan_credit_balance(p_member), 0);
  if v_bal + p_delta < 0 then raise exception 'INSUFFICIENT_CREDITS'; end if;

  perform public._elan_add_ledger(p_member, p_delta, p_reason, p_ref);
end; $function$;

-- Authorization is enforced inside the function (is_staff). Keep it off anon.
revoke execute on function public.adjust_credits_admin(uuid,int,text,uuid) from public, anon;
grant  execute on function public.adjust_credits_admin(uuid,int,text,uuid) to authenticated;
