/**
 * Provider-agnostic payment-gateway webhook.
 *
 * Real gateways (Moyasar / Stripe / Tap …) POST asynchronous status updates
 * here. A thin per-gateway adapter (not included) normalizes the provider's
 * payload into the common `NormalizedEvent` shape below; everything downstream
 * is gateway-independent.
 *
 * SECURITY / TRUST MODEL
 * - The request is authenticated by an HMAC-SHA256 signature over the RAW body,
 *   verified in constant time against PAYMENT_WEBHOOK_SECRET. Invalid -> 401.
 * - We NEVER trust amounts/credits from the payload — fulfillment relies solely
 *   on our stored payment row, via the SECURITY DEFINER RPCs confirm_payment /
 *   refund_payment (both atomic + idempotent).
 * - Fulfillment runs under a SERVICE-ROLE Supabase client created here from the
 *   service-role key (server-only; bypasses RLS so the RPCs' is_admin() guard is
 *   satisfied). The key is read from process.env and never logged.
 *
 * REQUIRED ENV VARS
 * - PAYMENT_WEBHOOK_SECRET     shared secret used to verify the signature
 * - SUPABASE_SERVICE_ROLE_KEY  server-only Supabase service-role key
 * - NEXT_PUBLIC_SUPABASE_URL   (or SUPABASE_URL) project URL
 * If PAYMENT_WEBHOOK_SECRET or the service-role key / URL are missing, the route
 * responds 503 (not configured) and processes nothing — inert without keys.
 *
 * REQUEST HEADER
 * - x-webhook-signature: hex or base64 HMAC-SHA256 digest of the raw body
 *   (adapters may map a provider-specific header into this one).
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhookSignature } from "@/lib/providers";

// Webhooks must run on the Node.js runtime (raw body + crypto) and never cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SIGNATURE_HEADER = "x-webhook-signature";

type NormalizedStatus = "paid" | "failed" | "expired" | "refunded";

interface NormalizedEvent {
  providerPaymentId?: string;
  ourPaymentId?: string;
  status: NormalizedStatus;
}

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);
}

/** Best-effort normalization of a raw payload into our event shape. */
function normalize(body: unknown): NormalizedEvent | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const status = b.status;
  if (status !== "paid" && status !== "failed" && status !== "expired" && status !== "refunded") return null;
  const ourPaymentId =
    (typeof b.ourPaymentId === "string" && b.ourPaymentId) ||
    (typeof b.our_payment_id === "string" && b.our_payment_id) ||
    undefined;
  const providerPaymentId =
    (typeof b.providerPaymentId === "string" && b.providerPaymentId) ||
    (typeof b.provider_payment_id === "string" && b.provider_payment_id) ||
    undefined;
  return { status, ourPaymentId: ourPaymentId || undefined, providerPaymentId: providerPaymentId || undefined };
}

export async function POST(req: Request): Promise<Response> {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  // Inert without keys: not configured -> 503, process nothing.
  if (!secret) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  if (!serviceKey || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  // Read the RAW body for signature verification before any parsing.
  const rawBody = await req.text();
  const signature = req.headers.get(SIGNATURE_HEADER);
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const event = normalize(parsed);
  if (!event) return NextResponse.json({ error: "unrecognized_event" }, { status: 400 });

  // Map provider -> our payment. Prefer our explicit reference; fall back to the
  // provider id stored on the payment row (moyasar_payment_id).
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let ourPaymentId = isUuid(event.ourPaymentId) ? event.ourPaymentId : undefined;
  if (!ourPaymentId && event.providerPaymentId) {
    const { data: row } = await supabase
      .from("payments")
      .select("id")
      .eq("moyasar_payment_id", event.providerPaymentId)
      .maybeSingle();
    const id = (row as { id?: string } | null)?.id;
    if (isUuid(id)) ourPaymentId = id;
  }
  if (!ourPaymentId) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });

  // Fulfillment relies on our stored payment only; never on payload amounts.
  // confirm_payment / refund_payment are atomic + idempotent.
  if (event.status === "paid") {
    const { error } = await supabase.rpc("confirm_payment", { p_payment_id: ourPaymentId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (event.status === "refunded") {
    const { error } = await supabase.rpc("refund_payment", { p_payment_id: ourPaymentId });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // failed / expired: mark the payment failed ONLY while still 'initiated'
    // (never override a paid/refunded outcome). payment_status has no 'expired'
    // member, so an expiry maps to 'failed'. Idempotent via the status filter.
    const { error } = await supabase
      .from("payments")
      .update({ status: "failed" })
      .eq("id", ourPaymentId)
      .eq("status", "initiated");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
