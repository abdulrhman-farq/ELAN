-- 0018_harden_handle_new_user.sql
-- SECURITY (S1): prevent email-based account takeover of admin pre-created member
-- rows. The original trigger linked a new auth user to an existing member purely
-- by lower(email), with no proof the email was verified. This version links/creates
-- ONLY after the email is confirmed, and never creates a duplicate member row.
--
-- ⚠️ PENDING STAGING VALIDATION — DO NOT APPLY TO PRODUCTION UNVERIFIED.
-- Two things must be confirmed on staging first:
--   1. Supabase Auth "Confirm email" is ENABLED (dashboard) — otherwise
--      email_confirmed_at is always set and the gate is a no-op.
--   2. The existing trigger name on auth.users. Find it with:
--        select tgname from pg_trigger where tgrelid = 'auth.users'::regclass;
--      If it is NOT `on_auth_user_created`, update the DROP below to match so the
--      old trigger is replaced (not left firing alongside this one).
-- This migration also changes the trigger to fire on email confirmation, so
-- verified linking still happens when confirmation is a later step than signup.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_member uuid;
begin
  -- Gate: act only once the email is verified.
  if new.email_confirmed_at is null then
    return new;
  end if;

  -- Link the new auth user to an existing (admin-created) member by VERIFIED email.
  update public.members
     set auth_user_id = new.id
   where auth_user_id is null
     and lower(email) = lower(new.email)
   returning id into v_member;

  -- Create a fresh member only when no row exists for this email (no duplicates).
  if v_member is null and not exists (
    select 1 from public.members where lower(email) = lower(new.email)
  ) then
    insert into public.members (auth_user_id, full_name, phone, email, locale)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'عضوة'), new.phone, new.email, 'ar')
    on conflict (auth_user_id) do nothing
    returning id into v_member;
  end if;

  if v_member is not null then
    insert into public.member_consents (member_id, channel, active) values
      (v_member, 'whatsapp', true), (v_member, 'in_app', true)
    on conflict do nothing;
  end if;
  return new;
end; $function$;

-- Re-point the trigger so verified linking runs at signup AND at confirmation.
-- Confirm the existing trigger name first (see header note).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_new_user();
