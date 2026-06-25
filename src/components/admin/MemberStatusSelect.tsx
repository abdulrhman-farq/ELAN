"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLeadStatusAction } from "@/admin-actions";
import { useToast } from "@/components/Toast";

const STATUSES: { v: string; ar: string; en: string }[] = [
  { v: "lead", ar: "مهتمة", en: "Lead" },
  { v: "trial", ar: "تجريبية", en: "Trial" },
  { v: "active", ar: "نشطة", en: "Active" },
  { v: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

export function MemberStatusSelect({ memberId, current, ar }: { memberId: string; current: string | null; ar: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  // Controlled value so we can optimistically update and revert on failure.
  const [value, setValue] = useState(current ?? "lead");
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onChange = (next: string) => {
    const prev = value;
    setErr(null);
    setSaved(false);
    setValue(next);
    start(async () => {
      const res = await setLeadStatusAction(memberId, next);
      if (!res.ok) {
        setValue(prev); // revert
        const msg = ar ? "تعذّر حفظ الحالة" : "Failed to save status";
        setErr(msg);
        toast.error(msg);
        return;
      }
      setSaved(true);
      toast.success(ar ? "تم حفظ الحالة" : "Status saved");
      router.refresh();
    });
  };

  return (
    <span className="inline-flex items-center gap-2">
      <select
        disabled={pending}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ar ? "حالة المتابعة" : "Follow-up status"}
        className="min-h-[44px] rounded-md border border-outline bg-surface-container px-3 text-meta text-primary-900 outline-none focus:border-accent disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s.v} value={s.v}>{ar ? s.ar : s.en}</option>
        ))}
      </select>
      {err ? (
        <span className="text-caption text-danger" role="alert">{err}</span>
      ) : saved ? (
        <span className="text-caption text-sage">{ar ? "تم الحفظ" : "Saved"}</span>
      ) : null}
    </span>
  );
}
