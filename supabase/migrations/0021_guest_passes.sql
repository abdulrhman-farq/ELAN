-- 0021 Guest passes (تصاريح الضيوف)
-- A member may bring a guest to a class. The guest takes a real seat (counts
-- toward capacity) and the host always pays 1 credit — a membership never
-- covers a guest. Guests are seat-only: no waitlisting.

-- 1. Guest fields on bookings. A guest row is attributed to the host member_id
--    so the host can see and cancel it through the normal flow.
alter table public.bookings add column if not exists is_guest    boolean not null default false;
alter table public.bookings add column if not exists guest_name  text;
alter table public.bookings add column if not exists guest_phone text;

-- 2. The "one active booking per member per class" rule must not block a host
--    from also bringing guests — restrict the unique index to non-guest rows.
drop index if exists public.uniq_active_booking;
create unique index uniq_active_booking
  on public.bookings (class_instance_id, member_id)
  where status in ('confirmed','waitlisted') and is_guest = false;

-- 3. Book a guest seat. Host pays 1 credit (payg); no waitlist for guests.
create or replace function public.book_guest(
  p_member uuid, p_class_instance_id uuid, p_guest_name text, p_guest_phone text default null,
  p_source booking_source default 'web'::booking_source)
returns public.bookings
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_inst class_instances;
  v_confirmed int; v_name text := nullif(btrim(coalesce(p_guest_name,'')), '');
  v_booking bookings;
begin
  if v_name is null then raise exception 'GUEST_NAME_REQUIRED'; end if;

  select * into v_inst from class_instances where id = p_class_instance_id for update;
  if not found then raise exception 'CLASS_NOT_FOUND'; end if;
  if v_inst.status <> 'scheduled'
     or now() < v_inst.booking_opens_at or now() >= v_inst.booking_closes_at then
    raise exception 'BOOKING_CLOSED';
  end if;

  select count(*) into v_confirmed from bookings
    where class_instance_id = p_class_instance_id and status = 'confirmed';
  if v_inst.capacity - v_confirmed <= 0 then raise exception 'CLASS_FULL'; end if;

  if elan_credit_balance(p_member) < 1 then raise exception 'NO_CREDITS'; end if;

  insert into bookings
    (class_instance_id, member_id, status, source, credits_used, payment_audience,
     is_guest, guest_name, guest_phone)
  values
    (p_class_instance_id, p_member, 'confirmed', p_source, 1, 'payg',
     true, v_name, nullif(btrim(coalesce(p_guest_phone,'')), ''))
  returning * into v_booking;

  perform _elan_add_ledger(p_member, -1, 'booking', v_booking.id);
  return v_booking;
end; $$;
revoke execute on function public.book_guest(uuid, uuid, text, text, booking_source) from anon;
grant execute on function public.book_guest(uuid, uuid, text, text, booking_source) to authenticated;

-- 4. Self wrapper: resolve the host from the session, block if suspended.
create or replace function public.book_guest_self(
  p_class_instance_id uuid, p_guest_name text, p_guest_phone text default null,
  p_source booking_source default 'web'::booking_source)
returns public.bookings
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid;
begin
  select id into v_member from public.members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;
  if public.member_suspended_until(v_member) > now() then raise exception 'SUSPENDED'; end if;
  return public.book_guest(v_member, p_class_instance_id, p_guest_name, p_guest_phone, p_source);
end; $$;
revoke execute on function public.book_guest_self(uuid, text, text, booking_source) from anon;
grant execute on function public.book_guest_self(uuid, text, text, booking_source) to authenticated;

notify pgrst, 'reload schema';
