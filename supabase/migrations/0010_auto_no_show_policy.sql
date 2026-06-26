-- 0010 Auto no-show / late-cancel suspension policy (#15)
-- A member who accumulates too many no-show / late-cancel penalties inside a
-- rolling window is automatically suspended from self-booking for a cool-off
-- period. Admins can also suspend/forgive manually.

-- Policy knobs live alongside the existing penalty settings.
alter table public.penalty_settings
  add column if not exists suspension_enabled boolean not null default true,
  add column if not exists suspension_threshold integer not null default 3,
  add column if not exists suspension_window_days integer not null default 60,
  add column if not exists suspension_days integer not null default 14;

-- Manual override fields on the member:
--   suspended_until   – explicit admin suspension end (NULL = none)
--   penalty_forgiven_at – penalties before this instant are ignored by the auto
--                         policy (lets an admin lift an auto-suspension)
alter table public.members
  add column if not exists suspended_until timestamptz,
  add column if not exists penalty_forgiven_at timestamptz;

-- Effective suspension end for a member (NULL when not suspended). Combines the
-- manual admin suspension with the computed auto-suspension; returns the latest.
create or replace function public.member_suspended_until(p_member uuid)
returns timestamptz
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare
  v_ps public.penalty_settings;
  v_manual timestamptz; v_forgiven timestamptz;
  v_cnt int; v_last timestamptz; v_auto timestamptz;
begin
  select suspended_until, penalty_forgiven_at into v_manual, v_forgiven
    from public.members where id = p_member;
  select * into v_ps from public.penalty_settings where id;

  if v_ps.suspension_enabled then
    select count(*), max(created_at) into v_cnt, v_last
      from public.penalties
      where member_id = p_member
        and kind in ('late_cancel','no_show')
        and created_at >= now() - make_interval(days => v_ps.suspension_window_days)
        and (v_forgiven is null or created_at > v_forgiven);
    if v_cnt >= v_ps.suspension_threshold then
      v_auto := v_last + make_interval(days => v_ps.suspension_days);
    end if;
  end if;

  if v_manual is null and v_auto is null then return null; end if;
  return greatest(coalesce(v_manual, v_auto), coalesce(v_auto, v_manual));
end; $$;
grant execute on function public.member_suspended_until(uuid) to authenticated;

-- Block self-booking while suspended. Admin booking-on-behalf bypasses this
-- (it goes through book_class directly, not book_class_self).
create or replace function public.book_class_self(p_class_instance_id uuid, p_source booking_source default 'web'::booking_source)
returns public.bookings
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid;
begin
  select id into v_member from public.members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;
  if public.member_suspended_until(v_member) > now() then raise exception 'SUSPENDED'; end if;
  return public.book_class(v_member, p_class_instance_id, p_source);
end; $$;

notify pgrst, 'reload schema';
