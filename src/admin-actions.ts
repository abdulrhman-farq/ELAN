"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import {
  computePrice,
  grossFromNet,
  creditsGrantedFor,
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
      credits, // credits this purchase grants — applied to the ledger only once paid
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

  // Credits are granted ONLY for a paid sale. A pending sale records the payment
  // only; credits are applied later via markPaymentPaidAction (idempotent).
  const grant = creditsGrantedFor(status, credits);
  if (grant > 0) {
    const { data: bal } = await rpc<number>(supabase, "elan_credit_balance", { p_member: memberId });
    await tbl(supabase, "credit_ledger").insert({ member_id: memberId, change: grant, reason: "purchase", balance_after: (bal ?? 0) + grant, ref_id: pay.id });
  }
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

/**
 * Mark a pending (initiated) payment as paid and apply its credits exactly once.
 * - admin only
 * - atomically flips status only if it is currently 'initiated' (prevents double
 *   fulfillment under retries/double-clicks)
 * - the credit_ledger_purchase_once unique index is a second guard against
 *   granting credits twice for the same payment
 */
export async function markPaymentPaidAction(paymentId: string): Promise<ActionResult> {
  const ctx = await adminCtx();
  if (!ctx) return { ok: false, error: "forbidden" };
  const { supabase, userId } = ctx;

  // Fulfillment is centralised in confirm_payment (SECURITY DEFINER, is_admin
  // guarded): it flips initiated->paid under a row lock and grants credits /
  // activates membership EXACTLY ONCE (status guard + credit_ledger_purchase_once).
  // A second call on an already-paid payment is a safe no-op.
  const { data: paid, error } = await rpc<{ id: string; member_id: string; status: string }>(
    supabase,
    "confirm_payment",
    { p_payment_id: paymentId },
  );
  if (error) return { ok: false, error: error.message };
  if (!paid) return { ok: false, error: "not_found" };

  await writeAudit(supabase, userId, {
    entity_type: "payment",
    entity_id: paid.id,
    action: "mark_paid",
    field: "status",
    old_value: "initiated",
    new_value: "paid",
    reason: "manual fulfillment",
  });
  revalidatePath(`/admin/members/${paid.member_id}`);
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
