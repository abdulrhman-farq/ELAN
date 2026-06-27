"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { checkinByCodeAction } from "@/actions/admin";
import { useToast } from "@/components/Toast";

/** Quick attendance by the member's check-in code (no scanner needed). */
export function QuickCheckin({ classInstanceId, ar }: { classInstanceId: string; ar: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [code, setCode] = useState("");

  const submit = () =>
    start(async () => {
      const res = await checkinByCodeAction(classInstanceId, code);
      if ("error" in res) {
        const msg = res.error === "bad_code" ? (ar ? "رمز غير صحيح" : "Invalid code")
          : res.error === "no_booking" ? (ar ? "لا يوجد حجز لهذه العضوة في الحصة" : "No booking for this class")
          : res.error === "not_confirmed" ? (ar ? "الحجز غير مؤكّد" : "Booking not confirmed")
          : res.error === "empty" ? (ar ? "أدخلي الرمز" : "Enter a code")
          : ar ? "تعذّر تسجيل الحضور" : "Check-in failed";
        toast.error(msg);
        return;
      }
      toast.success(ar ? `تم تسجيل حضور ${res.name}` : `Checked in ${res.name}`);
      setCode("");
      router.refresh();
    });

  return (
    <div className="card flex flex-wrap items-center gap-2 p-4">
      <span className="text-meta text-status-full">{ar ? "تسجيل سريع بالرمز" : "Quick check-in by code"}</span>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
        placeholder={ar ? "رمز العضوة" : "Member code"}
        className="w-32 rounded-md border border-outline px-3 py-2 font-number uppercase tracking-widest outline-none focus:border-accent"
        maxLength={8}
      />
      <button type="button" disabled={pending || !code.trim()} onClick={submit} className="rounded-pill bg-primary px-4 py-2 text-caption font-medium text-ink disabled:opacity-50">
        {pending ? (ar ? "…" : "…") : ar ? "تسجيل" : "Check in"}
      </button>
    </div>
  );
}
