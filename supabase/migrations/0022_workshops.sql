-- 0022 Workshops (الورش)
-- Standalone paid events, separate from the recurring class schedule. A member
-- reserves a seat; payment is settled at the desk (payment processing is out of
-- scope), so a registration carries its own payment_status that staff update.

create table if not exists public.workshops (
  id uuid primary key default gen_random_uuid(),
  title_ar text not null,
  title_en text not null,
  description_ar text,
  description_en text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  price_net_halalas integer not null default 0 check (price_net_halalas >= 0),
  vat_bps integer not null default 1500,
  instructor_id uuid references public.instructors(id) on delete set null,
  room_id uuid references public.rooms(id) on delete set null,
  image_url text,
  location text,
  active boolean not null default true,
  registration_opens_at timestamptz,
  registration_closes_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.workshop_registrations (
  id uuid primary key default gen_random_uuid(),
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered','cancelled','attended','no_show')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  created_at timestamptz not null default now()
);
create index if not exists idx_workshop_regs_workshop on public.workshop_registrations(workshop_id);
create index if not exists idx_workshop_regs_member on public.workshop_registrations(member_id);
-- One active registration per member per workshop.
create unique index if not exists uniq_active_workshop_reg
  on public.workshop_registrations(workshop_id, member_id) where status = 'registered';

alter table public.workshops enable row level security;
alter table public.workshop_registrations enable row level security;

-- Workshops: public can read active ones; admins read all and write.
drop policy if exists workshops_read on public.workshops;
create policy workshops_read on public.workshops for select to public using (active or public.is_admin());
drop policy if exists workshops_admin_write on public.workshops;
create policy workshops_admin_write on public.workshops for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Registrations: member sees own, staff see all; only admin/staff write directly
-- (members register/cancel through SECURITY DEFINER RPCs below).
drop policy if exists workshop_regs_read on public.workshop_registrations;
create policy workshop_regs_read on public.workshop_registrations for select to authenticated
  using (
    public.is_staff()
    or exists (select 1 from public.members m where m.id = workshop_registrations.member_id and m.auth_user_id = auth.uid())
  );
drop policy if exists workshop_regs_staff_write on public.workshop_registrations;
create policy workshop_regs_staff_write on public.workshop_registrations for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Register the current member for a workshop (seat-reserve, unpaid).
create or replace function public.register_workshop(p_workshop uuid)
returns public.workshop_registrations
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid; v_w workshops; v_count int; v_reg workshop_registrations;
begin
  select id into v_member from members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;

  select * into v_w from workshops where id = p_workshop for update;
  if not found or not v_w.active then raise exception 'WORKSHOP_NOT_FOUND'; end if;
  if now() >= v_w.starts_at then raise exception 'WORKSHOP_STARTED'; end if;
  if v_w.registration_opens_at is not null and now() < v_w.registration_opens_at then raise exception 'REGISTRATION_CLOSED'; end if;
  if v_w.registration_closes_at is not null and now() >= v_w.registration_closes_at then raise exception 'REGISTRATION_CLOSED'; end if;

  if exists (select 1 from workshop_registrations
             where workshop_id = p_workshop and member_id = v_member and status = 'registered') then
    raise exception 'ALREADY_REGISTERED';
  end if;

  select count(*) into v_count from workshop_registrations
    where workshop_id = p_workshop and status = 'registered';
  if v_count >= v_w.capacity then raise exception 'WORKSHOP_FULL'; end if;

  insert into workshop_registrations (workshop_id, member_id) values (p_workshop, v_member)
    returning * into v_reg;
  return v_reg;
end; $$;
revoke execute on function public.register_workshop(uuid) from anon;
grant execute on function public.register_workshop(uuid) to authenticated;

-- Cancel the current member's own registration.
create or replace function public.cancel_workshop_registration(p_registration uuid)
returns public.workshop_registrations
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_member uuid; v_reg workshop_registrations;
begin
  select id into v_member from members where auth_user_id = auth.uid();
  if v_member is null then raise exception 'NO_MEMBER'; end if;
  select * into v_reg from workshop_registrations where id = p_registration for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v_reg.member_id <> v_member then raise exception 'FORBIDDEN'; end if;
  if v_reg.status <> 'registered' then return v_reg; end if;
  update workshop_registrations set status = 'cancelled' where id = p_registration returning * into v_reg;
  return v_reg;
end; $$;
revoke execute on function public.cancel_workshop_registration(uuid) from anon;
grant execute on function public.cancel_workshop_registration(uuid) to authenticated;

-- Member-facing listing: active upcoming workshops with seat counts and the
-- caller's own registration. SECURITY DEFINER so seat counts are visible
-- without exposing other members' registration rows.
create or replace function public.list_workshops()
returns table (
  id uuid, title_ar text, title_en text, description_ar text, description_en text,
  starts_at timestamptz, ends_at timestamptz, capacity integer,
  price_net_halalas integer, vat_bps integer, instructor_id uuid, location text, image_url text,
  registered_count bigint, my_registration_id uuid, my_status text
)
language sql stable security definer set search_path = public, pg_temp as $$
  select w.id, w.title_ar, w.title_en, w.description_ar, w.description_en,
         w.starts_at, w.ends_at, w.capacity, w.price_net_halalas, w.vat_bps,
         w.instructor_id, w.location, w.image_url,
         (select count(*) from workshop_registrations r where r.workshop_id = w.id and r.status = 'registered') as registered_count,
         mr.id as my_registration_id, mr.status as my_status
  from workshops w
  left join lateral (
    select r.id, r.status from workshop_registrations r
    join members m on m.id = r.member_id
    where r.workshop_id = w.id and m.auth_user_id = auth.uid() and r.status = 'registered'
    limit 1
  ) mr on true
  where w.active and w.starts_at > now()
  order by w.starts_at;
$$;
grant execute on function public.list_workshops() to authenticated, anon;

notify pgrst, 'reload schema';
