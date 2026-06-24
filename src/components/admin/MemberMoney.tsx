"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sellPackageAction, compBookingAction, applyBookingDiscountAction } from "@/admin-actions";

/** Bundle presets — canonical ÉLAN model (net halalas, 150 SAR/class list). Prices editable by admin. */
const BUNDLES: { key: string; ar: string; en: string; credits: number; netHalalas: number }[] = [
  { key: "single", ar: "حصة مفردة", en: "Single class", credits: 1, netHalalas: 15000 },
  { key: "pack8", ar: "باقة 8 حصص", en: "8-class pack", credits: 8, netHalalas: 112000 },
  { key: "pack12", ar: "باقة 12 حصة", en: "12-class pack", credits: 12, netHalalas: 156000 },
];

export function SellBundleDialog({ memberId, ar }: { memberId: string; ar: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [bundle, setBundle] = useState("pack8");
  const preset = BUNDLES.find((b) => b.key === bundle) ?? BUNDLES[0];
  const [credits, setCredits] = useState(String(preset.credits));
  const [netSar, setNetSar] = useState(String(preset.netHalalas / 100));
  const [discountType, setDiscountType] = useState("none");
  const [discountVal, setDiscountVal] = useState("");
  const [promo, setPromo] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [payStatus, setPayStatus] = useState("paid");
  const [method, setMethod] = useState("cash");

  const pick = (key: string) => {
    const b = BUNDLES.find((x) => x.key === key) ?? BUNDLES[0];
    setBundle(key);
    setCredits(String(b.credits));
    setNetSar(String(b.netHalalas / 100));
  };

  const field = "w-full rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      const value = discountType === "percentage" ? Math.round(Number(discountVal || 0) * 100) : Math.round(Number(discountVal || 0) * 100);
      const res = await sellPackageAction(memberId, {
        credits: Number(credits),
        baseNetHalalas: Math.round(Number(netSar) * 100),
        discountType: discountType as "none" | "percentage" | "fixed" | "promo_code",
        discountValue: discountType === "none" || discountType === "promo_code" ? undefined : value,
        promoCode: discountType === "promo_code" ? promo : undefined,
        startsAt: startsAt || undefined,
        paymentStatus: payStatus as "paid" | "pending",
        method,
      });
      if (!res.ok) {
        setErr(ar ? `تعذّر البيع: ${res.error}` : `Sale failed: ${res.error}`);
        return;
      }
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">{ar ? "بيع باقة / حصص" : "Sell bundle"}</button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center md:p-4" role="dialog" aria-modal="true" onClick={() => !pending && setOpen(false)}>
          <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-md space-y-4 rounded-t-xl bg-surface-elevated p-6 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "بيع باقة للعميلة" : "Sell a bundle"}</h2>
            <div>
              <label className={lab}>{ar ? "الباقة" : "Bundle"}</label>
              <select value={bundle} onChange={(e) => pick(e.target.value)} className={field}>
                {BUNDLES.map((b) => (
                  <option key={b.key} value={b.key}>{ar ? b.ar : b.en}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "عدد الحصص" : "Credits"}</label>
                <input dir="ltr" value={credits} onChange={(e) => setCredits(e.target.value)} className={field} inputMode="numeric" />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "الصافي (ر.س)" : "Net (SAR)"}</label>
                <input dir="ltr" value={netSar} onChange={(e) => setNetSar(e.target.value)} className={field} inputMode="decimal" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "خصم" : "Discount"}</label>
                <select value={discountType} onChange={(e) => setDiscountType(e.target.value)} className={field}>
                  <option value="none">{ar ? "بدون" : "None"}</option>
                  <option value="percentage">{ar ? "نسبة %" : "Percent %"}</option>
                  <option value="fixed">{ar ? "مبلغ ثابت" : "Fixed"}</option>
                  <option value="promo_code">{ar ? "كود خصم" : "Promo code"}</option>
                </select>
              </div>
              <div className="flex-1">
                {discountType === "promo_code" ? (
                  <>
                    <label className={lab}>{ar ? "الكود" : "Code"}</label>
                    <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} className={field} />
                  </>
                ) : discountType !== "none" ? (
                  <>
                    <label className={lab}>{discountType === "percentage" ? "%" : ar ? "ر.س" : "SAR"}</label>
                    <input dir="ltr" value={discountVal} onChange={(e) => setDiscountVal(e.target.value)} className={field} inputMode="decimal" />
                  </>
                ) : null}
              </div>
            </div>
            <div>
              <label className={lab}>{ar ? "تاريخ بداية الباقة" : "Bundle start date"}</label>
              <input type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className={field} />
              <p className="mt-1 text-caption text-status-full">{ar ? "اتركيه فارغاً = يبدأ اليوم. يمكن اختيار تاريخ مستقبلي." : "Empty = starts today. A future date is allowed."}</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "حالة الدفع" : "Payment status"}</label>
                <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)} className={field}>
                  <option value="paid">{ar ? "مدفوع" : "Paid"}</option>
                  <option value="pending">{ar ? "معلّق (غير مدفوع)" : "Pending"}</option>
                </select>
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "طريقة الدفع" : "Payment method"}</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
                  <option value="cash">{ar ? "نقد" : "Cash"}</option>
                  <option value="mada">{ar ? "مدى" : "Mada"}</option>
                  <option value="transfer">{ar ? "تحويل" : "Transfer"}</option>
                  <option value="online">{ar ? "أونلاين" : "Online"}</option>
                  <option value="other">{ar ? "أخرى" : "Other"}</option>
                </select>
              </div>
            </div>
            <p className="text-caption text-status-full">
              {ar ? "تُضاف الضريبة 15% فوق الصافي بعد الخصم. «معلّق» لا يُحتسب في الإيراد حتى يُدفع." : "VAT 15% on net after discount. Pending sales aren't counted in revenue until paid."}
            </p>
            {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}
            <div className="flex gap-2 pt-1">
              <button disabled={pending} onClick={submit} className="btn-primary flex-1 disabled:opacity-50">{pending ? "…" : ar ? "تأكيد البيع" : "Confirm sale"}</button>
              <button disabled={pending} onClick={() => setOpen(false)} className="btn-outline flex-1">{ar ? "إلغاء" : "Cancel"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Compact comp / percentage-discount controls on a single booking row. */
export function BookingMoneyControls({ bookingId, ar }: { bookingId: string; ar: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showDisc, setShowDisc] = useState(false);
  const [pct, setPct] = useState("10");

  const comp = () =>
    start(async () => {
      await compBookingAction(bookingId, "comp");
      router.refresh();
    });
  const discount = () =>
    start(async () => {
      await applyBookingDiscountAction(bookingId, { discountType: "percentage", discountValue: Math.round(Number(pct || 0) * 100) });
      setShowDisc(false);
      router.refresh();
    });

  return (
    <div className="flex items-center gap-1.5">
      {showDisc ? (
        <>
          <input dir="ltr" value={pct} onChange={(e) => setPct(e.target.value)} className="w-12 rounded-md border border-outline bg-surface-container px-2 py-1 text-caption" inputMode="decimal" />
          <button disabled={pending} onClick={discount} className="rounded-pill bg-primary px-2.5 py-1 text-caption text-ink">%</button>
          <button onClick={() => setShowDisc(false)} className="text-caption text-status-full">×</button>
        </>
      ) : (
        <>
          <button disabled={pending} onClick={() => setShowDisc(true)} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700">{ar ? "خصم" : "Disc."}</button>
          <button disabled={pending} onClick={comp} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700">{ar ? "مجانية" : "Comp"}</button>
        </>
      )}
    </div>
  );
}
