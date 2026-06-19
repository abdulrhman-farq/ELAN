/**
 * External-service interfaces. Everything is MOCKED by default so the app runs
 * with zero configuration; real providers switch on automatically when their
 * env keys are present.
 */

// ---------------- Payments ----------------
export interface PaymentProvider {
  readonly name: string;
  createCheckout(input: { amountSar: number; description: string; refId: string; type: string }): Promise<{ checkoutUrl: string; paymentId: string }>;
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
