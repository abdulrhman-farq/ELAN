"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPromoCodeAction, setPromoCodeActiveAction } from "@/admin-actions";
import { fmtHalalas } from "@/lib/pricing";

type Promo = {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  per_member_limit: number | null;
  active: boolean;
  redemptions: number;
};

function describe(p: Promo, ar: boolean): string {
  return p.discount_type === "percentage"
    ? `${p.discount_value / 100}%`
    : `${fmtHalalas(p.discount_value, ar ? "ar" : "en")} ${ar ? "ر.س" : "SAR"}`;
}

export function PromoManager({ ar, promos }: { ar: boolean; promos: Promo[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ code: "", discountType: "percentage", value: "", startsAt: "", expiresAt: "", maxRedemptions: "", perMemberLimit: "" });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const field = "w-full rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      if (!f.code.trim() || !f.value.trim()) {
        setErr(ar ? "الكود والقيمة مطلوبان" : "Code and value required");
        return;
      }
      // percentage -> basis points (10% => 1000); fixed -> halalas (50 SAR => 5000)
      const num = Number(f.value);
      const discountValue = f.discountType === "percentage" ? Math.round(num * 100) : Math.round(num * 100);
      const res = await createPromoCodeAction({
        code: f.code,
        discountType: f.discountType as "percentage" | "fixed",
        discountValue,
        startsAt: f.startsAt || undefined,
        expiresAt: f.expiresAt || undefined,
        maxRedemptions: f.maxRedemptions ? Number(f.maxRedemptions) : undefined,
        perMemberLimit: f.perMemberLimit ? Number(f.perMemberLimit) : undefined,
      });
      if (!res.ok) {
        setErr(res.error === "code_required" ? (ar ? "الكود مطلوب" : "Code required") : ar ? "تعذّر الإنشاء (قد يكون الكود مكرّرًا)" : "Couldn't create (code may exist)");
        return;
      }
      setF({ code: "", discountType: "percentage", value: "", startsAt: "", expiresAt: "", maxRedemptions: "", perMemberLimit: "" });
      router.refresh();
    });

  const toggle = (p: Promo) =>
    start(async () => {
      await setPromoCodeActiveAction(p.id, !p.active);
      router.refresh();
    });

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="mb-4 font-display text-lead font-medium text-primary-900">{ar ? "إنشاء كود خصم" : "Create promo code"}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={lab}>{ar ? "الكود" : "Code"}</label>
            <input value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="WELCOME10" className={field} />
          </div>
          <div>
            <label className={lab}>{ar ? "نوع الخصم" : "Type"}</label>
            <select value={f.discountType} onChange={(e) => set("discountType", e.target.value)} className={field}>
              <option value="percentage">{ar ? "نسبة %" : "Percentage %"}</option>
              <option value="fixed">{ar ? "مبلغ ثابت (ر.س)" : "Fixed (SAR)"}</option>
            </select>
          </div>
          <div>
            <label className={lab}>{f.discountType === "percentage" ? (ar ? "النسبة %" : "Percent %") : ar ? "المبلغ (ر.س)" : "Amount (SAR)"}</label>
            <input dir="ltr" value={f.value} onChange={(e) => set("value", e.target.value)} className={field} inputMode="decimal" />
          </div>
          <div>
            <label className={lab}>{ar ? "يبدأ" : "Starts"}</label>
            <input type="date" value={f.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={field} />
          </div>
          <div>
            <label className={lab}>{ar ? "ينتهي" : "Expires"}</label>
            <input type="date" value={f.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} className={field} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className={lab}>{ar ? "حد الاستخدام" : "Max uses"}</label>
              <input dir="ltr" value={f.maxRedemptions} onChange={(e) => set("maxRedemptions", e.target.value)} className={field} inputMode="numeric" />
            </div>
            <div className="flex-1">
              <label className={lab}>{ar ? "لكل عميلة" : "Per member"}</label>
              <input dir="ltr" value={f.perMemberLimit} onChange={(e) => set("perMemberLimit", e.target.value)} className={field} inputMode="numeric" />
            </div>
          </div>
        </div>
        {err ? <p className="mt-3 text-meta text-danger" role="alert">{err}</p> : null}
        <button disabled={pending} onClick={submit} className="btn-primary mt-4 disabled:opacity-50">
          {pending ? (ar ? "جارٍ…" : "Saving…") : ar ? "إنشاء" : "Create"}
        </button>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 font-display text-lead font-medium text-primary-900">{ar ? "الأكواد" : "Codes"}</h2>
        {promos.length === 0 ? (
          <p className="py-2 text-body text-status-full">{ar ? "لا توجد أكواد بعد." : "No promo codes yet."}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full text-body">
              <thead>
                <tr className="border-b border-outline text-start text-caption text-status-full">
                  <th className="py-2 text-start">{ar ? "الكود" : "Code"}</th>
                  <th className="py-2 text-start">{ar ? "الخصم" : "Discount"}</th>
                  <th className="py-2 text-start">{ar ? "الصلاحية" : "Window"}</th>
                  <th className="py-2 text-start">{ar ? "الاستخدام" : "Uses"}</th>
                  <th className="py-2 text-start">{ar ? "الحالة" : "Status"}</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id} className="border-b border-outline last:border-0">
                    <td className="py-3 font-display text-primary-900">{p.code}</td>
                    <td className="py-3 font-number text-status-full">{describe(p, ar)}</td>
                    <td className="py-3 font-number text-caption text-status-full">
                      {(p.starts_at?.slice(0, 10) ?? "—") + " → " + (p.expires_at?.slice(0, 10) ?? "∞")}
                    </td>
                    <td className="py-3 font-number text-status-full">
                      {p.redemptions}
                      {p.max_redemptions != null ? ` / ${p.max_redemptions}` : ""}
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => toggle(p)}
                        disabled={pending}
                        className={`rounded-pill px-3 py-1 text-caption ${p.active ? "bg-sage/15 text-sage" : "bg-surface-variant text-status-full"}`}
                      >
                        {p.active ? (ar ? "فعّال — إيقاف" : "Active — disable") : ar ? "موقوف — تفعيل" : "Off — enable"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
