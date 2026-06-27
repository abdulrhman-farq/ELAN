-- 0012 Granular roles: Manager (ops only) (#4)
-- Managers run day-to-day operations (schedule, rosters/attendance, members,
-- broadcasts) but NOT finances, promo codes, settings, or access management.
-- Implemented ADDITIVELY: is_admin() and every existing admin RLS policy are
-- left untouched (full admin keeps everything); managers get their own explicit
-- policies only on the ops tables. Finance/settings tables get NO manager policy
-- and so remain admin-only at the database level.

create table if not exists public.managers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.managers enable row level security;

drop policy if exists managers_admin_all on public.managers;
create policy managers_admin_all on public.managers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists managers_self_read on public.managers;
create policy managers_self_read on public.managers
  for select to authenticated using (auth_user_id = auth.uid());

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.managers where auth_user_id = auth.uid() and active);
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_admin() or public.is_manager();
$$;
grant execute on function public.is_manager() to authenticated;
grant execute on function public.is_staff() to authenticated;

-- Ops-table access for managers (additive; existing is_admin policies remain) ---
drop policy if exists class_instances_manager_write on public.class_instances;
create policy class_instances_manager_write on public.class_instances
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists bookings_manager_all on public.bookings;
create policy bookings_manager_all on public.bookings
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists members_manager_select on public.members;
create policy members_manager_select on public.members
  for select to authenticated using (public.is_manager());
drop policy if exists members_manager_update on public.members;
create policy members_manager_update on public.members
  for update to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists member_notes_manager_all on public.member_notes;
create policy member_notes_manager_all on public.member_notes
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

drop policy if exists member_tasks_manager_all on public.member_tasks;
create policy member_tasks_manager_all on public.member_tasks
  for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Ops SECURITY DEFINER functions accept staff (admin OR manager) ---------------
create or replace function public.elan_can_manage_booking(p_booking_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select public.is_admin() or public.is_manager() or exists (
    select 1 from public.bookings b
    join public.class_instances ci on ci.id = b.class_instance_id
    where b.id = p_booking_id
      and ci.instructor_id = public.current_instructor_id()
  );
$$;

create or replace function public.broadcast_notification(
  p_title text, p_message text,
  p_channel notification_channel default 'in_app', p_segment text default 'all'
) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_count integer;
begin
  if not public.is_staff() then raise exception 'FORBIDDEN'; end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'EMPTY_MESSAGE'; end if;
  with targets as (
    select m.id from public.members m
    where (coalesce(m.role, 'member') <> 'admin')
      and (
        p_segment = 'all'
        or (p_segment = 'active' and (
              exists (select 1 from public.member_memberships mm
                       where mm.member_id = m.id and mm.status = 'active'
                         and mm.current_period_end > now())
              or public.elan_credit_balance(m.id) > 0))
      )
      and (p_channel <> 'whatsapp' or public._elan_has_consent(m.id, 'whatsapp'))
  ), inserted as (
    insert into public.notifications (member_id, channel, template, payload, status)
    select t.id, p_channel, 'broadcast',
           jsonb_build_object('title', p_title, 'message', p_message), 'pending'
    from targets t returning 1
  )
  select count(*) into v_count from inserted;
  return v_count;
end; $$;
revoke execute on function public.broadcast_notification(text, text, notification_channel, text) from anon;
grant execute on function public.broadcast_notification(text, text, notification_channel, text) to authenticated;

-- Admin-only provisioning of managers (by existing auth account email) ---------
create or replace function public.link_manager_auth(p_email text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_uid uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select id into v_uid from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_uid is null then raise exception 'NO_AUTH_USER'; end if;
  insert into public.managers (auth_user_id, name)
    values (v_uid, p_email)
    on conflict (auth_user_id) do update set active = true;
end; $$;
revoke execute on function public.link_manager_auth(text) from anon;
grant execute on function public.link_manager_auth(text) to authenticated;

create or replace function public.unlink_manager_auth(p_manager_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  update public.managers set active = false where id = p_manager_id;
end; $$;
revoke execute on function public.unlink_manager_auth(uuid) from anon;
grant execute on function public.unlink_manager_auth(uuid) to authenticated;

notify pgrst, 'reload schema';
