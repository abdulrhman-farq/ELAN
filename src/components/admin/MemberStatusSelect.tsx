"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLeadStatusAction } from "@/admin-actions";

const STATUSES: { v: string; ar: string; en: string }[] = [
  { v: "lead", ar: "مهتمة", en: "Lead" },
  { v: "trial", ar: "تجريبية", en: "Trial" },
  { v: "active", ar: "نشطة", en: "Active" },
  { v: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

export function MemberStatusSelect({ memberId, current, ar }: { memberId: string; current: string | null; ar: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      disabled={pending}
      value={current ?? "lead"}
      onChange={(e) =>
        start(async () => {
          await setLeadStatusAction(memberId, e.target.value);
          router.refresh();
        })
      }
      aria-label={ar ? "حالة المتابعة" : "Follow-up status"}
      className="min-h-[44px] rounded-md border border-outline bg-surface-container px-3 text-meta text-primary-900 outline-none focus:border-accent disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s.v} value={s.v}>{ar ? s.ar : s.en}</option>
      ))}
    </select>
  );
}
