/**
 * External-service interfaces. Everything is MOCKED by default so the app runs
 * with zero configuration; real providers switch on automatically when their
 * env keys are present.
 */

import crypto from "node:crypto";

// ---------------- Payments ----------------
// A PaymentProvider abstracts a real gateway (Moyasar / Stripe / Tap …). The
// MockPaymentProvider below is for DEMO only (instant fake success). A real
// provider additionally pushes asynchronous status updates via a webhook; that
// flow is handled provider-agnostically in src/app/api/payments/webhook/route.ts,
// which normalizes each gateway's payload into a common event and verifies it
// with verifyWebhookSignature() below.
export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: { amountSar: number; description: string; refId: string; type: string }): Promise<{ checkoutUrl: string; paymentId: string }>;
}

/**
 * Verify a gateway webhook HMAC signature (SHA-256) in constant time.
 *
 * Real gateways sign the raw request body with a shared secret and send the
 * hex/base64 digest in a header. We recompute the HMAC over the EXACT raw bytes
 * and compare with crypto.timingSafeEqual to avoid leaking timing information.
 *
 * Accepts either a hex digest or a base64 digest (some providers use base64).
 * Returns false on any malformed input rather than throwing.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const sig = signature.trim().replace(/^sha256=/i, "");
  const mac = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest();

  // Try to interpret the provided signature as hex, then base64.
  const candidates: Buffer[] = [];
  if (/^[0-9a-fA-F]+$/.test(sig) && sig.length % 2 === 0) {
    try { candidates.push(Buffer.from(sig, "hex")); } catch { /* ignore */ }
  }
  try { candidates.push(Buffer.from(sig, "base64")); } catch { /* ignore */ }

  for (const provided of candidates) {
    if (provided.length === mac.length && crypto.timingSafeEqual(provided, mac)) return true;
  }
  return false;
}

class MockPaymentProvider implements PaymentProvider {
  name = "mock";
  async createCheckout(input: { refId: string; type: string }) {
    // Instant fake success — the UI fulfills via the simulate_purchase RPC.
    return { checkoutUrl: `/memberships?paid=1&ref=${input.refId}`, paymentId: `mock_${input.type}_${input.refId}` };
  }
}

export function getPaymentProvider(): PaymentProvider {
  if (process.env.MOYASAR_SECRET_KEY) return new MoyasarProvider();
  return new MockPaymentProvider();
}

/** Moyasar checkout — activated when MOYASAR_SECRET_KEY is set. */
class MoyasarProvider implements PaymentProvider {
  name = "moyasar";
  async createCheckout(input: { amountSar: number; description: string; refId: string; type: string }) {
    const secret = process.env.MOYASAR_SECRET_KEY!;
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const amountHalalas = Math.round(input.amountSar * 100);
    const res = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${secret}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency: "SAR",
        description: input.description,
        callback_url: `${site}/memberships?paid=1&ref=${input.refId}`,
        metadata: { ref_id: input.refId, type: input.type },
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Moyasar invoice failed (${res.status}): ${body}`);
    }
    const data = (await res.json()) as { url?: string; id?: string };
    if (!data.url || !data.id) throw new Error("Moyasar response missing url/id");
    return { checkoutUrl: data.url, paymentId: data.id };
  }
}

// ---------------- Messaging (WhatsApp / SMS) ----------------
export interface MessageProvider {
  readonly name: string;
  send(input: { to: string; template: string; locale: string; vars: Record<string, unknown> }): Promise<{ status: "sent" | "skipped" }>;
}

class ConsoleMessageProvider implements MessageProvider {
  name = "console";
  async send(input: { to: string; template: string; locale: string; vars: Record<string, unknown> }) {
    console.info("[message:console]", JSON.stringify(input));
    return { status: "sent" as const };
  }
}

export function getMessageProvider(): MessageProvider {
  if (process.env.WHATSAPP_ACCESS_TOKEN) return new WhatsAppCloudProvider();
  return new ConsoleMessageProvider();
}

class WhatsAppCloudProvider implements MessageProvider {
  name = "whatsapp";
  async send(input: { to: string; template: string; locale: string; vars: Record<string, unknown> }) {
    const token = process.env.WHATSAPP_ACCESS_TOKEN!;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    const res = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to.replace(/\D/g, ""),
        type: "template",
        template: { name: input.template, language: { code: input.locale === "ar" ? "ar" : "en" } },
      }),
    });
    if (!res.ok) {
      console.error("[whatsapp] send failed", await res.text().catch(() => ""));
      return { status: "skipped" as const };
    }
    return { status: "sent" as const };
  }
}

// ---------------- Email (Resend) ----------------
export interface EmailProvider {
  readonly name: string;
  send(input: { to: string; subject: string; html: string }): Promise<{ status: "sent" | "skipped" }>;
}

class ConsoleEmailProvider implements EmailProvider {
  name = "console";
  async send(input: { to: string; subject: string; html: string }) {
    console.info("[email:console]", input.to, input.subject);
    return { status: "sent" as const };
  }
}

class ResendEmailProvider implements EmailProvider {
  name = "resend";
  async send(input: { to: string; subject: string; html: string }) {
    const key = process.env.RESEND_API_KEY!;
    const from = process.env.RESEND_FROM ?? "ÉLAN <onboarding@resend.dev>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
    });
    if (!res.ok) {
      console.error("[resend] send failed", await res.text().catch(() => ""));
      return { status: "skipped" as const };
    }
    return { status: "sent" as const };
  }
}

export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY) return new ResendEmailProvider();
  return new ConsoleEmailProvider();
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export function isPaymentGatewayConfigured(): boolean {
  return Boolean(process.env.MOYASAR_SECRET_KEY);
}

export function isMessagingConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

// ---------------- Invoicing (ZATCA simplified tax invoice) ----------------
export interface InvoiceProvider {
  readonly name: string;
  generate(input: { amountSar: number; taxPct: number; buyer: string; description: string }): Promise<{
    number: string; subtotalSar: number; vatSar: number; totalSar: number; qr: string;
  }>;
}

class MockInvoiceProvider implements InvoiceProvider {
  name = "mock";
  async generate(input: { amountSar: number; taxPct: number }) {
    const total = input.amountSar;
    const vat = +(total - total / (1 + input.taxPct / 100)).toFixed(2);
    return {
      number: `ELAN-${Date.now().toString(36).toUpperCase()}`,
      subtotalSar: +(total - vat).toFixed(2),
      vatSar: vat,
      totalSar: total,
      // Placeholder for the ZATCA TLV/base64 QR until a real provider is wired.
      qr: Buffer.from(`ELAN|${total}|${vat}`).toString("base64"),
    };
  }
}

export function getInvoiceProvider(): InvoiceProvider {
  return new MockInvoiceProvider();
}
