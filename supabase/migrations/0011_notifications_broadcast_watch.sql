-- 0011 Notifications: broadcast (#17) + notify-when-spot-opens (#19)
-- Both enqueue into the existing notifications table. Actual WhatsApp delivery
-- is handled by the (future) sender worker; in_app notifications surface in the
-- member app immediately.

-- Members can read their own notifications; admins read all. (Inserts happen
-- only through SECURITY DEFINER RPCs / server logic, never directly.)
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated
  using (member_id = public.current_member_id() or public.is_admin());

-- #17 Broadcast: enqueue one notification per targeted member. Admin only.
-- Segment: 'all' = every member; 'active' = active membership OR positive credit
-- balance. WhatsApp rows are only created for members who consented.
create or replace function public.broadcast_notification(
  p_title text,
  p_message text,
  p_channel notification_channel default 'in_app',
  p_segment text default 'all'
) returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_count integer;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  if coalesce(trim(p_message), '') = '' then raise exception 'EMPTY_MESSAGE'; end if;

  with targets as (
    select m.id
    from public.members m
    where (coalesce(m.role, 'member') <> 'admin')
      and (
        p_segment = 'all'
        or (p_segment = 'active' and (
              exists (select 1 from public.member_memberships mm
                       where mm.member_id = m.id and mm.status = 'active'
                         and mm.current_period_end > now())
              or public.elan_credit_balance(m.id) > 0
            ))
      )
      and (p_channel <> 'whatsapp' or public._elan_has_consent(m.id, 'whatsapp'))
  ), inserted as (
    insert into public.notifications (member_id, channel, template, payload, status)
    select t.id, p_channel, 'broadcast',
           jsonb_build_object('title', p_title, 'message', p_message), 'pending'
    from targets t
    returning 1
  )
  select count(*) into v_count from inserted;
  return v_count;
end; $$;
revoke execute on function public.broadcast_notification(text, text, notification_channel, text) from anon;
grant execute on function public.broadcast_notification(text, text, notification_channel, text) to authenticated;

-- #19 Watch a full class to be pinged when a seat frees -----------------------
create table if not exists public.class_watches (
  id uuid primary key default gen_random_uuid(),
  class_instance_id uuid not null references public.class_instances(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (class_instance_id, member_id)
);
alter table public.class_watches enable row level security;

drop policy if exists class_watches_own on public.class_watches;
create policy class_watches_own on public.class_watches
  for all to authenticated
  using (member_id = public.current_member_id() or public.is_admin())
  with check (member_id = public.current_member_id() or public.is_admin());

create or replace function public.watch_class_self(p_class_instance_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid;
begin
  select id into v_member from public.members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;
  insert into public.class_watches (class_instance_id, member_id)
    values (p_class_instance_id, v_member)
    on conflict (class_instance_id, member_id) do nothing;
end; $$;
revoke execute on function public.watch_class_self(uuid) from anon;
grant execute on function public.watch_class_self(uuid) to authenticated;

create or replace function public.unwatch_class_self(p_class_instance_id uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid;
begin
  select id into v_member from public.members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;
  delete from public.class_watches
    where class_instance_id = p_class_instance_id and member_id = v_member;
end; $$;
revoke execute on function public.unwatch_class_self(uuid) from anon;
grant execute on function public.unwatch_class_self(uuid) to authenticated;

-- Enqueue "spot opened" notifications IF the class genuinely has a free seat
-- (i.e. the waitlist did not absorb it). Idempotent via notified_at.
create or replace function public.elan_notify_watchers(p_class uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_free int;
begin
  select (capacity - confirmed_count) into v_free
    from public.class_instance_availability where class_instance_id = p_class;
  if coalesce(v_free, 0) <= 0 then return; end if;

  insert into public.notifications (member_id, channel, template, payload, status)
    select w.member_id,
           (case when public._elan_has_consent(w.member_id, 'whatsapp') then 'whatsapp' else 'in_app' end)::notification_channel,
           'spot_opened',
           jsonb_build_object('class_instance_id', p_class), 'pending'
    from public.class_watches w
    where w.class_instance_id = p_class and w.notified_at is null;

  update public.class_watches set notified_at = now()
    where class_instance_id = p_class and notified_at is null;
end; $$;

-- Hook the watcher notification into cancel_booking: after the waitlist
-- promotion loop runs, notify watchers only if a seat remains open. Body is the
-- existing function verbatim + one perform before the final return.
create or replace function public.cancel_booking(p_member uuid, p_booking_id uuid)
returns public.bookings
language plpgsql security definer set search_path to 'public', 'pg_temp' as $function$
declare
  v_booking bookings; v_inst class_instances;
  v_ps penalty_settings; v_old_pos int;
  v_cand bookings; v_promoted bookings; v_inside boolean;
begin
  select * into v_booking from bookings where id = p_booking_id for update;
  if not found then raise exception 'BOOKING_NOT_FOUND'; end if;
  if v_booking.member_id <> p_member then raise exception 'FORBIDDEN'; end if;
  if v_booking.status not in ('confirmed','waitlisted') then raise exception 'NOT_CANCELLABLE'; end if;

  select * into v_inst from class_instances where id = v_booking.class_instance_id for update;
  select * into v_ps from penalty_settings where id;

  if v_booking.status = 'waitlisted' then
    v_old_pos := v_booking.waitlist_position;
    update bookings set status='cancelled', waitlist_position=null, cancelled_at=now()
      where id=v_booking.id returning * into v_booking;
    update bookings set waitlist_position = waitlist_position - 1
      where class_instance_id=v_inst.id and status='waitlisted'
        and waitlist_position > coalesce(v_old_pos, 2147483647);
    return v_booking;
  end if;

  v_inside := (v_inst.starts_at - now()) < make_interval(hours => v_ps.late_cancel_window_hours);

  if not v_inside then
    if v_booking.credits_used > 0 then
      perform _elan_add_ledger(p_member, 1, 'refund', v_booking.id);
    end if;
    update bookings set status='cancelled', cancelled_at=now()
      where id=v_booking.id returning * into v_booking;
  else
    update bookings set status='late_cancelled', cancelled_at=now()
      where id=v_booking.id returning * into v_booking;
    if v_ps.active then
      insert into penalties (member_id, booking_id, kind, amount_credits, amount_sar)
        values (p_member, v_booking.id, 'late_cancel', v_ps.late_cancel_fee_credits, v_ps.late_cancel_fee_sar);
      if v_booking.credits_used = 0 and v_ps.late_cancel_fee_credits > 0 then
        perform _elan_add_ledger(p_member, -v_ps.late_cancel_fee_credits, 'penalty', v_booking.id);
      end if;
    end if;
  end if;

  loop
    select * into v_cand from bookings
      where class_instance_id=v_inst.id and status='waitlisted'
      order by waitlist_position asc limit 1 for update;
    exit when not found;

    if _elan_membership_covers(v_cand.member_id) then
      update bookings set status='confirmed', waitlist_position=null, credits_used=0, payment_audience='member'
        where id=v_cand.id returning * into v_promoted;
    elsif elan_credit_balance(v_cand.member_id) >= 1 then
      update bookings set status='confirmed', waitlist_position=null, credits_used=1, payment_audience='payg'
        where id=v_cand.id returning * into v_promoted;
      perform _elan_add_ledger(v_cand.member_id, -1, 'booking', v_cand.id);
    else
      update bookings set status='cancelled', waitlist_position=null, cancelled_at=now() where id=v_cand.id;
      if _elan_has_consent(v_cand.member_id, 'in_app') then
        insert into notifications (member_id, channel, template, payload, status)
          values (v_cand.member_id, 'in_app', 'waitlist_promotion_failed',
                  jsonb_build_object('class_instance_id', v_inst.id), 'pending');
      end if;
      update bookings set waitlist_position = waitlist_position - 1
        where class_instance_id=v_inst.id and status='waitlisted'
          and waitlist_position > v_cand.waitlist_position;
      continue;
    end if;

    update bookings set waitlist_position = waitlist_position - 1
      where class_instance_id=v_inst.id and status='waitlisted';
    if _elan_has_consent(v_promoted.member_id, 'whatsapp') then
      insert into notifications (member_id, channel, template, payload, status)
        values (v_promoted.member_id, 'whatsapp', 'waitlist_promoted',
                jsonb_build_object('class_instance_id', v_inst.id, 'booking_id', v_promoted.id), 'pending');
    end if;
    exit;
  end loop;

  -- #19: if a seat is still open after waitlist handling, ping watchers.
  perform elan_notify_watchers(v_inst.id);

  return v_booking;
end; $function$;

notify pgrst, 'reload schema';
