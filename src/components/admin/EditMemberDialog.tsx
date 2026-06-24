"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateMemberAction } from "@/admin-actions";

const STATUSES: { v: string; ar: string; en: string }[] = [
  { v: "lead", ar: "مهتمة", en: "Lead" },
  { v: "trial", ar: "تجريبية", en: "Trial" },
  { v: "active", ar: "نشطة", en: "Active" },
  { v: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

export function EditMemberDialog({
  memberId,
  ar,
  initial,
}: {
  memberId: string;
  ar: boolean;
  initial: { full_name: string; phone: string; email: string; source: string; lead_status: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState(initial);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  const field = "w-full rounded-md border border-outline bg-surface-container px-4 py-3 text-body text-primary-900 outline-none focus:border-accent";
  const lab = "mb-1 block text-meta text-status-full";

  const submit = () =>
    start(async () => {
      setErr(null);
      const res = await updateMemberAction(memberId, f);
      if (!res.ok) {
        setErr(res.error === "name_required" ? (ar ? "الاسم مطلوب" : "Name is required") : ar ? "تعذّر الحفظ" : "Couldn't save");
        return;
      }
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex min-h-[44px] items-center rounded-md border border-outline px-4 text-sm text-primary-700">
        {ar ? "تعديل البيانات" : "Edit"}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4" role="dialog" aria-modal="true" onClick={() => !pending && setOpen(false)}>
          <div dir={ar ? "rtl" : "ltr"} className="w-full max-w-md space-y-4 rounded-t-xl bg-surface-elevated p-6 md:rounded-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-title font-medium text-primary-900">{ar ? "تعديل بيانات العميلة" : "Edit client"}</h2>

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
                <input value={f.source} onChange={(e) => set("source", e.target.value)} className={field} />
              </div>
              <div className="flex-1">
                <label className={lab}>{ar ? "الحالة" : "Status"}</label>
                <select value={f.lead_status || "lead"} onChange={(e) => set("lead_status", e.target.value)} className={field}>
                  {STATUSES.map((s) => (
                    <option key={s.v} value={s.v}>{ar ? s.ar : s.en}</option>
                  ))}
                </select>
              </div>
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
