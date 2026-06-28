"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemPointsAction, adjustPointsAction } from "@/admin-actions";
import { useToast } from "@/components/Toast";

/** Loyalty: shows balance + staff redeem / adjust. 1000 pts = 50 SAR (products only). */
export function LoyaltyControls({ memberId, points, ar }: { memberId: string; points: number; ar: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [redeem, setRedeem] = useState("");
  const [adjust, setAdjust] = useState("");

  const sarValue = Math.round((points / 1000) * 50 * 100) / 100;

  const doRedeem = () =>
    start(async () => {
      const res = await redeemPointsAction(memberId, Number(redeem));
      if (!res.ok) {
        toast.error(res.error === "insufficient" ? (ar ? "النقاط غير كافية" : "Not enough points")
          : res.error === "bad_amount" ? (ar ? "أدخلي عددًا صحيحًا" : "Enter a valid amount")
          : ar ? "تعذّر الاستبدال" : "Redeem failed");
        return;
      }
      setRedeem("");
      toast.success(ar ? `تم استبدال النقاط بقيمة ${res.sar} ر.س` : `Redeemed for ${res.sar} SAR`);
      router.refresh();
    });

  const doAdjust = () =>
    start(async () => {
      const res = await adjustPointsAction(memberId, Number(adjust));
      if (!res.ok) { toast.error(ar ? "تعذّر التعديل" : "Adjust failed"); return; }
      setAdjust("");
      toast.success(ar ? "تم تعديل النقاط" : "Points adjusted");
      router.refresh();
    });

  const field = "w-24 rounded-md border border-outline px-2.5 py-1 text-caption";

  return (
    <section className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "نقاط الولاء" : "Loyalty points"}</h3>
        <span className="font-number text-lead text-primary-700">{points} {ar ? `· ${sarValue} ر.س` : `· ${sarValue} SAR`}</span>
      </div>
      <p className="text-caption text-status-full">{ar ? "كل 1000 نقطة = 50 ر.س رصيد على المنتجات والورش فقط." : "1000 points = 50 SAR credit on products & workshops only."}</p>

      <div className="flex flex-wrap items-center gap-2">
        <input type="number" min={1} value={redeem} onChange={(e) => setRedeem(e.target.value)} placeholder={ar ? "نقاط" : "points"} className={field} />
        <button type="button" disabled={pending || !redeem} onClick={doRedeem} className="rounded-pill bg-primary px-3 py-1.5 text-caption font-medium text-ink disabled:opacity-50">
          {ar ? "استبدال" : "Redeem"}
        </button>
        <span className="mx-1 text-outline">·</span>
        <input type="number" value={adjust} onChange={(e) => setAdjust(e.target.value)} placeholder={ar ? "± تعديل" : "± adjust"} className={field} />
        <button type="button" disabled={pending || !adjust} onClick={doAdjust} className="rounded-pill border border-outline px-3 py-1.5 text-caption text-primary-700 disabled:opacity-50">
          {ar ? "تعديل" : "Adjust"}
        </button>
      </div>
    </section>
  );
}
