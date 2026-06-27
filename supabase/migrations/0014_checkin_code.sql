-- 0014 Quick-code check-in (#2)
-- Each member has a short, stable check-in code she shows at the studio. A
-- trainer/manager/admin types it on the class roster to mark her attended —
-- no camera or scanner required (the code also encodes cleanly into a QR later).

alter table public.members add column if not exists checkin_code text;

-- Backfill existing members with a unique 6-char code.
update public.members
  set checkin_code = upper(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 6))
  where checkin_code is null;

create unique index if not exists members_checkin_code_key on public.members(checkin_code);

-- Auto-assign a code to new members.
create or replace function public._elan_set_checkin_code()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.checkin_code is null then
    new.checkin_code := upper(substr(md5(random()::text || clock_timestamp()::text || new.id::text), 1, 6));
  end if;
  return new;
end; $$;

drop trigger if exists members_set_checkin_code on public.members;
create trigger members_set_checkin_code before insert on public.members
  for each row execute function public._elan_set_checkin_code();

-- Staff check-in by code: mark the member's confirmed booking for this class as
-- attended. Authorized to admin, manager, or the class's own instructor.
create or replace function public.checkin_by_code(p_class_instance_id uuid, p_code text)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid; v_name text; v_booking uuid; v_status text;
begin
  if not (public.is_admin() or public.is_manager() or exists (
    select 1 from public.class_instances ci
    where ci.id = p_class_instance_id and ci.instructor_id = public.current_instructor_id()
  )) then raise exception 'FORBIDDEN'; end if;

  select id, full_name into v_member, v_name
    from public.members where checkin_code = upper(trim(p_code));
  if v_member is null then raise exception 'BAD_CODE'; end if;

  select id, status into v_booking, v_status
    from public.bookings
    where class_instance_id = p_class_instance_id and member_id = v_member
    order by created_at desc limit 1;
  if v_booking is null then raise exception 'NO_BOOKING'; end if;
  if v_status = 'attended' then return v_name; end if; -- idempotent
  if v_status <> 'confirmed' then raise exception 'NOT_CONFIRMED'; end if;

  update public.bookings set status = 'attended' where id = v_booking;
  return v_name;
end; $$;
revoke execute on function public.checkin_by_code(uuid, text) from anon;
grant execute on function public.checkin_by_code(uuid, text) to authenticated;

notify pgrst, 'reload schema';
