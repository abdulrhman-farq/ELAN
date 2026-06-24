"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelClassAction, deleteClassAction } from "@/admin-actions";

/** Per-class admin controls on the schedule: cancel (soft) or delete (if empty). */
export function ClassRowActions({ id, confirmed, cancelled, ar }: { id: string; confirmed: number; cancelled: boolean; ar: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const cancel = () =>
    start(async () => {
      setErr(null);
      const res = await cancelClassAction(id);
      if (!res.ok) setErr(ar ? "تعذّر الإلغاء" : "Failed");
      else router.refresh();
    });

  const remove = () =>
    start(async () => {
      setErr(null);
      const res = await deleteClassAction(id);
      if (!res.ok) setErr(res.error === "has_bookings" ? (ar ? "فيها حجوزات" : "Has bookings") : ar ? "تعذّر الحذف" : "Failed");
      else router.refresh();
    });

  if (cancelled) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button disabled={pending} onClick={cancel} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700">
        {ar ? "إلغاء الحصة" : "Cancel"}
      </button>
      {confirmed === 0 ? (
        <button disabled={pending} onClick={remove} className="rounded-pill border border-outline px-2.5 py-1 text-caption text-danger">
          {ar ? "حذف" : "Delete"}
        </button>
      ) : null}
      {err ? <span className="text-caption text-danger">{err}</span> : null}
    </div>
  );
}
