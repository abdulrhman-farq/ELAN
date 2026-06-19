export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.5" }
  public: {
    Tables: {
      admin_users: {
        Row: { active: boolean; auth_user_id: string; created_at: string; id: string; name: string; role: Database["public"]["Enums"]["admin_role"] }
        Insert: { active?: boolean; auth_user_id: string; created_at?: string; id?: string; name: string; role?: Database["public"]["Enums"]["admin_role"] }
        Update: { active?: boolean; auth_user_id?: string; created_at?: string; id?: string; name?: string; role?: Database["public"]["Enums"]["admin_role"] }
        Relationships: []
      }
      bookings: {
        Row: { cancelled_at: string | null; class_instance_id: string; created_at: string; credits_used: number; id: string; member_id: string; payment_audience: Database["public"]["Enums"]["payment_audience"]; source: Database["public"]["Enums"]["booking_source"]; status: Database["public"]["Enums"]["booking_status"]; waitlist_position: number | null }
        Insert: { cancelled_at?: string | null; class_instance_id: string; created_at?: string; credits_used?: number; id?: string; member_id: string; payment_audience?: Database["public"]["Enums"]["payment_audience"]; source?: Database["public"]["Enums"]["booking_source"]; status: Database["public"]["Enums"]["booking_status"]; waitlist_position?: number | null }
        Update: { cancelled_at?: string | null; class_instance_id?: string; created_at?: string; credits_used?: number; id?: string; member_id?: string; payment_audience?: Database["public"]["Enums"]["payment_audience"]; source?: Database["public"]["Enums"]["booking_source"]; status?: Database["public"]["Enums"]["booking_status"]; waitlist_position?: number | null }
        Relationships: [
          { foreignKeyName: "bookings_class_instance_id_fkey"; columns: ["class_instance_id"]; isOneToOne: false; referencedRelation: "class_instances"; referencedColumns: ["id"] },
          { foreignKeyName: "bookings_member_id_fkey"; columns: ["member_id"]; isOneToOne: false; referencedRelation: "members"; referencedColumns: ["id"] },
        ]
      }
      class_categories: {
        Row: { id: string; name_ar: string; name_en: string }
        Insert: { id?: string; name_ar: string; name_en: string }
        Update: { id?: string; name_ar?: string; name_en?: string }
        Relationships: []
      }
      class_instance_trainers: {
        Row: { class_instance_id: string; instructor_id: string }
        Insert: { class_instance_id: string; instructor_id: string }
        Update: { class_instance_id?: string; instructor_id?: string }
        Relationships: []
      }
      class_instances: {
        Row: { booking_closes_at: string | null; booking_opens_at: string | null; capacity: number; class_type_id: string; created_at: string; ends_at: string; id: string; instructor_id: string | null; is_online: boolean; level: Database["public"]["Enums"]["class_level"]; recurring_group_id: string | null; room: string | null; room_id: string | null; starts_at: string; status: Database["public"]["Enums"]["class_instance_status"] }
        Insert: { booking_closes_at?: string | null; booking_opens_at?: string | null; capacity: number; class_type_id: string; created_at?: string; ends_at: string; id?: string; instructor_id?: string | null; is_online?: boolean; level: Database["public"]["Enums"]["class_level"]; recurring_group_id?: string | null; room?: string | null; room_id?: string | null; starts_at: string; status?: Database["public"]["Enums"]["class_instance_status"] }
        Update: { booking_closes_at?: string | null; booking_opens_at?: string | null; capacity?: number; class_type_id?: string; created_at?: string; ends_at?: string; id?: string; instructor_id?: string | null; is_online?: boolean; level?: Database["public"]["Enums"]["class_level"]; recurring_group_id?: string | null; room?: string | null; room_id?: string | null; starts_at?: string; status?: Database["public"]["Enums"]["class_instance_status"] }
        Relationships: [
          { foreignKeyName: "class_instances_class_type_id_fkey"; columns: ["class_type_id"]; isOneToOne: false; referencedRelation: "class_types"; referencedColumns: ["id"] },
          { foreignKeyName: "class_instances_instructor_id_fkey"; columns: ["instructor_id"]; isOneToOne: false; referencedRelation: "instructors"; referencedColumns: ["id"] },
          { foreignKeyName: "class_instances_room_id_fkey"; columns: ["room_id"]; isOneToOne: false; referencedRelation: "rooms"; referencedColumns: ["id"] },
        ]
      }
      class_types: {
        Row: { category_id: string | null; created_at: string; default_capacity: number; default_level: Database["public"]["Enums"]["class_level"]; description_ar: string | null; description_en: string | null; duration_minutes: number; id: string; image_url: string | null; is_online: boolean; name_ar: string; name_en: string; pricing: Json }
        Insert: { category_id?: string | null; created_at?: string; default_capacity: number; default_level?: Database["public"]["Enums"]["class_level"]; description_ar?: string | null; description_en?: string | null; duration_minutes: number; id?: string; image_url?: string | null; is_online?: boolean; name_ar: string; name_en: string; pricing?: Json }
        Update: { category_id?: string | null; created_at?: string; default_capacity?: number; default_level?: Database["public"]["Enums"]["class_level"]; description_ar?: string | null; description_en?: string | null; duration_minutes?: number; id?: string; image_url?: string | null; is_online?: boolean; name_ar?: string; name_en?: string; pricing?: Json }
        Relationships: []
      }
      credit_ledger: {
        Row: { balance_after: number; change: number; created_at: string; id: string; member_id: string; reason: Database["public"]["Enums"]["credit_ledger_reason"]; ref_id: string | null }
        Insert: { balance_after: number; change: number; created_at?: string; id?: string; member_id: string; reason: Database["public"]["Enums"]["credit_ledger_reason"]; ref_id?: string | null }
        Update: { balance_after?: number; change?: number; created_at?: string; id?: string; member_id?: string; reason?: Database["public"]["Enums"]["credit_ledger_reason"]; ref_id?: string | null }
        Relationships: []
      }
      credit_packs: {
        Row: { active: boolean; created_at: string; credits: number; id: string; name_ar: string; name_en: string; price_sar: number; valid_days: number }
        Insert: { active?: boolean; created_at?: string; credits: number; id?: string; name_ar: string; name_en: string; price_sar: number; valid_days: number }
        Update: { active?: boolean; created_at?: string; credits?: number; id?: string; name_ar?: string; name_en?: string; price_sar?: number; valid_days?: number }
        Relationships: []
      }
      instructors: {
        Row: { active: boolean; bio_ar: string | null; bio_en: string | null; created_at: string; first_name: string | null; id: string; last_name: string | null; name_ar: string; name_en: string; photo_url: string | null }
        Insert: { active?: boolean; bio_ar?: string | null; bio_en?: string | null; created_at?: string; first_name?: string | null; id?: string; last_name?: string | null; name_ar: string; name_en: string; photo_url?: string | null }
        Update: { active?: boolean; bio_ar?: string | null; bio_en?: string | null; created_at?: string; first_name?: string | null; id?: string; last_name?: string | null; name_ar?: string; name_en?: string; photo_url?: string | null }
        Relationships: []
      }
      linked_accounts: {
        Row: { created_at: string; id: string; linked_member_id: string; primary_member_id: string; relationship: string | null }
        Insert: { created_at?: string; id?: string; linked_member_id: string; primary_member_id: string; relationship?: string | null }
        Update: { created_at?: string; id?: string; linked_member_id?: string; primary_member_id?: string; relationship?: string | null }
        Relationships: []
      }
      member_consents: {
        Row: { active: boolean; channel: Database["public"]["Enums"]["consent_channel"]; id: string; member_id: string; modified_at: string; modified_by: string | null }
        Insert: { active?: boolean; channel: Database["public"]["Enums"]["consent_channel"]; id?: string; member_id: string; modified_at?: string; modified_by?: string | null }
        Update: { active?: boolean; channel?: Database["public"]["Enums"]["consent_channel"]; id?: string; member_id?: string; modified_at?: string; modified_by?: string | null }
        Relationships: []
      }
      member_memberships: {
        Row: { allowed_actions: Json; cancellation_reason: string | null; created_at: string; current_period_end: string; current_period_start: string; id: string; is_payg: boolean; is_subscription: boolean; member_id: string; next_payment_date: string | null; pause: Json | null; plan_id: string; started_at: string; status: Database["public"]["Enums"]["membership_status"] }
        Insert: { allowed_actions?: Json; cancellation_reason?: string | null; created_at?: string; current_period_end: string; current_period_start?: string; id?: string; is_payg?: boolean; is_subscription?: boolean; member_id: string; next_payment_date?: string | null; pause?: Json | null; plan_id: string; started_at?: string; status?: Database["public"]["Enums"]["membership_status"] }
        Update: { allowed_actions?: Json; cancellation_reason?: string | null; created_at?: string; current_period_end?: string; current_period_start?: string; id?: string; is_payg?: boolean; is_subscription?: boolean; member_id?: string; next_payment_date?: string | null; pause?: Json | null; plan_id?: string; started_at?: string; status?: Database["public"]["Enums"]["membership_status"] }
        Relationships: [
          { foreignKeyName: "member_memberships_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "membership_plans"; referencedColumns: ["id"] },
        ]
      }
      members: {
        Row: { auth_user_id: string | null; avatar_url: string | null; birth: string | null; created_at: string; email: string | null; first_name: string | null; full_name: string; gender: string | null; id: string; last_name: string | null; lead_status: string | null; level: Database["public"]["Enums"]["class_level"]; locale: string; modified: string; phone: string | null; role: string; source: string | null; waiver_accepted: boolean }
        Insert: { auth_user_id?: string | null; avatar_url?: string | null; birth?: string | null; created_at?: string; email?: string | null; first_name?: string | null; full_name: string; gender?: string | null; id?: string; last_name?: string | null; lead_status?: string | null; level?: Database["public"]["Enums"]["class_level"]; locale?: string; modified?: string; phone?: string | null; role?: string; source?: string | null; waiver_accepted?: boolean }
        Update: { auth_user_id?: string | null; avatar_url?: string | null; birth?: string | null; created_at?: string; email?: string | null; first_name?: string | null; full_name?: string; gender?: string | null; id?: string; last_name?: string | null; lead_status?: string | null; level?: Database["public"]["Enums"]["class_level"]; locale?: string; modified?: string; phone?: string | null; role?: string; source?: string | null; waiver_accepted?: boolean }
        Relationships: []
      }
      membership_plans: {
        Row: { active: boolean; billing_interval: Database["public"]["Enums"]["billing_interval"]; classes_per_period: number; created_at: string; description_ar: string | null; description_en: string | null; id: string; is_payg: boolean; is_subscription: boolean; name_ar: string; name_en: string; price_sar: number }
        Insert: { active?: boolean; billing_interval: Database["public"]["Enums"]["billing_interval"]; classes_per_period: number; created_at?: string; description_ar?: string | null; description_en?: string | null; id?: string; is_payg?: boolean; is_subscription?: boolean; name_ar: string; name_en: string; price_sar: number }
        Update: { active?: boolean; billing_interval?: Database["public"]["Enums"]["billing_interval"]; classes_per_period?: number; created_at?: string; description_ar?: string | null; description_en?: string | null; id?: string; is_payg?: boolean; is_subscription?: boolean; name_ar?: string; name_en?: string; price_sar?: number }
        Relationships: []
      }
      notifications: {
        Row: { channel: Database["public"]["Enums"]["notification_channel"]; created_at: string; id: string; member_id: string; payload: Json; sent_at: string | null; status: Database["public"]["Enums"]["notification_status"]; template: string }
        Insert: { channel: Database["public"]["Enums"]["notification_channel"]; created_at?: string; id?: string; member_id: string; payload?: Json; sent_at?: string | null; status?: Database["public"]["Enums"]["notification_status"]; template: string }
        Update: { channel?: Database["public"]["Enums"]["notification_channel"]; created_at?: string; id?: string; member_id?: string; payload?: Json; sent_at?: string | null; status?: Database["public"]["Enums"]["notification_status"]; template?: string }
        Relationships: []
      }
      payment_methods: {
        Row: { brand: string | null; created_at: string; id: string; is_default: boolean; last4: string | null; member_id: string; moyasar_token: string | null; type: string }
        Insert: { brand?: string | null; created_at?: string; id?: string; is_default?: boolean; last4?: string | null; member_id: string; moyasar_token?: string | null; type: string }
        Update: { brand?: string | null; created_at?: string; id?: string; is_default?: boolean; last4?: string | null; member_id?: string; moyasar_token?: string | null; type?: string }
        Relationships: []
      }
      payments: {
        Row: { amount_sar: number; created_at: string; currency: string; id: string; member_id: string; moyasar_payment_id: string | null; ref_id: string | null; sales_tax_sar: number; status: Database["public"]["Enums"]["payment_status"]; type: Database["public"]["Enums"]["payment_type"] }
        Insert: { amount_sar: number; created_at?: string; currency?: string; id?: string; member_id: string; moyasar_payment_id?: string | null; ref_id?: string | null; sales_tax_sar?: number; status?: Database["public"]["Enums"]["payment_status"]; type: Database["public"]["Enums"]["payment_type"] }
        Update: { amount_sar?: number; created_at?: string; currency?: string; id?: string; member_id?: string; moyasar_payment_id?: string | null; ref_id?: string | null; sales_tax_sar?: number; status?: Database["public"]["Enums"]["payment_status"]; type?: Database["public"]["Enums"]["payment_type"] }
        Relationships: []
      }
      penalties: {
        Row: { amount_credits: number; amount_sar: number; booking_id: string | null; created_at: string; id: string; kind: Database["public"]["Enums"]["penalty_kind"]; member_id: string; settled: boolean }
        Insert: { amount_credits?: number; amount_sar?: number; booking_id?: string | null; created_at?: string; id?: string; kind: Database["public"]["Enums"]["penalty_kind"]; member_id: string; settled?: boolean }
        Update: { amount_credits?: number; amount_sar?: number; booking_id?: string | null; created_at?: string; id?: string; kind?: Database["public"]["Enums"]["penalty_kind"]; member_id?: string; settled?: boolean }
        Relationships: []
      }
      penalty_settings: {
        Row: { active: boolean; applies_to: string; id: boolean; late_cancel_fee_credits: number; late_cancel_fee_sar: number; late_cancel_window_hours: number; no_show_fee_credits: number; no_show_fee_sar: number }
        Insert: { active?: boolean; applies_to?: string; id?: boolean; late_cancel_fee_credits?: number; late_cancel_fee_sar?: number; late_cancel_window_hours?: number; no_show_fee_credits?: number; no_show_fee_sar?: number }
        Update: { active?: boolean; applies_to?: string; id?: boolean; late_cancel_fee_credits?: number; late_cancel_fee_sar?: number; late_cancel_window_hours?: number; no_show_fee_credits?: number; no_show_fee_sar?: number }
        Relationships: []
      }
      rooms: {
        Row: { active: boolean; capacity: number; created_at: string; id: string; image_url: string | null; name_ar: string; name_en: string; room_map_image_url: string | null }
        Insert: { active?: boolean; capacity: number; created_at?: string; id?: string; image_url?: string | null; name_ar: string; name_en: string; room_map_image_url?: string | null }
        Update: { active?: boolean; capacity?: number; created_at?: string; id?: string; image_url?: string | null; name_ar?: string; name_en?: string; room_map_image_url?: string | null }
        Relationships: []
      }
      studio_settings: {
        Row: { about_ar: string | null; about_en: string | null; address: string | null; booking_open_window_hours: number; business_hours_close: string; business_hours_open: string; cancellation_window_hours: number; currency: string; email: string | null; id: boolean; max_waitlist_size: number; name_ar: string; name_en: string; opening_times: Json; phone: string | null; sales_tax_pct: number; social: Json; timezone: string; updated_at: string; website: string | null }
        Insert: { about_ar?: string | null; about_en?: string | null; address?: string | null; booking_open_window_hours?: number; business_hours_close?: string; business_hours_open?: string; cancellation_window_hours?: number; currency?: string; email?: string | null; id?: boolean; max_waitlist_size?: number; name_ar?: string; name_en?: string; opening_times?: Json; phone?: string | null; sales_tax_pct?: number; social?: Json; timezone?: string; updated_at?: string; website?: string | null }
        Update: { about_ar?: string | null; about_en?: string | null; address?: string | null; booking_open_window_hours?: number; business_hours_close?: string; business_hours_open?: string; cancellation_window_hours?: number; currency?: string; email?: string | null; id?: boolean; max_waitlist_size?: number; name_ar?: string; name_en?: string; opening_times?: Json; phone?: string | null; sales_tax_pct?: number; social?: Json; timezone?: string; updated_at?: string; website?: string | null }
        Relationships: []
      }
    }
    Views: {
      class_instance_availability: {
        Row: { booking_closes_at: string | null; booking_opens_at: string | null; capacity: number | null; class_instance_id: string | null; confirmed_count: number | null; display_status: string | null; is_bookable_now: boolean | null; spots_left: number | null; waitlist_count: number | null }
        Relationships: []
      }
    }
    Functions: {
      book_class_self: {
        Args: { p_class_instance_id: string; p_source?: Database["public"]["Enums"]["booking_source"] }
        Returns: { cancelled_at: string | null; class_instance_id: string; created_at: string; credits_used: number; id: string; member_id: string; payment_audience: Database["public"]["Enums"]["payment_audience"]; source: Database["public"]["Enums"]["booking_source"]; status: Database["public"]["Enums"]["booking_status"]; waitlist_position: number | null }
        SetofOptions: { from: "*"; to: "bookings"; isOneToOne: true; isSetofReturn: false }
      }
      booking_eligibility_self: { Args: { p_class_instance_id: string }; Returns: string }
      cancel_booking_self: {
        Args: { p_booking_id: string }
        Returns: { cancelled_at: string | null; class_instance_id: string; created_at: string; credits_used: number; id: string; member_id: string; payment_audience: Database["public"]["Enums"]["payment_audience"]; source: Database["public"]["Enums"]["booking_source"]; status: Database["public"]["Enums"]["booking_status"]; waitlist_position: number | null }
        SetofOptions: { from: "*"; to: "bookings"; isOneToOne: true; isSetofReturn: false }
      }
      current_member_id: { Args: Record<string, never>; Returns: string }
      elan_credit_balance: { Args: { p_member: string }; Returns: number }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      mark_no_show: {
        Args: { p_booking_id: string }
        Returns: { cancelled_at: string | null; class_instance_id: string; created_at: string; credits_used: number; id: string; member_id: string; payment_audience: Database["public"]["Enums"]["payment_audience"]; source: Database["public"]["Enums"]["booking_source"]; status: Database["public"]["Enums"]["booking_status"]; waitlist_position: number | null }
        SetofOptions: { from: "*"; to: "bookings"; isOneToOne: true; isSetofReturn: false }
      }
      simulate_purchase: {
        Args: { p_ref_id: string; p_type: Database["public"]["Enums"]["payment_type"] }
        Returns: { amount_sar: number; created_at: string; currency: string; id: string; member_id: string; moyasar_payment_id: string | null; ref_id: string | null; sales_tax_sar: number; status: Database["public"]["Enums"]["payment_status"]; type: Database["public"]["Enums"]["payment_type"] }
        SetofOptions: { from: "*"; to: "payments"; isOneToOne: true; isSetofReturn: false }
      }
    }
    Enums: {
      admin_role: "owner" | "manager" | "front_desk"
      billing_interval: "weekly" | "monthly" | "quarterly" | "yearly"
      booking_source: "web" | "admin"
      booking_status: "confirmed" | "waitlisted" | "cancelled" | "attended" | "no_show" | "late_cancelled"
      class_instance_status: "scheduled" | "cancelled"
      class_level: "level_1" | "level_1_5" | "level_2"
      consent_channel: "email" | "sms" | "whatsapp" | "push" | "in_app"
      credit_ledger_reason: "purchase" | "booking" | "refund" | "admin" | "penalty"
      membership_status: "active" | "paused" | "cancelled" | "expired"
      notification_channel: "whatsapp" | "in_app"
      notification_status: "pending" | "sent" | "failed"
      payment_audience: "payg" | "member"
      payment_status: "initiated" | "paid" | "failed" | "refunded"
      payment_type: "membership" | "credit_pack" | "penalty"
      penalty_kind: "late_cancel" | "no_show"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
