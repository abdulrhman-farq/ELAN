-- 0013 In-app notification read state (#1)
-- Track which in-app notifications a member has seen so we can show an unread
-- badge. Members never UPDATE the table directly; a SECURITY DEFINER RPC marks
-- their own in-app notifications read when they open the inbox.

alter table public.notifications add column if not exists read_at timestamptz;

create or replace function public.mark_my_notifications_read()
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid;
begin
  select id into v_member from public.members where auth_user_id = auth.uid();
  if v_member is null then return; end if;
  update public.notifications set read_at = now()
    where member_id = v_member and channel = 'in_app' and read_at is null;
end; $$;
revoke execute on function public.mark_my_notifications_read() from anon;
grant execute on function public.mark_my_notifications_read() to authenticated;

notify pgrst, 'reload schema';
