# ÉLAN — Code & SQL Appendix (for external review)

Companion to `SYSTEM_DOSSIER.md`. Contains the actual RLS policy SQL, the key
SECURITY DEFINER function bodies, and four core application files verbatim.

> **Correction to the dossier:** `members_admin_insert` is `WITH CHECK (is_admin())`
> (properly gated) — the earlier "permissive INSERT" note was a false alarm caused
> by reading only the `USING` clause.

---

## 1. RLS policies (reconstructed `CREATE POLICY` SQL)

```sql
CREATE POLICY admin_select_own ON public.admin_users FOR SELECT TO public
  USING ((auth_user_id = auth.uid()));
CREATE POLICY bookings_admin_select ON public.bookings FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY bookings_admin_write ON public.bookings FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY bookings_select_own ON public.bookings FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY class_categories_read ON public.class_categories FOR SELECT TO public
  USING (true);
CREATE POLICY class_instance_trainers_read ON public.class_instance_trainers FOR SELECT TO public
  USING (true);
CREATE POLICY class_instances_admin_write ON public.class_instances FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY class_instances_read ON public.class_instances FOR SELECT TO public
  USING (true);
CREATE POLICY class_types_read ON public.class_types FOR SELECT TO public
  USING (true);
CREATE POLICY credit_ledger_admin_write ON public.credit_ledger FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY credit_ledger_select_own ON public.credit_ledger FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY credit_packs_read ON public.credit_packs FOR SELECT TO public
  USING ((active OR is_admin()));
CREATE POLICY instructors_read ON public.instructors FOR SELECT TO public
  USING (true);
CREATE POLICY linked_accounts_own ON public.linked_accounts FOR SELECT TO public
  USING (((primary_member_id = current_member_id()) OR (linked_member_id = current_member_id()) OR is_admin()));
CREATE POLICY member_consents_own ON public.member_consents FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY member_memberships_admin_select ON public.member_memberships FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY member_memberships_select_own ON public.member_memberships FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY member_notes_admin_all ON public.member_notes FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY member_tasks_admin_all ON public.member_tasks FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY members_admin_insert ON public.members FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY members_admin_select ON public.members FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY members_admin_update ON public.members FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY members_select_own ON public.members FOR SELECT TO public
  USING (((auth_user_id = auth.uid()) OR is_admin()));
CREATE POLICY members_self_email_select ON public.members FOR SELECT TO authenticated
  USING ((lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))));
CREATE POLICY members_self_email_update ON public.members FOR UPDATE TO authenticated
  USING ((lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))))
  WITH CHECK ((lower(email) = lower(COALESCE((auth.jwt() ->> 'email'::text), ''::text))));
CREATE POLICY members_update_own ON public.members FOR UPDATE TO public
  USING ((auth_user_id = auth.uid()));
CREATE POLICY membership_plans_read ON public.membership_plans FOR SELECT TO public
  USING ((active OR is_admin()));
CREATE POLICY notifications_select_own ON public.notifications FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY payment_methods_own ON public.payment_methods FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY payments_admin_select ON public.payments FOR SELECT TO authenticated
  USING (is_admin());
CREATE POLICY payments_admin_write ON public.payments FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY payments_select_own ON public.payments FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY penalties_own ON public.penalties FOR SELECT TO public
  USING (((member_id = current_member_id()) OR is_admin()));
CREATE POLICY penalty_settings_read ON public.penalty_settings FOR SELECT TO public
  USING (true);
CREATE POLICY pricing_audit_admin_all ON public.pricing_audit FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY promo_codes_admin_all ON public.promo_codes FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY promo_redemptions_admin_all ON public.promo_redemptions FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY rooms_read ON public.rooms FOR SELECT TO public
  USING (true);
CREATE POLICY studio_settings_read ON public.studio_settings FOR SELECT TO public
  USING (true);
```

> Note: `bookings_select_own`, `credit_ledger_select_own`, etc. target role `public`
> but reference `current_member_id()`/`auth.uid()`, so anon effectively matches nothing.
> The booking/payment/ledger WRITE paths are all `is_admin()` ALL or via SECURITY
> DEFINER RPCs (members never insert bookings directly — they call `book_class_self`).

---

## 2. SECURITY DEFINER function bodies

### book_class(p_member, p_class_instance_id, p_source)
```sql
CREATE OR REPLACE FUNCTION public.book_class(p_member uuid, p_class_instance_id uuid, p_source booking_source DEFAULT 'web'::booking_source)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_inst class_instances;
  v_confirmed int; v_spots int; v_max_wait int; v_wait_count int; v_next_pos int;
  v_audience payment_audience; v_credits int := 0;
  v_booking bookings;
begin
  select * into v_inst from class_instances where id = p_class_instance_id for update;
  if not found then raise exception 'CLASS_NOT_FOUND'; end if;
  if v_inst.status <> 'scheduled'
     or now() < v_inst.booking_opens_at or now() >= v_inst.booking_closes_at then
    raise exception 'BOOKING_CLOSED';
  end if;
  if exists (select 1 from bookings where class_instance_id = p_class_instance_id
             and member_id = p_member and status in ('confirmed','waitlisted')) then
    raise exception 'ALREADY_BOOKED';
  end if;
  if _elan_level_rank((select level from members where id = p_member)) < _elan_level_rank(v_inst.level) then
    raise exception 'LEVEL_TOO_LOW';
  end if;

  select count(*) into v_confirmed from bookings
    where class_instance_id = p_class_instance_id and status = 'confirmed';
  v_spots := v_inst.capacity - v_confirmed;

  if v_spots > 0 then
    if _elan_membership_covers(p_member) then
      v_audience := 'member'; v_credits := 0;
    elsif elan_credit_balance(p_member) >= 1 then
      v_audience := 'payg'; v_credits := 1;
    else
      raise exception 'NO_CREDITS';
    end if;
    insert into bookings (class_instance_id, member_id, status, source, credits_used, payment_audience)
      values (p_class_instance_id, p_member, 'confirmed', p_source, v_credits, v_audience)
      returning * into v_booking;
    if v_credits > 0 then
      perform _elan_add_ledger(p_member, -1, 'booking', v_booking.id);
    end if;
  else
    select max_waitlist_size into v_max_wait from studio_settings where id;
    select count(*) into v_wait_count from bookings
      where class_instance_id = p_class_instance_id and status = 'waitlisted';
    if v_wait_count >= v_max_wait then raise exception 'WAITLIST_FULL'; end if;
    select coalesce(max(waitlist_position), 0) + 1 into v_next_pos from bookings
      where class_instance_id = p_class_instance_id and status = 'waitlisted';
    insert into bookings (class_instance_id, member_id, status, waitlist_position, source, credits_used, payment_audience)
      values (p_class_instance_id, p_member, 'waitlisted', v_next_pos, p_source, 0, 'payg')
      returning * into v_booking;
  end if;
  return v_booking;
end; $function$
```

### cancel_booking(p_member, p_booking_id)
```sql
CREATE OR REPLACE FUNCTION public.cancel_booking(p_member uuid, p_booking_id uuid)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  return v_booking;
end; $function$
```

### handle_new_user() — trigger on auth.users
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_member uuid;
begin
  -- Link the new auth user to an existing (admin-created) member by email.
  update public.members
     set auth_user_id = new.id
   where auth_user_id is null
     and lower(email) = lower(new.email)
   returning id into v_member;

  -- Only create a fresh member row when no matching email exists.
  if v_member is null then
    insert into public.members (auth_user_id, full_name, phone, email, locale)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', 'عضوة'), new.phone, new.email, 'ar')
    on conflict (auth_user_id) do nothing
    returning id into v_member;
  end if;

  if v_member is not null then
    insert into public.member_consents (member_id, channel, active) values
      (v_member, 'whatsapp', true), (v_member, 'in_app', true)
    on conflict do nothing;
  end if;
  return new;
end; $function$
```

### fulfill_purchase(p_member, p_type, p_ref_id, p_moyasar_id)
```sql
CREATE OR REPLACE FUNCTION public.fulfill_purchase(p_member uuid, p_type payment_type, p_ref_id uuid, p_moyasar_id text)
 RETURNS payments
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_payment payments;
  v_price numeric(10,2);
  v_credits int;
  v_interval billing_interval;
  v_period interval;
begin
  if p_type = 'credit_pack' then
    select price_sar, credits into v_price, v_credits from credit_packs where id = p_ref_id and active;
    if v_price is null then raise exception 'PACK_NOT_FOUND'; end if;
    insert into payments (member_id, amount_sar, currency, moyasar_payment_id, status, type, ref_id)
      values (p_member, v_price, 'SAR', p_moyasar_id, 'paid', 'credit_pack', p_ref_id)
      returning * into v_payment;
    perform _elan_add_ledger(p_member, v_credits, 'purchase', v_payment.id);
  else
    select price_sar, billing_interval into v_price, v_interval from membership_plans where id = p_ref_id and active;
    if v_price is null then raise exception 'PLAN_NOT_FOUND'; end if;
    v_period := case v_interval
      when 'weekly' then interval '7 days'
      when 'monthly' then interval '1 month'
      when 'quarterly' then interval '3 months'
      when 'yearly' then interval '1 year'
    end;
    insert into payments (member_id, amount_sar, currency, moyasar_payment_id, status, type, ref_id)
      values (p_member, v_price, 'SAR', p_moyasar_id, 'paid', 'membership', p_ref_id)
      returning * into v_payment;
    insert into member_memberships (member_id, plan_id, status, started_at, current_period_start, current_period_end)
      values (p_member, p_ref_id, 'active', now(), now(), now() + v_period);
  end if;
  return v_payment;
end; $function$
```

---

## 3. Application source files

> Paths note: the user referenced `src/lib/admin-actions.ts`; the actual path is
> `src/admin-actions.ts`.

</content>
</invoke>

### src/admin-actions.ts

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import {
  computePrice,
  grossFromNet,
  DEFAULT_CLASS_NET_HALALAS,
  type DiscountType,
  type DiscountKind,
  type PricingSource,
} from "@/lib/pricing";

type ActionResult = { ok: true } | { ok: false; error: string };

async function adminClient() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return null;
  return supabase;
}

export async function createMemberAction(input: {
  full_name: string;
  phone?: string;
  email?: string;
  source?: string;
  lead_status?: string;
  recommended_class?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const full_name = input.full_name?.trim();
  if (!full_name) return { ok: false, error: "name_required" };
  const { data, error } = await supabase
    .from("members")
    .insert({
      full_name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      source: input.source?.trim() || null,
      lead_status: input.lead_status?.trim() || "lead",
      recommended_class: input.recommended_class?.trim() || null,
      role: "member",
    } as never)
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  revalidatePath("/admin/members");
  return { ok: true, id: data.id };
}

export async function updateMemberAction(
  memberId: string,
  input: { full_name: string; phone?: string; email?: string; source?: string; lead_status?: string },
): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const full_name = input.full_name?.trim();
  if (!full_name) return { ok: false, error: "name_required" };
  const { error } = await supabase
    .from("members")
    .update({
      full_name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      source: input.source?.trim() || null,
      lead_status: input.lead_status?.trim() || null,
      modified: new Date().toISOString(),
    })
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function createTaskAction(memberId: string, title: string, dueDate?: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const t = title?.trim();
  if (!t) return { ok: false, error: "title_required" };
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await (supabase as unknown as {
    from: (x: string) => { insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  })
    .from("member_tasks")
    .insert({ member_id: memberId, title: t, due_date: dueDate?.trim() || null, status: "open", created_by: auth.user?.id ?? null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setTaskStatusAction(taskId: string, status: "open" | "done", memberId: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const { error } = await (supabase as unknown as {
    from: (x: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, val: string) => Promise<{ error: { message: string } | null }> } };
  })
    .from("member_tasks")
    .update({ status })
    .eq("id", taskId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function setLeadStatusAction(memberId: string, status: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const { error } = await supabase
    .from("members")
    .update({ lead_status: status || null, modified: new Date().toISOString() })
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function addNoteAction(memberId: string, body: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const text = body?.trim();
  if (!text) return { ok: false, error: "empty" };
  const { data: auth } = await supabase.auth.getUser();
  // member_notes is a new table not yet in the generated Database types.
  const { error } = await (supabase as unknown as {
    from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  })
    .from("member_notes")
    .insert({ member_id: memberId, body: text, created_by: auth.user?.id ?? null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  return { ok: true };
}

/* ──────────────────────────────────────────────────────────────────────────
   Class-value accounting: sales, discounts, comps, packages, promos, audit.
   Money in halalas; every mutation is gated by is_admin and written to
   pricing_audit (who / when / reason / old / new).
   ────────────────────────────────────────────────────────────────────────── */

/** Admin context with the acting user id (for the audit trail). */
async function adminCtx(): Promise<{ supabase: Awaited<ReturnType<typeof getServerSupabase>>; userId: string } | null> {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return null;
  return { supabase, userId: auth.user.id };
}

/** Untyped table accessor for tables/columns outside the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tbl(supabase: Awaited<ReturnType<typeof getServerSupabase>>, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from(name);
}

async function writeAudit(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  actorId: string,
  e: { entity_type: string; entity_id?: string; action: string; field?: string; old_value?: string; new_value?: string; reason?: string | null },
): Promise<void> {
  await tbl(supabase, "pricing_audit").insert({ ...e, actor_id: actorId });
}

type PromoResolution = { ok: true; id: string; kind: DiscountKind; value: number } | { ok: false; error: string };

/** Validate a promo code against window, active flag, max and per-member limits. */
async function resolvePromo(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  code: string,
  memberId: string | null,
): Promise<PromoResolution> {
  const clean = code?.trim().toUpperCase();
  if (!clean) return { ok: false, error: "promo_required" };
  const { data: promo } = await tbl(supabase, "promo_codes").select("*").eq("code", clean).maybeSingle();
  if (!promo) return { ok: false, error: "promo_not_found" };
  if (!promo.active) return { ok: false, error: "promo_inactive" };
  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return { ok: false, error: "promo_not_started" };
  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) return { ok: false, error: "promo_expired" };
  if (promo.max_redemptions != null) {
    const { count } = await tbl(supabase, "promo_redemptions").select("id", { count: "exact", head: true }).eq("promo_code_id", promo.id);
    if ((count ?? 0) >= promo.max_redemptions) return { ok: false, error: "promo_max_reached" };
  }
  if (promo.per_member_limit != null && memberId) {
    const { count } = await tbl(supabase, "promo_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("promo_code_id", promo.id)
      .eq("member_id", memberId);
    if ((count ?? 0) >= promo.per_member_limit) return { ok: false, error: "promo_member_limit" };
  }
  return { ok: true, id: promo.id, kind: promo.discount_type as DiscountKind, value: promo.discount_value };
}

/** Resolve a discount input into an arithmetic kind/value (+ promo id). */
async function resolveDiscount(
  supabase: Awaited<ReturnType<typeof getServerSupabase>>,
  memberId: string | null,
  discountType: DiscountType,
  discountValue: number | undefined,
  promoCode: string | undefined,
): Promise<{ ok: true; kind: DiscountKind; value: number; promoId: string | null } | { ok: false; error: string }> {
  if (discountType === "promo_code") {
    const r = await resolvePromo(supabase, promoCode ?? "", memberId);
    if (!r.ok) return r;
    return { ok: true, kind: r.kind, value: r.value, promoId: r.id };
  }
  if (discountType === "percentage" || discountType === "fixed") {
    return { ok: true, kind: discountType, value: Math.max(0, discountValue ?? 0), promoId: null };
  }
  return { ok: true, kind: "none", value: 0, promoId: null };
}

export interface ClassSaleInput {
  pricingSource: PricingSource;
  discountType: DiscountType;
  discountValue?: number; // percentage -> bps; fixed -> halalas
  promoCode?: string;
  reason?: string;
}

/** Record a class booking with full value accounting (single cash / package credit / unlimited / comp / manual). */
export async function recordClassSaleAction(memberId: string, classInstanceId: string, input: ClassSaleInput): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;

  const { data: ci } = await tbl(supabase, "class_instances")
    .select("id, class_types(base_net_halalas,vat_bps)")
    .eq("id", classInstanceId)
    .maybeSingle();
  if (!ci) return { ok: false, error: "class_not_found" };
  const baseNet = ci.class_types?.base_net_halalas ?? DEFAULT_CLASS_NET_HALALAS;
  const vatBps = ci.class_types?.vat_bps ?? 1500;
  const listGross = grossFromNet(baseNet, vatBps);

  let storedType: DiscountType = input.discountType;
  let kind: DiscountKind = "none";
  let value = 0;
  let promoId: string | null = null;
  let reason = input.reason ?? null;

  if (input.pricingSource === "complimentary") {
    storedType = "manual";
    kind = "percentage";
    value = 10000; // 100%
    reason = reason ?? "complimentary";
  } else {
    const d = await resolveDiscount(supabase, memberId, input.discountType, input.discountValue, input.promoCode);
    if (!d.ok) return d;
    kind = d.kind;
    value = d.value;
    promoId = d.promoId;
  }

  // Package credit and unlimited membership: no cash for the class itself.
  let p;
  if (input.pricingSource === "package_credit" || input.pricingSource === "unlimited_membership") {
    p = {
      baseNetHalalas: baseNet,
      discountAmountHalalas: input.pricingSource === "package_credit" ? baseNet : 0,
      finalNetHalalas: 0,
      vatBps,
      vatAmountHalalas: 0,
      finalGrossHalalas: 0,
    };
  } else {
    p = computePrice({ baseNetHalalas: baseNet, vatBps, discountKind: kind, discountValue: value });
  }

  const cash = input.pricingSource === "single" || input.pricingSource === "manual";
  const audience = cash ? "payg" : "member";

  const { data: booking, error: bErr } = await tbl(supabase, "bookings")
    .insert({
      member_id: memberId,
      class_instance_id: classInstanceId,
      status: "confirmed",
      source: "admin",
      payment_audience: audience,
      credits_used: input.pricingSource === "package_credit" ? 1 : 0,
      base_net_halalas: p.baseNetHalalas,
      discount_type: storedType,
      discount_value: value,
      discount_amount_halalas: p.discountAmountHalalas,
      final_net_halalas: p.finalNetHalalas,
      vat_bps: vatBps,
      vat_amount_halalas: p.vatAmountHalalas,
      final_gross_halalas: p.finalGrossHalalas,
      currency: "SAR",
      pricing_source: input.pricingSource,
      list_value_halalas: listGross,
      effective_paid_halalas: cash ? p.finalGrossHalalas : null,
      discount_reason: reason,
      promo_code_id: promoId,
    })
    .select("id")
    .single();
  if (bErr || !booking) return { ok: false, error: bErr?.message ?? "booking_failed" };

  if (input.pricingSource === "package_credit") {
    const { data: bal } = await rpc<number>(supabase, "elan_credit_balance", { p_member: memberId });
    await tbl(supabase, "credit_ledger").insert({ member_id: memberId, change: -1, reason: "booking", balance_after: (bal ?? 0) - 1, ref_id: booking.id });
  }

  if (cash && p.finalGrossHalalas > 0) {
    const { data: pay } = await tbl(supabase, "payments")
      .insert({
        member_id: memberId,
        amount_sar: p.finalGrossHalalas / 100,
        sales_tax_sar: p.vatAmountHalalas / 100,
        currency: "SAR",
        status: "paid",
        type: "single_class",
        ref_id: booking.id,
        base_net_halalas: p.baseNetHalalas,
        discount_type: storedType,
        discount_value: value,
        discount_amount_halalas: p.discountAmountHalalas,
        net_halalas: p.finalNetHalalas,
        vat_amount_halalas: p.vatAmountHalalas,
        gross_halalas: p.finalGrossHalalas,
        promo_code_id: promoId,
      })
      .select("id")
      .single();
    if (promoId)
      await tbl(supabase, "promo_redemptions").insert({
        promo_code_id: promoId,
        member_id: memberId,
        booking_id: booking.id,
        payment_id: pay?.id ?? null,
        discount_amount_halalas: p.discountAmountHalalas,
      });
  } else if (promoId) {
    await tbl(supabase, "promo_redemptions").insert({ promo_code_id: promoId, member_id: memberId, booking_id: booking.id, discount_amount_halalas: p.discountAmountHalalas });
  }

  await writeAudit(supabase, userId, {
    entity_type: "booking",
    entity_id: booking.id,
    action: "sale",
    field: "final_gross_halalas",
    old_value: "0",
    new_value: String(p.finalGrossHalalas),
    reason: reason ?? input.pricingSource,
  });
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

/** Apply / change a discount on an existing booking (recomputes VAT + gross, audits old→new). */
export async function applyBookingDiscountAction(
  bookingId: string,
  input: { discountType: DiscountType; discountValue?: number; promoCode?: string; reason?: string },
): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { data: b } = await tbl(supabase, "bookings")
    .select("id,member_id,base_net_halalas,vat_bps,final_gross_halalas")
    .eq("id", bookingId)
    .maybeSingle();
  if (!b) return { ok: false, error: "not_found" };
  const baseNet = b.base_net_halalas ?? DEFAULT_CLASS_NET_HALALAS;
  const vatBps = b.vat_bps ?? 1500;
  const d = await resolveDiscount(supabase, b.member_id, input.discountType, input.discountValue, input.promoCode);
  if (!d.ok) return d;
  const p = computePrice({ baseNetHalalas: baseNet, vatBps, discountKind: d.kind, discountValue: d.value });
  const old = b.final_gross_halalas;
  await tbl(supabase, "bookings")
    .update({
      discount_type: input.discountType,
      discount_value: d.value,
      discount_amount_halalas: p.discountAmountHalalas,
      final_net_halalas: p.finalNetHalalas,
      vat_amount_halalas: p.vatAmountHalalas,
      final_gross_halalas: p.finalGrossHalalas,
      effective_paid_halalas: p.finalGrossHalalas,
      discount_reason: input.reason ?? null,
      promo_code_id: d.promoId,
    })
    .eq("id", bookingId);
  await writeAudit(supabase, userId, {
    entity_type: "booking",
    entity_id: bookingId,
    action: "discount_applied",
    field: "final_gross_halalas",
    old_value: String(old ?? ""),
    new_value: String(p.finalGrossHalalas),
    reason: input.reason,
  });
  revalidatePath(`/admin/members/${b.member_id}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

/** Comp a booking: list value retained for reporting, cash zeroed. */
export async function compBookingAction(bookingId: string, reason?: string): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { data: b } = await tbl(supabase, "bookings").select("id,member_id,base_net_halalas,vat_bps,final_gross_halalas").eq("id", bookingId).maybeSingle();
  if (!b) return { ok: false, error: "not_found" };
  const baseNet = b.base_net_halalas ?? DEFAULT_CLASS_NET_HALALAS;
  const vatBps = b.vat_bps ?? 1500;
  const old = b.final_gross_halalas;
  await tbl(supabase, "bookings")
    .update({
      pricing_source: "complimentary",
      discount_type: "manual",
      discount_value: 10000,
      discount_amount_halalas: baseNet,
      final_net_halalas: 0,
      vat_amount_halalas: 0,
      final_gross_halalas: 0,
      list_value_halalas: grossFromNet(baseNet, vatBps),
      effective_paid_halalas: 0,
      discount_reason: reason ?? "complimentary",
    })
    .eq("id", bookingId);
  await writeAudit(supabase, userId, {
    entity_type: "booking",
    entity_id: bookingId,
    action: "comp",
    field: "final_gross_halalas",
    old_value: String(old ?? ""),
    new_value: "0",
    reason: reason ?? "complimentary",
  });
  revalidatePath(`/admin/members/${b.member_id}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

export interface PackageSaleInput {
  credits: number;
  baseNetHalalas: number; // package net before discount
  discountType: DiscountType;
  discountValue?: number;
  promoCode?: string;
  reason?: string;
  startsAt?: string; // bundle start date (may be in the future); defaults to now
  paymentStatus?: "paid" | "pending"; // pending -> not counted as revenue until paid
  method?: string; // cash | mada | transfer | online | other
}

/** Sell a credit package with optional discount/promo; adds credits + records payment accounting. */
export async function sellPackageAction(memberId: string, input: PackageSaleInput): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const credits = Math.max(1, Math.floor(input.credits || 0));
  if (!input.baseNetHalalas || input.baseNetHalalas < 0) return { ok: false, error: "price_required" };
  const d = await resolveDiscount(supabase, memberId, input.discountType, input.discountValue, input.promoCode);
  if (!d.ok) return d;
  const p = computePrice({ baseNetHalalas: input.baseNetHalalas, discountKind: d.kind, discountValue: d.value });
  const status = input.paymentStatus === "pending" ? "initiated" : "paid";

  const { data: pay, error: pErr } = await tbl(supabase, "payments")
    .insert({
      member_id: memberId,
      amount_sar: p.finalGrossHalalas / 100,
      sales_tax_sar: p.vatAmountHalalas / 100,
      currency: "SAR",
      status,
      method: input.method ?? null,
      starts_at: input.startsAt || new Date().toISOString(),
      type: "credit_pack",
      base_net_halalas: p.baseNetHalalas,
      discount_type: input.discountType,
      discount_value: d.value,
      discount_amount_halalas: p.discountAmountHalalas,
      net_halalas: p.finalNetHalalas,
      vat_amount_halalas: p.vatAmountHalalas,
      gross_halalas: p.finalGrossHalalas,
      promo_code_id: d.promoId,
    })
    .select("id")
    .single();
  if (pErr || !pay) return { ok: false, error: pErr?.message ?? "payment_failed" };

  const { data: bal } = await rpc<number>(supabase, "elan_credit_balance", { p_member: memberId });
  await tbl(supabase, "credit_ledger").insert({ member_id: memberId, change: credits, reason: "purchase", balance_after: (bal ?? 0) + credits, ref_id: pay.id });
  if (d.promoId)
    await tbl(supabase, "promo_redemptions").insert({ promo_code_id: d.promoId, member_id: memberId, payment_id: pay.id, discount_amount_halalas: p.discountAmountHalalas });

  await writeAudit(supabase, userId, {
    entity_type: "payment",
    entity_id: pay.id,
    action: "package_sale",
    field: "gross_halalas",
    old_value: "0",
    new_value: String(p.finalGrossHalalas),
    reason: input.reason ?? `${credits} credits · ${status}${input.method ? " · " + input.method : ""}`,
  });
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/reports");
  return { ok: true };
}

export interface PromoInput {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // percentage -> bps; fixed -> halalas
  startsAt?: string;
  expiresAt?: string;
  maxRedemptions?: number;
  perMemberLimit?: number;
}

export async function createPromoCodeAction(input: PromoInput): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const code = input.code?.trim().toUpperCase();
  if (!code) return { ok: false, error: "code_required" };
  if (input.discountType !== "percentage" && input.discountType !== "fixed") return { ok: false, error: "bad_type" };
  const { error } = await tbl(supabase, "promo_codes").insert({
    code,
    discount_type: input.discountType,
    discount_value: Math.max(0, input.discountValue || 0),
    starts_at: input.startsAt || null,
    expires_at: input.expiresAt || null,
    max_redemptions: input.maxRedemptions ?? null,
    per_member_limit: input.perMemberLimit ?? null,
    active: true,
    created_by: userId,
  });
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "promo", action: "promo_created", new_value: code });
  revalidatePath("/admin/promo");
  return { ok: true };
}

export async function setPromoCodeActiveAction(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { error } = await tbl(supabase, "promo_codes").update({ active }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "promo", entity_id: id, action: "promo_toggle", new_value: String(active) });
  revalidatePath("/admin/promo");
  return { ok: true };
}

/** Cancel a class instance (soft — keeps it visible as "cancelled", unbookable). */
export async function cancelClassAction(classInstanceId: string): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { error } = await tbl(supabase, "class_instances").update({ status: "cancelled" }).eq("id", classInstanceId);
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "class_instance", entity_id: classInstanceId, action: "cancel_class" });
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath("/schedule");
  return { ok: true };
}

/** Hard-delete a class instance — only when it has no bookings. */
export async function deleteClassAction(classInstanceId: string): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;
  const { count } = await tbl(supabase, "bookings")
    .select("id", { count: "exact", head: true })
    .eq("class_instance_id", classInstanceId)
    .in("status", ["confirmed", "waitlisted", "attended"]);
  if ((count ?? 0) > 0) return { ok: false, error: "has_bookings" };
  const { error } = await tbl(supabase, "class_instances").delete().eq("id", classInstanceId);
  if (error) return { ok: false, error: error.message };
  await writeAudit(supabase, userId, { entity_type: "class_instance", entity_id: classInstanceId, action: "delete_class" });
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath("/schedule");
  return { ok: true };
}

export interface ScheduleGenInput {
  startDate: string; // YYYY-MM-DD (Riyadh)
  days: number;
  perDay: number;
  firstTime: string; // HH:MM (24h)
  durationMin: number;
  bufferMin: number; // cleaning time between classes
  capacity: number;
  classTypeIds: string[]; // rotated across slots
  instructorId?: string;
  skipWeekdays?: number[]; // 0=Sun … 6=Sat — these weekdays are skipped
}

const pad = (n: number) => String(n).padStart(2, "0");
function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Generate class instances (default: 8/day × 6 days, 09:00 start, 50min + cleaning). */
export async function generateScheduleAction(
  input: ScheduleGenInput,
): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;

  const days = Math.min(31, Math.max(1, Math.floor(input.days || 0)));
  const perDay = Math.min(20, Math.max(1, Math.floor(input.perDay || 0)));
  const durationMin = Math.max(10, Math.floor(input.durationMin || 50));
  const bufferMin = Math.max(0, Math.floor(input.bufferMin || 0));
  const capacity = Math.max(1, Math.floor(input.capacity || 6));
  const typeIds = (input.classTypeIds || []).filter(Boolean);
  if (!input.startDate) return { ok: false, error: "start_required" };
  if (typeIds.length === 0) return { ok: false, error: "class_type_required" };
  const [fh, fm] = (input.firstTime || "09:00").split(":").map((x) => parseInt(x, 10));
  if (Number.isNaN(fh) || Number.isNaN(fm)) return { ok: false, error: "time_invalid" };

  // default level per class type
  const { data: cts } = await tbl(supabase, "class_types").select("id,default_level").in("id", typeIds);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const levelMap = new Map<string, string>((cts ?? []).map((c: any) => [c.id, c.default_level ?? "level_1"]));

  // skip slots that already exist (idempotent re-runs)
  const rangeStart = `${input.startDate}T00:00:00+03:00`;
  const rangeEnd = `${addDaysStr(input.startDate, days * 3 + 14)}T23:59:59+03:00`;
  const { data: existing } = await tbl(supabase, "class_instances").select("starts_at").gte("starts_at", rangeStart).lte("starts_at", rangeEnd);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingSet = new Set((existing ?? []).map((e: any) => new Date(e.starts_at).getTime()));

  const nowIso = new Date().toISOString();
  const skip = new Set(input.skipWeekdays ?? []);
  const rows: Record<string, unknown>[] = [];
  let rot = 0;
  // Produce `days` ACTIVE days, skipping excluded weekdays (e.g. Friday).
  let active = 0;
  for (let i = 0; active < days && i < days * 3 + 14; i++) {
    const dateStr = addDaysStr(input.startDate, i);
    const weekday = new Date(dateStr + "T12:00:00Z").getUTCDay();
    if (skip.has(weekday)) continue;
    active++;
    for (let s = 0; s < perDay; s++) {
      const startTotal = fh * 60 + fm + s * (durationMin + bufferMin);
      const startIso = `${dateStr}T${pad(Math.floor(startTotal / 60))}:${pad(startTotal % 60)}:00+03:00`;
      if (existingSet.has(new Date(startIso).getTime())) continue;
      const endTotal = startTotal + durationMin;
      const endIso = `${dateStr}T${pad(Math.floor(endTotal / 60))}:${pad(endTotal % 60)}:00+03:00`;
      const ctId = typeIds[rot % typeIds.length];
      rot++;
      rows.push({
        class_type_id: ctId,
        instructor_id: input.instructorId || null,
        starts_at: startIso,
        ends_at: endIso,
        capacity,
        level: levelMap.get(ctId) ?? "level_1",
        status: "scheduled",
        booking_opens_at: nowIso, // open for booking immediately
        booking_closes_at: startIso, // closes when the class starts
      });
    }
  }

  if (rows.length === 0) return { ok: true, created: 0 };
  const { error } = await tbl(supabase, "class_instances").insert(rows);
  if (error) return { ok: false, error: error.message };

  await writeAudit(supabase, userId, {
    entity_type: "schedule",
    action: "generate",
    field: "class_instances",
    old_value: "0",
    new_value: String(rows.length),
    reason: `${perDay}/day × ${days}d from ${input.startDate} ${input.firstTime}`,
  });
  revalidatePath("/admin/schedule");
  revalidatePath("/admin");
  revalidatePath("/schedule");
  return { ok: true, created: rows.length };
}

```

### src/actions/index.ts

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { DEMO } from "@/lib/demo";

/** True when a real subscriber (auth_user_id linked) is signed in. */
async function isRealMember(supabase: Awaited<ReturnType<typeof getServerSupabase>>): Promise<boolean> {
  const { data } = await rpc<string>(supabase, "current_member_id");
  return Boolean(data);
}

export async function bookAction(classInstanceId: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/bookings");
    return { ok: true as const, bookingId: "mock-bk-new" };
  }
  const { data, error } = await rpc<{ id: string }>(supabase, "book_class_self", { p_class_instance_id: classInstanceId, p_source: "web" });
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath(`/class/${classInstanceId}`);
  revalidatePath("/bookings");
  return error ? { error: error.message } : { ok: true as const, bookingId: data?.id ?? null };
}

export async function cancelAction(bookingId: string, classInstanceId?: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/bookings");
    if (classInstanceId) revalidatePath(`/class/${classInstanceId}`);
    return { ok: true };
  }
  const { error } = await rpc(supabase, "cancel_booking_self", { p_booking_id: bookingId });
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/bookings");
  if (classInstanceId) revalidatePath(`/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}

export async function purchaseAction(type: "membership" | "credit_pack", refId: string) {
  if (DEMO) {
    revalidatePath("/memberships"); revalidatePath("/profile");
    return { ok: true };
  }
  const supabase = await getServerSupabase();
  // Mock checkout: the PaymentProvider would redirect to Moyasar in production;
  // here we fulfill instantly via the sandbox RPC.
  const { error } = await rpc(supabase, "simulate_purchase", { p_type: type, p_ref_id: refId });
  revalidatePath("/memberships");
  revalidatePath("/profile");
  return error ? { error: error.message } : { ok: true };
}

export async function setLocaleAction(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function signOutAction() {
  if (DEMO) redirect("/login");
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}

```

### src/lib/queries.ts

```typescript
import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc } from "./format";
import { DEMO } from "./demo";
import { mockBooking, mockBookings, mockCatalogue, mockClassById, mockClasses, mockMemberContext } from "./mock";

export type DisplayStatus = "available" | "waitlist_open" | "fully_booked" | "booking_closed";

/** Member id for a real signed-in subscriber (resolved via auth_user_id link).
 *  Null when logged out or admin. When non-null the member app uses real data
 *  + real booking RPCs; otherwise it falls back to the demo showcase. */
async function currentRealMemberId(): Promise<string | null> {
  try {
    const supabase = await getServerSupabase();
    const { data } = await rpc<string>(supabase, "current_member_id");
    return (data as string | null) ?? null;
  } catch {
    return null;
  }
}

export interface ClassCardData {
  id: string;
  starts_at: string;
  ends_at: string;
  level: "level_1" | "level_1_5" | "level_2";
  name_ar: string; name_en: string;
  description_ar: string | null; description_en: string | null;
  duration_minutes: number;
  instructor_ar: string | null; instructor_en: string | null;
  display_status: DisplayStatus;
  spots_left: number; waitlist_count: number; capacity: number;
  is_bookable_now: boolean;
  my_status: "confirmed" | "waitlisted" | null;
  my_booking_id: string | null;
}

async function fetchBetween(startIso: string, endIso: string): Promise<ClassCardData[]> {
 try {
  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("class_instances")
    .select("id,starts_at,ends_at,level,capacity,class_types(name_ar,name_en,description_ar,description_en,duration_minutes),instructors(name_ar,name_en)")
    .gte("starts_at", startIso).lt("starts_at", endIso)
    .order("starts_at", { ascending: true });
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [{ data: avail }, { data: mine }] = await Promise.all([
    supabase.from("class_instance_availability").select("*").in("class_instance_id", ids),
    supabase.from("bookings").select("id,status,class_instance_id").in("class_instance_id", ids).in("status", ["confirmed", "waitlisted"]),
  ]);
  const am = new Map((avail ?? []).map((a) => [a.class_instance_id, a]));
  const bm = new Map((mine ?? []).map((b) => [b.class_instance_id, b]));

  return rows.map((r) => {
    const a = am.get(r.id); const b = bm.get(r.id);
    return {
      id: r.id, starts_at: r.starts_at, ends_at: r.ends_at, level: r.level,
      name_ar: r.class_types?.name_ar ?? "", name_en: r.class_types?.name_en ?? "",
      description_ar: r.class_types?.description_ar ?? null, description_en: r.class_types?.description_en ?? null,
      duration_minutes: r.class_types?.duration_minutes ?? 0,
      instructor_ar: r.instructors?.name_ar ?? null, instructor_en: r.instructors?.name_en ?? null,
      display_status: (a?.display_status as DisplayStatus) ?? "available",
      spots_left: a?.spots_left ?? r.capacity, waitlist_count: a?.waitlist_count ?? 0, capacity: a?.capacity ?? r.capacity,
      is_bookable_now: a?.is_bookable_now ?? false,
      my_status: (b?.status as "confirmed" | "waitlisted" | undefined) ?? null,
      my_booking_id: b?.id ?? null,
    };
  });
 } catch (e) {
  console.error("fetchBetween failed", e);
  return [];
 }
}

export async function getTimetable(date: string) {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockClasses(date);
  const { start, end } = dayBoundsUtc(date);
  const rows = await fetchBetween(start, end);
  if (realId) return rows; // real subscriber: show real timetable (even if empty)
  return rows.length ? rows : mockClasses(date);
}

export async function getClass(id: string): Promise<{ card: ClassCardData; eligibility: string }> {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockClassById(id);
  try {
    const now = Date.now();
    const all = await fetchBetween(new Date(now - 30 * 86400000).toISOString(), new Date(now + 90 * 86400000).toISOString());
    const card = all.find((c) => c.id === id);
    if (!card) return mockClassById(id);
    const supabase = await getServerSupabase();
    const { data: elig } = await rpc<string>(supabase, "booking_eligibility_self", { p_class_instance_id: id });
    return { card, eligibility: elig ?? "NO_CREDITS" };
  } catch (e) {
    console.error("getClass failed", e);
    return mockClassById(id);
  }
}

export async function getMyBookings() {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockBookings();
  try {
    const supabase = await getServerSupabase();
    const { data } = await supabase
      .from("bookings")
      .select("id,status,waitlist_position,created_at,class_instances(starts_at,ends_at,class_types(name_ar,name_en),instructors(name_ar,name_en))")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((b) => ({
      id: b.id, status: b.status as string, waitlist_position: b.waitlist_position as number | null,
      starts_at: b.class_instances?.starts_at ?? "", ends_at: b.class_instances?.ends_at ?? "",
      name_ar: b.class_instances?.class_types?.name_ar ?? "", name_en: b.class_instances?.class_types?.name_en ?? "",
      instructor_ar: b.class_instances?.instructors?.name_ar ?? null, instructor_en: b.class_instances?.instructors?.name_en ?? null,
    }));
    if (realId) return rows; // real subscriber: show real bookings (even if empty)
    return rows.length ? rows : mockBookings();
  } catch (e) {
    console.error("getMyBookings failed", e);
    return mockBookings();
  }
}

export async function getMemberContext() {
  // Resolve a real authenticated subscriber first — by email — so the app shows
  // her real name/credits even while the timetable showcase stays in demo mode.
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    const email = auth.user?.email;
    if (email) {
      const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
      if (!isAdmin) {
        // Prefer the linked member (unique via auth_user_id); fall back to email.
        const { data: mid } = await rpc<string>(supabase, "current_member_id");
        let real: { id: string; full_name: string; phone: string | null; email: string | null } | null = null;
        if (mid) {
          const { data } = await supabase.from("members").select("id,full_name,phone,email").eq("id", mid).maybeSingle();
          real = data ?? null;
        }
        if (!real) {
          const { data } = await supabase
            .from("members")
            .select("id,full_name,phone,email")
            .ilike("email", email)
            .order("created_at", { ascending: true })
            .limit(1);
          real = data?.[0] ?? null;
        }
        if (real) {
          const [{ data: bal }, { data: mem }] = await Promise.all([
            rpc<number>(supabase, "elan_credit_balance", { p_member: real.id }),
            supabase
              .from("member_memberships")
              .select("status,current_period_end,membership_plans(name_ar,name_en)")
              .eq("member_id", real.id)
              .eq("status", "active")
              .order("current_period_end", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
          const planRaw = (mem as { membership_plans?: unknown } | null)?.membership_plans;
          const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
          const membership = mem
            ? { current_period_end: (mem as { current_period_end: string }).current_period_end, membership_plans: (plan as { name_ar: string; name_en: string } | null) ?? null }
            : null;
          return { member: real, balance: bal ?? 0, membership, isAdmin: false };
        }
      }
    }
  } catch (e) {
    console.error("getMemberContext (real) failed", e);
  }

  if (DEMO) return mockMemberContext();
  try {
    const supabase = await getServerSupabase();
    const { data: member } = await supabase.from("members").select("id,full_name,phone,email").maybeSingle();
    if (!member) return mockMemberContext();
    const [{ data: balance }, { data: membership }, { data: isAdmin }] = await Promise.all([
      rpc<number>(supabase, "elan_credit_balance", { p_member: member.id }),
      supabase.from("member_memberships").select("status,current_period_end,membership_plans(name_ar,name_en)").eq("status", "active").order("current_period_end", { ascending: false }).limit(1).maybeSingle(),
      rpc<boolean>(supabase, "is_admin"),
    ]);
    // Supabase may type the embed as an array; normalise to a single object.
    const planRaw = (membership as { membership_plans?: unknown } | null)?.membership_plans;
    const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    const normalized = membership
      ? { current_period_end: (membership as { current_period_end: string }).current_period_end, membership_plans: (plan as { name_ar: string; name_en: string } | null) ?? null }
      : null;
    return { member, balance: balance ?? 0, membership: normalized, isAdmin: Boolean(isAdmin) };
  } catch (e) {
    console.error("getMemberContext failed", e);
    return mockMemberContext();
  }
}

export async function getCatalogue() {
  if (DEMO) return mockCatalogue();
  try {
    const supabase = await getServerSupabase();
    const [{ data: plans }, { data: packs }] = await Promise.all([
      supabase.from("membership_plans").select("*").eq("active", true).order("price_sar"),
      supabase.from("credit_packs").select("*").eq("active", true).order("price_sar"),
    ]);
    if ((plans?.length ?? 0) === 0 && (packs?.length ?? 0) === 0) return mockCatalogue();
    return { plans: plans ?? [], packs: packs ?? [] };
  } catch (e) {
    console.error("getCatalogue failed", e);
    return mockCatalogue();
  }
}

export async function getBooking(id: string) {
 if (DEMO) return mockBooking(id);
 try {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("id,status,class_instances(starts_at,ends_at,class_types(name_ar,name_en,duration_minutes),instructors(name_ar,name_en))")
    .eq("id", id)
    .maybeSingle();
  if (!data) return mockBooking(id);
  return {
    id: data.id,
    status: data.status,
    starts_at: data.class_instances?.starts_at ?? "",
    ends_at: data.class_instances?.ends_at ?? "",
    duration: data.class_instances?.class_types?.duration_minutes ?? 0,
    name_ar: data.class_instances?.class_types?.name_ar ?? "",
    name_en: data.class_instances?.class_types?.name_en ?? "",
    instructor_ar: data.class_instances?.instructors?.name_ar ?? null,
    instructor_en: data.class_instances?.instructors?.name_en ?? null,
  };
 } catch (e) {
  console.error("getBooking failed", e);
  return mockBooking(id);
 }
}

```

### src/lib/pricing.ts

```typescript
/**
 * ÉLAN pricing engine — class-value accounting with discounts.
 *
 * All money is stored and computed in HALALAS (integer, 1 SAR = 100 halalas)
 * to avoid floating-point drift. Canonical figures come from the ÉLAN dossier:
 *   • single group class: net 150.00 SAR (15,000 halalas)
 *   • VAT: 15%
 *   • single class gross: 172.50 SAR (17,250 halalas)
 *
 * Discount rules (dossier + handoff):
 *   • percentage and fixed discounts apply to the NET price, before VAT
 *   • VAT is calculated AFTER the discount
 *   • final net can never be below 0
 *   • final gross = final net + VAT
 */

export const VAT_BPS = 1500; // 15% expressed in basis points (1500 / 10000)
export const DEFAULT_CLASS_NET_HALALAS = 15000; // 150.00 SAR

/** How the discount amount is derived. Stored on the booking as discount_type. */
export type DiscountType = "none" | "percentage" | "fixed" | "promo_code" | "manual";

/** Where the class value comes from. Stored on the booking as pricing_source. */
export type PricingSource =
  | "single"
  | "package_credit"
  | "unlimited_membership"
  | "manual"
  | "complimentary";

/** The arithmetic kind of a discount, regardless of how it was sourced. */
export type DiscountKind = "none" | "percentage" | "fixed";

export interface PriceArgs {
  /** Base net amount before any discount, in halalas. */
  baseNetHalalas: number;
  /** VAT rate in basis points. Defaults to 15%. */
  vatBps?: number;
  /** Arithmetic kind of discount. */
  discountKind?: DiscountKind;
  /** For percentage: basis points (1000 = 10%). For fixed: halalas. */
  discountValue?: number;
}

export interface PriceBreakdown {
  baseNetHalalas: number;
  discountAmountHalalas: number;
  finalNetHalalas: number;
  vatBps: number;
  vatAmountHalalas: number;
  finalGrossHalalas: number;
}

/** Core engine: net → discount → VAT → gross, all in halalas. Pure + deterministic. */
export function computePrice(args: PriceArgs): PriceBreakdown {
  const vatBps = args.vatBps ?? VAT_BPS;
  const base = Math.max(0, Math.round(args.baseNetHalalas || 0));
  const kind = args.discountKind ?? "none";
  const value = Math.max(0, Math.round(args.discountValue || 0));

  let discount = 0;
  if (kind === "percentage") {
    const bps = Math.min(value, 10000); // cap at 100%
    discount = Math.round((base * bps) / 10000);
  } else if (kind === "fixed") {
    discount = value;
  }
  discount = Math.min(discount, base); // final net can never be below 0

  const finalNet = base - discount;
  const vatAmount = Math.round((finalNet * vatBps) / 10000);
  return {
    baseNetHalalas: base,
    discountAmountHalalas: discount,
    finalNetHalalas: finalNet,
    vatBps,
    vatAmountHalalas: vatAmount,
    finalGrossHalalas: finalNet + vatAmount,
  };
}

/** Gross (incl. VAT) from a net amount, in halalas. */
export function grossFromNet(netHalalas: number, vatBps: number = VAT_BPS): number {
  const net = Math.max(0, Math.round(netHalalas));
  return net + Math.round((net * vatBps) / 10000);
}

/** Net (excl. VAT) from a VAT-inclusive gross amount, in halalas. */
export function netFromGross(grossHalalas: number, vatBps: number = VAT_BPS): number {
  const gross = Math.max(0, Math.round(grossHalalas));
  return Math.round((gross * 10000) / (10000 + vatBps));
}

export function sarToHalalas(sar: number): number {
  return Math.round(sar * 100);
}

export function halalasToSar(halalas: number): number {
  return halalas / 100;
}

/** Format halalas as a SAR string, e.g. 17250 → "172.50". */
export function fmtHalalas(halalas: number, locale: "ar" | "en" = "en"): string {
  return (halalas / 100).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Map a stored DiscountType to its arithmetic kind. promo_code/manual resolve to a concrete kind upstream. */
export function discountKindFor(type: DiscountType, resolved?: DiscountKind): DiscountKind {
  if (type === "none") return "none";
  if (type === "percentage") return "percentage";
  if (type === "fixed") return "fixed";
  return resolved ?? "fixed"; // promo_code / manual carry a resolved kind
}

```
