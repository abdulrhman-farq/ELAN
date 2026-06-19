"use client";
import { useState, useTransition } from "react";
import { markAttendedAction, markNoShowAction } from "@/actions/admin";

export function AttendanceButtons({
  bookingId,
  classInstanceId,
  attendedLabel,
  noShowLabel,
}: {
  bookingId: string;
  classInstanceId: string;
  attendedLabel: string;
  noShowLabel: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const run = (fn: typeof markAttendedAction) =>
    start(async () => {
      setErr(null);
      const res = await fn(bookingId, classInstanceId);
      if ("error" in res) setErr(res.error);
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          disabled={pending}
          onClick={() => run(markAttendedAction)}
          className="rounded-pill bg-primary px-3 py-1 text-xs font-medium text-ink disabled:opacity-50"
        >
          {attendedLabel}
        </button>
        <button
          disabled={pending}
          onClick={() => run(markNoShowAction)}
          className="rounded-pill border border-outline px-3 py-1 text-xs font-medium text-status-full disabled:opacity-50"
        >
          {noShowLabel}
        </button>
      </div>
      {err ? <p className="text-xs text-primary-600">{err}</p> : null}
    </div>
  );
}
