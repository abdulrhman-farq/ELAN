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

/**
 * Credits a payment may apply to the ledger. Single source of truth for the
 * rule "credits are granted ONLY for a paid payment" — a pending/initiated,
 * failed, or refunded payment grants nothing.
 */
export function creditsGrantedFor(status: string, credits: number): number {
  return status === "paid" ? Math.max(0, Math.floor(credits || 0)) : 0;
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
