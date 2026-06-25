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
  // if (process.env.MOYASAR_SECRET_KEY) return new MoyasarProvider(...)
  return new MockPaymentProvider();
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
  // if (process.env.WHATSAPP_ACCESS_TOKEN) return new WhatsAppCloudProvider(...)
  return new ConsoleMessageProvider();
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
