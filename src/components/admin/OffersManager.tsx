"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setCreditPackOffersAction, setMembershipPlanOffersAction, setMembershipPlanRolloverAction } from "@/admin-actions";
import { useToast } from "@/components/Toast";

export interface OfferPack {
  id: string;
  name_ar: string;
  name_en: string;
  price_sar: number;
  credits: number;
  active: boolean;
  first_time_only: boolean;
}

export interface OfferPlan {
  id: string;
  name_ar: string;
  name_en: string;
  price_sar: number;
  active: boolean;
  featured: boolean;
  first_time_only: boolean;
  rollover_max: number;
  classes_per_period: number;
}

function Toggle({ on, label, pending, onClick }: { on: boolean; label: string; pending: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={pending}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 text-caption transition disabled:opacity-50 ${
        on ? "border-primary-700 bg-primary-700/10 text-primary-700" : "border-outline text-status-full"
      }`}
    >
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${on ? "bg-primary-700" : "bg-outline"}`} />
      {label}
    </button>
  );
}

function RolloverInput({ plan, ar, pending, onSave }: { plan: OfferPlan; ar: boolean; pending: boolean; onSave: (max: number) => void }) {
  const [val, setVal] = useState(String(plan.rollover_max ?? 0));
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-caption text-status-full">{ar ? "ترحيل (حد)" : "Rollover cap"}</span>
      <input type="number" min={0} value={val} onChange={(e) => setVal(e.target.value)}
        className="w-16 rounded-md border border-outline px-2 py-1 text-caption" />
      <button type="button" disabled={pending} onClick={() => onSave(Number(val))}
        className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700 disabled:opacity-50">
        {ar ? "حفظ" : "Save"}
      </button>
    </div>
  );
}

export function OffersManager({ ar, packs, plans }: { ar: boolean; packs: OfferPack[]; plans: OfferPlan[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) { toast.error(ar ? "تعذّر الحفظ" : "Save failed"); return; }
      toast.success(ar ? "تم التحديث" : "Updated");
      router.refresh();
    });

  const L = {
    active: ar ? "مفعّلة" : "Active",
    featured: ar ? "الأكثر شيوعًا" : "Featured",
    intro: ar ? "للزيارة الأولى" : "First-visit only",
    plans: ar ? "العضويات" : "Membership plans",
    packs: ar ? "باقات الرصيد" : "Credit packs",
    sar: ar ? "ر.س" : "SAR",
    credits: ar ? "حصص" : "credits",
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-lead font-medium text-primary-900">{L.plans}</h2>
        <div className="space-y-2">
          {plans.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                <p className="font-number text-caption text-status-full">{p.price_sar} {L.sar}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle on={p.active} label={L.active} pending={pending}
                  onClick={() => run(() => setMembershipPlanOffersAction(p.id, { active: !p.active }))} />
                <Toggle on={p.featured} label={L.featured} pending={pending}
                  onClick={() => run(() => setMembershipPlanOffersAction(p.id, { featured: !p.featured }))} />
                <Toggle on={p.first_time_only} label={L.intro} pending={pending}
                  onClick={() => run(() => setMembershipPlanOffersAction(p.id, { first_time_only: !p.first_time_only }))} />
                {p.classes_per_period < 9999 ? (
                  <RolloverInput plan={p} ar={ar} pending={pending}
                    onSave={(max) => run(() => setMembershipPlanRolloverAction(p.id, max))} />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lead font-medium text-primary-900">{L.packs}</h2>
        <div className="space-y-2">
          {packs.map((p) => (
            <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium text-primary-900">{ar ? p.name_ar : p.name_en}</p>
                <p className="font-number text-caption text-status-full">{p.price_sar} {L.sar} · {p.credits} {L.credits}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Toggle on={p.active} label={L.active} pending={pending}
                  onClick={() => run(() => setCreditPackOffersAction(p.id, { active: !p.active }))} />
                <Toggle on={p.first_time_only} label={L.intro} pending={pending}
                  onClick={() => run(() => setCreditPackOffersAction(p.id, { first_time_only: !p.first_time_only }))} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
