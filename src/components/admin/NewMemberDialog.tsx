"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMemberAction, sellPackageAction } from "@/admin-actions";
import { ClassQuiz } from "@/components/admin/ClassQuiz";
import { CLASS_INFO, type ClassRec } from "@/lib/quiz";

const STATUSES: { v: string; ar: string; en: string }[] = [
  { v: "lead", ar: "مهتمة", en: "Lead" },
  { v: "trial", ar: "تجريبية", en: "Trial" },
  { v: "active", ar: "نشطة", en: "Active" },
  { v: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

/** Bundle presets — canonical ÉLAN model (net halalas, 150 SAR/class list). */
const BUNDLES: { v: string; ar: string; en: string; credits: number; netHalalas: number }[] = [
  { v: "none", ar: "بدون باقة", en: "No bundle", credits: 0, netHalalas: 0 },
  { v: "single", ar: "حصة مفردة", en: "Single class", credits: 1, netHalalas: 15000 },
  { v: "pack8", ar: "باقة 8 حصص", en: "8-class pack", credits: 8, netHalalas: 112000 },
  { v: "pack12", ar: "باقة 12 حصة", en: "12-class pack", credits: 12, netHalalas: 156000 },
];

export function NewMemberDialog({ ar }: { ar: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ full_name: "", phone: "", email: "", source: "", lead_status: "lead" });
  const [bundle, setBundle] = useState("none");
  const [showQuiz, setShowQuiz] = useState(false);
  const [rec, setRec] = useState<ClassRec | "">("");
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const field = "w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      const res = await createMemberAction({ ...f, recommended_class: rec || undefined });
      if (!res.ok) {
        setErr(res.error === "name_required" ? (ar ? "الاسم مطلوب" : "Name is required") : ar ? "تعذّر الحفظ — تأكدي من صلاحية الدخول" : "Couldn't save — check you're signed in as admin");
        return;
      }
      const b = BUNDLES.find((x) => x.v === bundle);
      if (b && b.credits > 0) {
        const sale = await sellPackageAction(res.id, { credits: b.credits, baseNetHalalas: b.netHalalas, discountType: "none" });
        if (!sale.ok) {
          setErr(ar ? "أُنشئت العميلة لكن تعذّر تسجيل الباقة." : "Client created but bundle sale failed.");
          router.refresh();
          return;
        }
      }
      setF({ full_name: "", phone: "", email: "", source: "", lead_status: "lead" });
      setBundle("none");
      setRec("");
      setShowQuiz(false);
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 text-sm font-semibold text-ink"
      >
        {ar ? "+ عميلة جديدة" : "+ New client"}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            dir={ar ? "rtl" : "ltr"}
            className="w-full max-w-md space-y-4 rounded-t-xl bg-surface-elevated p-6 md:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "تسجيل عميلة جديدة" : "Register new client"}</h2>

            <div>
              <label className={lab}>{ar ? "الاسم الكامل" : "Full name"} *</label>
              <input autoFocus value={f.full_name} onChange={(e) => set("full_name", e.target.value)} className={field} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "الجوال" : "Phone"}</label>
                <input dir="ltr" value={f.phone} onChange={(e) => set("phone", e.target.value)} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "البريد" : "Email"}</label>
                <input dir="ltr" value={f.email} onChange={(e) => set("email", e.target.value)} className={field} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={lab}>{ar ? "المصدر" : "Source"}</label>
                <input value={f.source} onChange={(e) => set("source", e.target.value)} placeholder={ar ? "إنستغرام، توصية…" : "Instagram, referral…"} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "الحالة" : "Status"}</label>
                <select value={f.lead_status} onChange={(e) => set("lead_status", e.target.value)} className={field}>
                  {STATUSES.map((s) => (
                    <option key={s.v} value={s.v}>{ar ? s.ar : s.en}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={lab}>{ar ? "الكلاس المناسب (اختبار قصير)" : "Class fit (quick quiz)"}</label>
              {rec ? (
                <div className="flex items-center justify-between gap-2 rounded-md border border-accent/40 bg-surface-variant/40 px-3 py-2.5">
                  <span className="text-body text-primary-900">{ar ? "المنصوح: " : "Recommended: "}<span className="font-medium">{CLASS_INFO[rec].name_ar}</span></span>
                  <button type="button" onClick={() => { setRec(""); setShowQuiz(true); }} className="text-meta text-primary-700 underline">{ar ? "إعادة" : "Redo"}</button>
                </div>
              ) : showQuiz ? (
                <ClassQuiz onResult={(r) => { setRec(r); setShowQuiz(false); }} />
              ) : (
                <button type="button" onClick={() => setShowQuiz(true)} className="w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-700 hover:border-accent">
                  {ar ? "ابدئي اختبار الكلاس المناسب" : "Start the class-fit quiz"}
                </button>
              )}
            </div>

            <div>
              <label className={lab}>{ar ? "الباقة (تُحتسب ضمن الإيراد)" : "Bundle (counts in revenue)"}</label>
              <select value={bundle} onChange={(e) => setBundle(e.target.value)} className={field}>
                {BUNDLES.map((b) => (
                  <option key={b.v} value={b.v}>
                    {(ar ? b.ar : b.en) + (b.netHalalas ? ` — ${(b.netHalalas / 100).toLocaleString(ar ? "ar-SA" : "en-US")} ${ar ? "ر.س صافي" : "SAR net"}` : "")}
                  </option>
                ))}
              </select>
            </div>

            {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}

            <div className="flex gap-2 pt-1">
              <button disabled={pending} onClick={submit} className="btn-primary flex-1 disabled:opacity-50">
                {pending ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ" : "Save"}
              </button>
              <button disabled={pending} onClick={() => setOpen(false)} className="btn-outline flex-1 disabled:opacity-50">
                {ar ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
