-- ÉLAN Row-Level Security — idempotent (safe to re-apply to the live DB).
-- Identity is auth_user_id = auth.uid() (set by handle_new_user) or is_admin().

alter table public.admin_users          enable row level security;
alter table public.members              enable row level security;
alter table public.bookings             enable row level security;
alter table public.credit_ledger        enable row level security;
alter table public.payments             enable row level security;
alter table public.member_memberships   enable row level security;
alter table public.member_consents      enable row level security;
alter table public.member_notes         enable row level security;
alter table public.member_tasks         enable row level security;
alter table public.notifications        enable row level security;
alter table public.payment_methods      enable row level security;
alter table public.penalties            enable row level security;
alter table public.linked_accounts      enable row level security;
alter table public.class_instances      enable row level security;
alter table public.class_types          enable row level security;
alter table public.class_categories     enable row level security;
alter table public.class_instance_trainers enable row level security;
alter table public.instructors          enable row level security;
alter table public.rooms                enable row level security;
alter table public.credit_packs         enable row level security;
alter table public.membership_plans     enable row level security;
alter table public.promo_codes          enable row level security;
alter table public.promo_redemptions    enable row level security;
alter table public.pricing_audit        enable row level security;
alter table public.penalty_settings     enable row level security;
alter table public.studio_settings      enable row level security;

-- Public (read-only) catalogue
drop policy if exists class_types_read on public.class_types;
create policy class_types_read on public.class_types for select to public using (true);
drop policy if exists class_categories_read on public.class_categories;
create policy class_categories_read on public.class_categories for select to public using (true);
drop policy if exists class_instances_read on public.class_instances;
create policy class_instances_read on public.class_instances for select to public using (true);
drop policy if exists class_instance_trainers_read on public.class_instance_trainers;
create policy class_instance_trainers_read on public.class_instance_trainers for select to public using (true);
drop policy if exists instructors_read on public.instructors;
create policy instructors_read on public.instructors for select to public using (true);
drop policy if exists rooms_read on public.rooms;
create policy rooms_read on public.rooms for select to public using (true);
drop policy if exists penalty_settings_read on public.penalty_settings;
create policy penalty_settings_read on public.penalty_settings for select to public using (true);
drop policy if exists studio_settings_read on public.studio_settings;
create policy studio_settings_read on public.studio_settings for select to public using (true);
drop policy if exists credit_packs_read on public.credit_packs;
create policy credit_packs_read on public.credit_packs for select to public using (active or public.is_admin());
drop policy if exists membership_plans_read on public.membership_plans;
create policy membership_plans_read on public.membership_plans for select to public using (active or public.is_admin());

-- Member-scoped reads
drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists credit_ledger_select_own on public.credit_ledger;
create policy credit_ledger_select_own on public.credit_ledger for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists member_memberships_select_own on public.member_memberships;
create policy member_memberships_select_own on public.member_memberships for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists member_consents_own on public.member_consents;
create policy member_consents_own on public.member_consents for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists payment_methods_own on public.payment_methods;
create policy payment_methods_own on public.payment_methods for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists penalties_own on public.penalties;
create policy penalties_own on public.penalties for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists payments_select_own on public.payments;
create policy payments_select_own on public.payments for select to public using ((member_id = public.current_member_id()) or public.is_admin());
drop policy if exists linked_accounts_own on public.linked_accounts;
create policy linked_accounts_own on public.linked_accounts for select to public using ((primary_member_id = public.current_member_id()) or (linked_member_id = public.current_member_id()) or public.is_admin());

-- members (self by auth_user_id, admin full)
drop policy if exists members_select_own on public.members;
create policy members_select_own on public.members for select to public using ((auth_user_id = auth.uid()) or public.is_admin());
drop policy if exists members_update_own on public.members;
create policy members_update_own on public.members for update to public using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
drop policy if exists members_admin_select on public.members;
create policy members_admin_select on public.members for select to authenticated using (public.is_admin());
drop policy if exists members_admin_insert on public.members;
create policy members_admin_insert on public.members for insert to authenticated with check (public.is_admin());
drop policy if exists members_admin_update on public.members;
create policy members_admin_update on public.members for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- admin_users (self read only)
drop policy if exists admin_select_own on public.admin_users;
create policy admin_select_own on public.admin_users for select to public using (auth_user_id = auth.uid());

-- Admin-only write surfaces
drop policy if exists bookings_admin_write on public.bookings;
create policy bookings_admin_write on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists payments_admin_write on public.payments;
create policy payments_admin_write on public.payments for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists credit_ledger_admin_write on public.credit_ledger;
create policy credit_ledger_admin_write on public.credit_ledger for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists class_instances_admin_write on public.class_instances;
create policy class_instances_admin_write on public.class_instances for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists member_notes_admin_all on public.member_notes;
create policy member_notes_admin_all on public.member_notes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists member_tasks_admin_all on public.member_tasks;
create policy member_tasks_admin_all on public.member_tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists promo_codes_admin_all on public.promo_codes;
create policy promo_codes_admin_all on public.promo_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists promo_redemptions_admin_all on public.promo_redemptions;
create policy promo_redemptions_admin_all on public.promo_redemptions for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists pricing_audit_admin_all on public.pricing_audit;
create policy pricing_audit_admin_all on public.pricing_audit for all to authenticated using (public.is_admin()) with check (public.is_admin());
