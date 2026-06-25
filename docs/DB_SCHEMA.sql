-- ÉLAN — Database schema dump (public schema)
-- Companion to SYSTEM_DOSSIER.md (tables+columns) and SYSTEM_CODE_APPENDIX.md (RLS + functions).
-- NOTE: there are no migration FILES in the repo — schema was applied directly to Supabase
-- via MCP migrations. This file is generated from the live catalog (enums, constraints,
-- indexes, views). RLS policies + SECURITY DEFINER functions are in SYSTEM_CODE_APPENDIX.md.
--
-- Trigger (on auth schema, not shown by the public-schema dump):
--   CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== ENUMS =====
CREATE TYPE public.admin_role AS ENUM ('owner', 'manager', 'front_desk');
CREATE TYPE public.billing_interval AS ENUM ('weekly', 'monthly', 'quarterly', 'yearly');
CREATE TYPE public.booking_source AS ENUM ('web', 'admin');
CREATE TYPE public.booking_status AS ENUM ('confirmed', 'waitlisted', 'cancelled', 'attended', 'no_show', 'late_cancelled');
CREATE TYPE public.class_instance_status AS ENUM ('scheduled', 'cancelled');
CREATE TYPE public.class_level AS ENUM ('level_1', 'level_1_5', 'level_2');
CREATE TYPE public.consent_channel AS ENUM ('email', 'sms', 'whatsapp', 'push', 'in_app');
CREATE TYPE public.credit_ledger_reason AS ENUM ('purchase', 'booking', 'refund', 'admin', 'penalty');
CREATE TYPE public.membership_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
CREATE TYPE public.notification_channel AS ENUM ('whatsapp', 'in_app');
CREATE TYPE public.notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE public.payment_audience AS ENUM ('payg', 'member');
CREATE TYPE public.payment_status AS ENUM ('initiated', 'paid', 'failed', 'refunded');
CREATE TYPE public.payment_type AS ENUM ('membership', 'credit_pack', 'penalty', 'single_class', 'private_session');
CREATE TYPE public.penalty_kind AS ENUM ('late_cancel', 'no_show');

-- ===== CONSTRAINTS (PK / FK / UNIQUE / CHECK) =====
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_auth_user_id_key UNIQUE (auth_user_id);
ALTER TABLE public.admin_users ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);
ALTER TABLE public.bookings ADD CONSTRAINT bookings_class_instance_id_fkey FOREIGN KEY (class_instance_id) REFERENCES class_instances(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
ALTER TABLE public.class_categories ADD CONSTRAINT class_categories_pkey PRIMARY KEY (id);
ALTER TABLE public.class_instance_trainers ADD CONSTRAINT class_instance_trainers_class_instance_id_fkey FOREIGN KEY (class_instance_id) REFERENCES class_instances(id) ON DELETE CASCADE;
ALTER TABLE public.class_instance_trainers ADD CONSTRAINT class_instance_trainers_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE;
ALTER TABLE public.class_instance_trainers ADD CONSTRAINT class_instance_trainers_pkey PRIMARY KEY (class_instance_id, instructor_id);
ALTER TABLE public.class_instances ADD CONSTRAINT class_instances_capacity_check CHECK (((capacity >= 1) AND (capacity <= 100)));
ALTER TABLE public.class_instances ADD CONSTRAINT class_instances_check CHECK ((ends_at > starts_at));
ALTER TABLE public.class_instances ADD CONSTRAINT class_instances_class_type_id_fkey FOREIGN KEY (class_type_id) REFERENCES class_types(id) ON DELETE RESTRICT;
ALTER TABLE public.class_instances ADD CONSTRAINT class_instances_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL;
ALTER TABLE public.class_instances ADD CONSTRAINT class_instances_pkey PRIMARY KEY (id);
ALTER TABLE public.class_instances ADD CONSTRAINT class_instances_room_id_fkey FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL;
ALTER TABLE public.class_types ADD CONSTRAINT class_types_category_id_fkey FOREIGN KEY (category_id) REFERENCES class_categories(id) ON DELETE SET NULL;
ALTER TABLE public.class_types ADD CONSTRAINT class_types_default_capacity_check CHECK (((default_capacity >= 1) AND (default_capacity <= 100)));
ALTER TABLE public.class_types ADD CONSTRAINT class_types_duration_minutes_check CHECK (((duration_minutes >= 10) AND (duration_minutes <= 240)));
ALTER TABLE public.class_types ADD CONSTRAINT class_types_pkey PRIMARY KEY (id);
ALTER TABLE public.credit_ledger ADD CONSTRAINT credit_ledger_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.credit_ledger ADD CONSTRAINT credit_ledger_pkey PRIMARY KEY (id);
ALTER TABLE public.credit_packs ADD CONSTRAINT credit_packs_credits_check CHECK ((credits > 0));
ALTER TABLE public.credit_packs ADD CONSTRAINT credit_packs_pkey PRIMARY KEY (id);
ALTER TABLE public.credit_packs ADD CONSTRAINT credit_packs_price_sar_check CHECK ((price_sar >= (0)::numeric));
ALTER TABLE public.credit_packs ADD CONSTRAINT credit_packs_valid_days_check CHECK ((valid_days > 0));
ALTER TABLE public.instructors ADD CONSTRAINT instructors_pkey PRIMARY KEY (id);
ALTER TABLE public.linked_accounts ADD CONSTRAINT linked_accounts_linked_member_id_fkey FOREIGN KEY (linked_member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.linked_accounts ADD CONSTRAINT linked_accounts_pkey PRIMARY KEY (id);
ALTER TABLE public.linked_accounts ADD CONSTRAINT linked_accounts_primary_member_id_fkey FOREIGN KEY (primary_member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.linked_accounts ADD CONSTRAINT linked_accounts_primary_member_id_linked_member_id_key UNIQUE (primary_member_id, linked_member_id);
ALTER TABLE public.member_consents ADD CONSTRAINT member_consents_member_id_channel_key UNIQUE (member_id, channel);
ALTER TABLE public.member_consents ADD CONSTRAINT member_consents_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.member_consents ADD CONSTRAINT member_consents_pkey PRIMARY KEY (id);
ALTER TABLE public.member_memberships ADD CONSTRAINT member_memberships_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.member_memberships ADD CONSTRAINT member_memberships_pkey PRIMARY KEY (id);
ALTER TABLE public.member_memberships ADD CONSTRAINT member_memberships_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES membership_plans(id) ON DELETE RESTRICT;
ALTER TABLE public.member_notes ADD CONSTRAINT member_notes_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.member_notes ADD CONSTRAINT member_notes_pkey PRIMARY KEY (id);
ALTER TABLE public.member_tasks ADD CONSTRAINT member_tasks_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.member_tasks ADD CONSTRAINT member_tasks_pkey PRIMARY KEY (id);
ALTER TABLE public.members ADD CONSTRAINT members_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.members ADD CONSTRAINT members_auth_user_id_key UNIQUE (auth_user_id);
ALTER TABLE public.members ADD CONSTRAINT members_locale_check CHECK ((locale = ANY (ARRAY['ar'::text, 'en'::text])));
ALTER TABLE public.members ADD CONSTRAINT members_phone_key UNIQUE (phone);
ALTER TABLE public.members ADD CONSTRAINT members_pkey PRIMARY KEY (id);
ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_classes_per_period_check CHECK ((classes_per_period >= 0));
ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_pkey PRIMARY KEY (id);
ALTER TABLE public.membership_plans ADD CONSTRAINT membership_plans_price_sar_check CHECK ((price_sar >= (0)::numeric));
ALTER TABLE public.notifications ADD CONSTRAINT notifications_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_pkey PRIMARY KEY (id);
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_type_check CHECK ((type = ANY (ARRAY['card'::text, 'mada'::text, 'apple_pay'::text, 'direct_debit'::text])));
ALTER TABLE public.payments ADD CONSTRAINT payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.payments ADD CONSTRAINT payments_moyasar_payment_id_key UNIQUE (moyasar_payment_id);
ALTER TABLE public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE public.penalties ADD CONSTRAINT penalties_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE public.penalties ADD CONSTRAINT penalties_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;
ALTER TABLE public.penalties ADD CONSTRAINT penalties_pkey PRIMARY KEY (id);
ALTER TABLE public.penalty_settings ADD CONSTRAINT penalty_settings_applies_to_check CHECK ((applies_to = ANY (ARRAY['membership'::text, 'payg'::text, 'both'::text])));
ALTER TABLE public.penalty_settings ADD CONSTRAINT penalty_settings_id_check CHECK (id);
ALTER TABLE public.penalty_settings ADD CONSTRAINT penalty_settings_pkey PRIMARY KEY (id);
ALTER TABLE public.pricing_audit ADD CONSTRAINT pricing_audit_pkey PRIMARY KEY (id);
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_code_key UNIQUE (code);
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text])));
ALTER TABLE public.promo_codes ADD CONSTRAINT promo_codes_pkey PRIMARY KEY (id);
ALTER TABLE public.promo_redemptions ADD CONSTRAINT promo_redemptions_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL;
ALTER TABLE public.promo_redemptions ADD CONSTRAINT promo_redemptions_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;
ALTER TABLE public.promo_redemptions ADD CONSTRAINT promo_redemptions_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;
ALTER TABLE public.promo_redemptions ADD CONSTRAINT promo_redemptions_pkey PRIMARY KEY (id);
ALTER TABLE public.promo_redemptions ADD CONSTRAINT promo_redemptions_promo_code_id_fkey FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_capacity_check CHECK (((capacity >= 1) AND (capacity <= 100)));
ALTER TABLE public.rooms ADD CONSTRAINT rooms_pkey PRIMARY KEY (id);
ALTER TABLE public.studio_settings ADD CONSTRAINT studio_settings_id_check CHECK (id);
ALTER TABLE public.studio_settings ADD CONSTRAINT studio_settings_pkey PRIMARY KEY (id);

-- ===== INDEXES =====
CREATE INDEX idx_bookings_instance ON public.bookings USING btree (class_instance_id);
CREATE INDEX idx_bookings_member ON public.bookings USING btree (member_id);
CREATE INDEX idx_class_instances_recurring ON public.class_instances USING btree (recurring_group_id);
CREATE INDEX idx_class_instances_starts_at ON public.class_instances USING btree (starts_at);
CREATE INDEX idx_class_instances_type ON public.class_instances USING btree (class_type_id);
CREATE INDEX idx_credit_ledger_member ON public.credit_ledger USING btree (member_id, created_at);
CREATE INDEX idx_member_memberships_member ON public.member_memberships USING btree (member_id);
CREATE INDEX idx_notifications_member ON public.notifications USING btree (member_id, created_at);
CREATE INDEX idx_payments_member ON public.payments USING btree (member_id);
CREATE INDEX idx_penalties_member ON public.penalties USING btree (member_id);
CREATE INDEX member_notes_member_idx ON public.member_notes USING btree (member_id, created_at DESC);
CREATE INDEX member_tasks_member_idx ON public.member_tasks USING btree (member_id, created_at DESC);
CREATE INDEX member_tasks_open_due_idx ON public.member_tasks USING btree (status, due_date);
CREATE INDEX pricing_audit_entity_idx ON public.pricing_audit USING btree (entity_type, entity_id, created_at DESC);
CREATE INDEX promo_redemptions_code_idx ON public.promo_redemptions USING btree (promo_code_id);
CREATE INDEX promo_redemptions_member_idx ON public.promo_redemptions USING btree (promo_code_id, member_id);
-- prevents double-booking the same class while active:
CREATE UNIQUE INDEX uniq_active_booking ON public.bookings USING btree (class_instance_id, member_id)
  WHERE (status = ANY (ARRAY['confirmed'::booking_status, 'waitlisted'::booking_status]));
-- (PK/UNIQUE backing indexes omitted for brevity — see constraints above.)

-- ===== VIEWS =====
CREATE OR REPLACE VIEW public.class_instance_availability AS
 SELECT ci.id AS class_instance_id,
    ci.capacity,
    ci.booking_opens_at,
    ci.booking_closes_at,
    ((now() >= ci.booking_opens_at) AND (now() < ci.booking_closes_at) AND (ci.status = 'scheduled'::class_instance_status)) AS is_bookable_now,
    (count(*) FILTER (WHERE (b.status = 'confirmed'::booking_status)))::integer AS confirmed_count,
    (GREATEST((ci.capacity - count(*) FILTER (WHERE (b.status = 'confirmed'::booking_status))), (0)::bigint))::integer AS spots_left,
    (count(*) FILTER (WHERE (b.status = 'waitlisted'::booking_status)))::integer AS waitlist_count,
        CASE
            WHEN (ci.status = 'cancelled'::class_instance_status) THEN 'booking_closed'::text
            WHEN ((now() < ci.booking_opens_at) OR (now() >= ci.booking_closes_at)) THEN 'booking_closed'::text
            WHEN (count(*) FILTER (WHERE (b.status = 'confirmed'::booking_status)) < ci.capacity) THEN 'available'::text
            WHEN (count(*) FILTER (WHERE (b.status = 'waitlisted'::booking_status)) < ( SELECT studio_settings.max_waitlist_size
               FROM studio_settings
              WHERE studio_settings.id)) THEN 'waitlist_open'::text
            ELSE 'fully_booked'::text
        END AS display_status
   FROM (class_instances ci
     LEFT JOIN bookings b ON ((b.class_instance_id = ci.id)))
  GROUP BY ci.id;
