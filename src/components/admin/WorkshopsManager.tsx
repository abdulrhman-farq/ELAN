"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkshopAction,
  setWorkshopActiveAction,
  setWorkshopRegistrationStatusAction,
} from "@/admin-actions";
import { fmtHalalas } from "@/lib/pricing";
import { fmtLongDateTime } from "@/lib/format";
import { useToast } from "@/components/Toast";
import type { AdminWorkshop } from "@/lib/admin";

export function WorkshopsManager({
  ar, workshops, instructors,
}: {
  ar: boolean;
  workshops: AdminWorkshop[];
  instructors: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const blank = { title_ar: "", title_en: "", starts_at: "", ends_at: "", capacity: "12", price_sar: "250", instructor_id: "", location: "", description_ar: "", description_en: "" };
  const [f, setF] = useState(blank);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  const field = "w-full rounded-md border border-outline bg-surface-container px-3 py-2.5 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const create = () =>
    start(async () => {
      setErr(null);
      if (!f.title_ar.trim() || !f.title_en.trim()) { setErr(ar ? "العنوان مطلوب" : "Title required"); return; }
      if (!f.starts_at || !f.ends_at) { setErr(ar ? "التاريخ مطلوب" : "Dates required"); return; }
      const res = await createWorkshopAction({
        title_ar: f.title_ar, title_en: f.title_en,
        description_ar: f.description_ar, description_en: f.description_en,
        starts_at: new Date(f.starts_at).toISOString(),
        ends_at: new Date(f.ends_at).toISOString(),
        capacity: Number(f.capacity), price_sar: Number(f.price_sar),
        instructor_id: f.instructor_id || undefined, location: f.location || undefined,
      });
      if (!res.ok) { setErr(ar ? "تعذّر الإنشاء" : "Couldn't create"); return; }
      toast.success(ar ? "تم إنشاء الورشة" : "Workshop created");
      setF(blank);
      router.refresh();
    });

  const run = (fn: () => Promise<{ ok: boolean }>, okMsg: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) { toast.error(ar ? "تعذّر الحفظ" : "Save failed"); return; }
      toast.success(okMsg);
      router.refresh();
    });

  const statusLabel = (s: string) =>
    ({ registered: ar ? "مسجّلة" : "Registered", attended: ar ? "حضرت" : "Attended", no_show: ar ? "لم تحضر" : "No-show", cancelled: ar ? "ملغاة" : "Cancelled" } as Record<string, string>)[s] ?? s;
  const payLabel = (s: string) =>
    ({ unpaid: ar ? "غير مدفوع" : "Unpaid", paid: ar ? "مدفوع" : "Paid", refunded: ar ? "مُسترجع" : "Refunded" } as Record<string, string>)[s] ?? s;

  return (
    <div className="space-y-8">
      {/* Create */}
      <section className="card space-y-3 p-5">
        <h2 className="font-display text-lead font-medium text-primary-900">{ar ? "ورشة جديدة" : "New workshop"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><label className={lab}>{ar ? "العنوان (عربي)" : "Title (AR)"}</label><input className={field} value={f.title_ar} onChange={(e) => set("title_ar", e.target.value)} /></div>
          <div><label className={lab}>{ar ? "العنوان (إنجليزي)" : "Title (EN)"}</label><input className={field} value={f.title_en} onChange={(e) => set("title_en", e.target.value)} /></div>
          <div><label className={lab}>{ar ? "البداية" : "Starts"}</label><input type="datetime-local" className={field} value={f.starts_at} onChange={(e) => set("starts_at", e.target.value)} /></div>
          <div><label className={lab}>{ar ? "النهاية" : "Ends"}</label><input type="datetime-local" className={field} value={f.ends_at} onChange={(e) => set("ends_at", e.target.value)} /></div>
          <div><label className={lab}>{ar ? "عدد المقاعد" : "Capacity"}</label><input type="number" min={1} className={field} value={f.capacity} onChange={(e) => set("capacity", e.target.value)} /></div>
          <div><label className={lab}>{ar ? "السعر (شامل الضريبة)" : "Price (incl. VAT)"}</label><input type="number" min={0} className={field} value={f.price_sar} onChange={(e) => set("price_sar", e.target.value)} /></div>
          <div>
            <label className={lab}>{ar ? "المدرّبة" : "Instructor"}</label>
            <select className={field} value={f.instructor_id} onChange={(e) => set("instructor_id", e.target.value)}>
              <option value="">{ar ? "بدون" : "None"}</option>
              {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div><label className={lab}>{ar ? "المكان" : "Location"}</label><input className={field} value={f.location} onChange={(e) => set("location", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lab}>{ar ? "الوصف (عربي)" : "Description (AR)"}</label><textarea className={field} rows={2} value={f.description_ar} onChange={(e) => set("description_ar", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={lab}>{ar ? "الوصف (إنجليزي)" : "Description (EN)"}</label><textarea className={field} rows={2} value={f.description_en} onChange={(e) => set("description_en", e.target.value)} /></div>
        </div>
        {err ? <p className="text-meta text-danger">{err}</p> : null}
        <button type="button" disabled={pending} onClick={create} className="rounded-pill bg-primary-700 px-5 py-2.5 text-body text-white disabled:opacity-50">
          {ar ? "إنشاء الورشة" : "Create workshop"}
        </button>
      </section>

      {/* List */}
      <section className="space-y-4">
        {workshops.length === 0 ? (
          <p className="card p-6 text-center text-status-full">{ar ? "لا توجد ورش." : "No workshops yet."}</p>
        ) : workshops.map((w) => (
          <div key={w.id} className="card space-y-3 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-lead font-medium text-primary-900">{ar ? w.title_ar : w.title_en}</p>
                <p className="text-meta text-status-full">
                  {fmtLongDateTime(w.starts_at, w.ends_at, ar ? "ar" : "en")} · {fmtHalalas(w.price_gross_halalas, ar ? "ar" : "en")} {ar ? "ر.س" : "SAR"} · {w.registered_count}/{w.capacity}
                </p>
              </div>
              <button type="button" disabled={pending}
                onClick={() => run(() => setWorkshopActiveAction(w.id, !w.active), ar ? "تم التحديث" : "Updated")}
                className={`rounded-pill border px-3 py-1.5 text-caption disabled:opacity-50 ${w.active ? "border-primary-700 bg-primary-700/10 text-primary-700" : "border-outline text-status-full"}`}>
                {w.active ? (ar ? "ظاهرة" : "Active") : (ar ? "مخفية" : "Hidden")}
              </button>
            </div>

            {w.registrations.length > 0 ? (
              <div className="divide-y divide-outline border-t border-outline">
                {w.registrations.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-body text-primary-900">{r.member_name}</p>
                      <p className="truncate text-caption text-status-full">{r.member_phone ?? ""} · {statusLabel(r.status)} · {payLabel(r.payment_status)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button type="button" disabled={pending} onClick={() => run(() => setWorkshopRegistrationStatusAction(r.id, { payment_status: r.payment_status === "paid" ? "unpaid" : "paid" }), ar ? "تم" : "Done")}
                        className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700 disabled:opacity-50">
                        {r.payment_status === "paid" ? (ar ? "إلغاء الدفع" : "Mark unpaid") : (ar ? "تحديد مدفوع" : "Mark paid")}
                      </button>
                      <button type="button" disabled={pending} onClick={() => run(() => setWorkshopRegistrationStatusAction(r.id, { status: "attended" }), ar ? "تم" : "Done")}
                        className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700 disabled:opacity-50">
                        {ar ? "حضرت" : "Attended"}
                      </button>
                      <button type="button" disabled={pending} onClick={() => run(() => setWorkshopRegistrationStatusAction(r.id, { status: "no_show" }), ar ? "تم" : "Done")}
                        className="rounded-pill border border-outline px-2.5 py-1 text-caption text-danger disabled:opacity-50">
                        {ar ? "لم تحضر" : "No-show"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="border-t border-outline pt-2 text-caption text-status-full">{ar ? "لا تسجيلات بعد." : "No registrations yet."}</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
