-- ÉLAN baseline schema (captured from the live Supabase DB, 2026-06-25).
-- For provisioning a FRESH project. The production DB is already provisioned;
-- enums/tables use guards/IF NOT EXISTS, constraints/indexes assume fresh setup.
-- Idempotent hardening lives in 0003_security_financial_hardening.sql.

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


-- ===== TABLES =====
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  name text NOT NULL,
  role admin_role NOT NULL DEFAULT 'front_desk'::admin_role,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_instance_id uuid NOT NULL,
  member_id uuid NOT NULL,
  status booking_status NOT NULL,
  waitlist_position integer,
  source booking_source NOT NULL DEFAULT 'web'::booking_source,
  credits_used integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  payment_audience payment_audience NOT NULL DEFAULT 'payg'::payment_audience,
  cancelled_at timestamp with time zone,
  base_net_halalas integer,
  discount_type text NOT NULL DEFAULT 'none'::text,
  discount_value integer NOT NULL DEFAULT 0,
  discount_amount_halalas integer NOT NULL DEFAULT 0,
  final_net_halalas integer,
  vat_bps integer NOT NULL DEFAULT 1500,
  vat_amount_halalas integer NOT NULL DEFAULT 0,
  final_gross_halalas integer,
  currency text NOT NULL DEFAULT 'SAR'::text,
  pricing_source text NOT NULL DEFAULT 'single'::text,
  list_value_halalas integer,
  effective_paid_halalas integer,
  discount_reason text,
  promo_code_id uuid
);

CREATE TABLE IF NOT EXISTS public.class_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.class_instance_trainers (
  class_instance_id uuid NOT NULL,
  instructor_id uuid NOT NULL
);

CREATE TABLE IF NOT EXISTS public.class_instances (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_type_id uuid NOT NULL,
  instructor_id uuid,
  starts_at timestamp with time zone NOT NULL,
  ends_at timestamp with time zone NOT NULL,
  capacity integer NOT NULL,
  level class_level NOT NULL,
  room text,
  status class_instance_status NOT NULL DEFAULT 'scheduled'::class_instance_status,
  recurring_group_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  room_id uuid,
  is_online boolean NOT NULL DEFAULT false,
  booking_opens_at timestamp with time zone,
  booking_closes_at timestamp with time zone
);

CREATE TABLE IF NOT EXISTS public.class_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  default_level class_level NOT NULL DEFAULT 'level_1'::class_level,
  duration_minutes integer NOT NULL,
  image_url text,
  default_capacity integer NOT NULL DEFAULT 6,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  category_id uuid,
  is_online boolean NOT NULL DEFAULT false,
  pricing jsonb NOT NULL DEFAULT '[]'::jsonb,
  base_net_halalas integer NOT NULL DEFAULT 15000,
  vat_bps integer NOT NULL DEFAULT 1500
);

CREATE TABLE IF NOT EXISTS public.credit_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  change integer NOT NULL,
  reason credit_ledger_reason NOT NULL,
  balance_after integer NOT NULL,
  ref_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.credit_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price_sar numeric(10,2) NOT NULL,
  credits integer NOT NULL,
  valid_days integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instructors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  photo_url text,
  bio_ar text,
  bio_en text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text,
  last_name text
);

CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  primary_member_id uuid NOT NULL,
  linked_member_id uuid NOT NULL,
  relationship text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  channel consent_channel NOT NULL,
  active boolean NOT NULL DEFAULT true,
  modified_at timestamp with time zone NOT NULL DEFAULT now(),
  modified_by uuid
);

CREATE TABLE IF NOT EXISTS public.member_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status membership_status NOT NULL DEFAULT 'active'::membership_status,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  current_period_start timestamp with time zone NOT NULL DEFAULT now(),
  current_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_subscription boolean NOT NULL DEFAULT true,
  is_payg boolean NOT NULL DEFAULT false,
  next_payment_date timestamp with time zone,
  allowed_actions jsonb NOT NULL DEFAULT '["pause", "cancel", "plan_change"]'::jsonb,
  pause jsonb,
  cancellation_reason text
);

CREATE TABLE IF NOT EXISTS public.member_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  body text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  title text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'open'::text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  full_name text NOT NULL,
  phone text,
  email text,
  avatar_url text,
  locale text NOT NULL DEFAULT 'ar'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  first_name text,
  last_name text,
  gender text,
  birth date,
  role text NOT NULL DEFAULT 'member'::text,
  level class_level NOT NULL DEFAULT 'level_1'::class_level,
  waiver_accepted boolean NOT NULL DEFAULT false,
  lead_status text,
  source text,
  modified timestamp with time zone NOT NULL DEFAULT now(),
  recommended_class text
);

CREATE TABLE IF NOT EXISTS public.membership_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price_sar numeric(10,2) NOT NULL,
  billing_interval billing_interval NOT NULL,
  classes_per_period integer NOT NULL,
  description_ar text,
  description_en text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_subscription boolean NOT NULL DEFAULT true,
  is_payg boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  channel notification_channel NOT NULL,
  template text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status notification_status NOT NULL DEFAULT 'pending'::notification_status,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  type text NOT NULL,
  brand text,
  last4 text,
  is_default boolean NOT NULL DEFAULT false,
  moyasar_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  amount_sar numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'SAR'::text,
  moyasar_payment_id text,
  status payment_status NOT NULL DEFAULT 'initiated'::payment_status,
  type payment_type NOT NULL,
  ref_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  sales_tax_sar numeric(10,2) NOT NULL DEFAULT 0,
  base_net_halalas integer,
  discount_type text NOT NULL DEFAULT 'none'::text,
  discount_value integer NOT NULL DEFAULT 0,
  discount_amount_halalas integer NOT NULL DEFAULT 0,
  net_halalas integer,
  vat_amount_halalas integer,
  gross_halalas integer,
  promo_code_id uuid,
  method text,
  starts_at timestamp with time zone,
  credits integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.penalties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL,
  booking_id uuid,
  kind penalty_kind NOT NULL,
  amount_credits integer NOT NULL DEFAULT 0,
  amount_sar numeric(10,2) NOT NULL DEFAULT 0,
  settled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.penalty_settings (
  id boolean NOT NULL DEFAULT true,
  late_cancel_window_hours integer NOT NULL DEFAULT 12,
  late_cancel_fee_credits integer NOT NULL DEFAULT 1,
  late_cancel_fee_sar numeric(10,2) NOT NULL DEFAULT 0,
  no_show_fee_credits integer NOT NULL DEFAULT 1,
  no_show_fee_sar numeric(10,2) NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'both'::text,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.pricing_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  field text,
  old_value text,
  new_value text,
  reason text,
  actor_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  discount_type text NOT NULL,
  discount_value integer NOT NULL,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  max_redemptions integer,
  per_member_limit integer,
  active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promo_redemptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL,
  member_id uuid,
  booking_id uuid,
  payment_id uuid,
  discount_amount_halalas integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  capacity integer NOT NULL,
  image_url text,
  room_map_image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.studio_settings (
  id boolean NOT NULL DEFAULT true,
  name_ar text NOT NULL DEFAULT 'إيلان'::text,
  name_en text NOT NULL DEFAULT 'ELAN'::text,
  cancellation_window_hours integer NOT NULL DEFAULT 12,
  max_waitlist_size integer NOT NULL DEFAULT 10,
  booking_open_window_hours integer NOT NULL DEFAULT 168,
  business_hours_open text NOT NULL DEFAULT '06:00'::text,
  business_hours_close text NOT NULL DEFAULT '22:00'::text,
  timezone text NOT NULL DEFAULT 'Asia/Riyadh'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  about_ar text,
  about_en text,
  address text,
  email text,
  phone text,
  website text,
  social jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency text NOT NULL DEFAULT 'SAR'::text,
  sales_tax_pct numeric(5,2) NOT NULL DEFAULT 15.00,
  opening_times jsonb NOT NULL DEFAULT '{}'::jsonb
);

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

-- ── Auth helper functions ───────────────────────────────────────────────────
-- Defined here (after the tables they read) so the RLS policies in
-- 0002_rls_policies.sql can reference them on a fresh `supabase db reset`.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp
as $$ select exists (select 1 from admin_users where auth_user_id = auth.uid() and active); $$;

create or replace function public.current_member_id()
returns uuid language sql stable security definer set search_path = public, pg_temp
as $$ select id from members where auth_user_id = auth.uid(); $$;
