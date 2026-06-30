-- Launch readiness: ensure studio_settings singleton exists and admins can update it.

insert into public.studio_settings (id, name_ar, name_en, phone, email, address)
values (
  true,
  'ÉLAN — استوديو بيلاتس للسيدات',
  'ÉLAN — Women''s Pilates Studio',
  '+966 11 234 5678',
  'hello@elan.sa',
  'الرياض، المملكة العربية السعودية'
)
on conflict (id) do nothing;

drop policy if exists studio_settings_admin_write on public.studio_settings;
create policy studio_settings_admin_write on public.studio_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
