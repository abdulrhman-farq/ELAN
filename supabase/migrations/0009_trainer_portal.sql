-- 0009 Trainer portal
-- Give instructors their own authenticated login scoped to their own classes:
--   * link instructors.auth_user_id -> auth.users
--   * current_instructor_id() / is_instructor() helpers (mirror current_member_id/is_admin)
--   * scoped SELECT RLS so a trainer can read bookings + members ONLY for her classes
--   * attendance RPCs authorized to admin OR the instructor of that booking's class
--   * admin-only provisioning RPC to link an instructor to an existing auth account
-- Attendance writes go through SECURITY DEFINER RPCs (no broad bookings UPDATE grant
-- for trainers), and every RPC enforces authorization INTERNALLY (defence in depth,
-- not relying on the server action alone).

-- 1) Auth link --------------------------------------------------------------
alter table public.instructors
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create unique index if not exists instructors_auth_user_id_key
  on public.instructors(auth_user_id) where auth_user_id is not null;

-- 2) Identity helpers -------------------------------------------------------
create or replace function public.current_instructor_id()
returns uuid
language sql stable security definer set search_path = public, pg_temp as $$
  select id from public.instructors
  where auth_user_id = auth.uid() and active
  limit 1;
$$;

create or replace function public.is_instructor()
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select exists(
    select 1 from public.instructors where auth_user_id = auth.uid() and active
  );
$$;

grant execute on function public.current_instructor_id() to authenticated;
grant execute on function public.is_instructor() to authenticated;

-- 3) Scoped read RLS for trainers ------------------------------------------
-- class_instances / class_types / instructors are already public-readable, so a
-- trainer can read the schedule. She also needs the bookings + member contact
-- details for HER classes (and only those) to run a roster / check-in.
drop policy if exists bookings_instructor_select on public.bookings;
create policy bookings_instructor_select on public.bookings
  for select to authenticated
  using (exists (
    select 1 from public.class_instances ci
    where ci.id = class_instance_id
      and ci.instructor_id = public.current_instructor_id()
  ));

drop policy if exists members_instructor_select on public.members;
create policy members_instructor_select on public.members
  for select to authenticated
  using (exists (
    select 1 from public.bookings b
    join public.class_instances ci on ci.id = b.class_instance_id
    where b.member_id = members.id
      and ci.instructor_id = public.current_instructor_id()
  ));

-- 4) Attendance authorization ----------------------------------------------
create or replace function public.elan_can_manage_booking(p_booking_id uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_admin() or exists (
    select 1 from public.bookings b
    join public.class_instances ci on ci.id = b.class_instance_id
    where b.id = p_booking_id
      and ci.instructor_id = public.current_instructor_id()
  );
$$;
grant execute on function public.elan_can_manage_booking(uuid) to authenticated;

-- Mark attended (admin or owning instructor). Idempotent-ish: allows re-marking
-- from confirmed or no_show back to attended.
create or replace function public.mark_attended(p_booking_id uuid)
returns public.bookings
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_booking public.bookings;
begin
  if not public.elan_can_manage_booking(p_booking_id) then raise exception 'FORBIDDEN'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if v_booking.status not in ('confirmed','no_show','attended') then raise exception 'NOT_CONFIRMED'; end if;
  update public.bookings set status = 'attended' where id = v_booking.id returning * into v_booking;
  return v_booking;
end; $$;
grant execute on function public.mark_attended(uuid) to authenticated;

-- Harden the existing no-show RPC with the SAME internal authorization. Previously
-- it relied solely on the server action; now any caller must be admin or the
-- owning instructor. Body otherwise unchanged (penalty logic preserved).
create or replace function public.mark_no_show(p_booking_id uuid)
returns public.bookings
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_booking public.bookings; v_ps public.penalty_settings;
begin
  if not public.elan_can_manage_booking(p_booking_id) then raise exception 'FORBIDDEN'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if v_booking.status <> 'confirmed' then raise exception 'NOT_CONFIRMED'; end if;
  select * into v_ps from public.penalty_settings where id;
  update public.bookings set status = 'no_show' where id = v_booking.id returning * into v_booking;
  if v_ps.active then
    insert into public.penalties (member_id, booking_id, kind, amount_credits, amount_sar)
      values (v_booking.member_id, v_booking.id, 'no_show', v_ps.no_show_fee_credits, v_ps.no_show_fee_sar);
    if v_booking.credits_used = 0 and v_ps.no_show_fee_credits > 0 then
      perform public._elan_add_ledger(v_booking.member_id, -v_ps.no_show_fee_credits, 'penalty', v_booking.id);
    end if;
  end if;
  return v_booking;
end; $$;
grant execute on function public.mark_no_show(uuid) to authenticated;

-- 5) Provisioning (admin only) ---------------------------------------------
-- Link an instructor record to an EXISTING auth account by email. The trainer
-- must have signed in at least once (via the email magic link) so her auth.users
-- row exists; the admin then connects it here. No implicit email-based access.
create or replace function public.link_instructor_auth(p_instructor_id uuid, p_email text)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_uid is null then raise exception 'NO_AUTH_USER'; end if;
  update public.instructors set auth_user_id = v_uid where id = p_instructor_id;
end; $$;
grant execute on function public.link_instructor_auth(uuid, text) to authenticated;

-- Unlink (admin only) — revoke a trainer's portal access.
create or replace function public.unlink_instructor_auth(p_instructor_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.instructors set auth_user_id = null where id = p_instructor_id;
end; $$;
grant execute on function public.unlink_instructor_auth(uuid) to authenticated;

-- Mutating RPCs are never called anonymously — revoke anon EXECUTE (defence in
-- depth; authorization is already enforced inside each function).
revoke execute on function public.mark_attended(uuid) from anon;
revoke execute on function public.mark_no_show(uuid) from anon;
revoke execute on function public.link_instructor_auth(uuid, text) from anon;
revoke execute on function public.unlink_instructor_auth(uuid) from anon;

notify pgrst, 'reload schema';
