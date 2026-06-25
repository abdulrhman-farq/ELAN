"use client";
import { useState, useTransition } from "react";
import { markAttendedAction, markNoShowAction } from "@/actions/admin";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

export function AttendanceButtons({
  bookingId,
  classInstanceId,
  attendedLabel,
  noShowLabel,
  ar = false,
}: {
  bookingId: string;
  classInstanceId: string;
  attendedLabel: string;
  noShowLabel: string;
  ar?: boolean;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [confirmNoShow, setConfirmNoShow] = useState(false);

  const run = (fn: typeof markAttendedAction, successMsg: string) =>
    start(async () => {
      setErr(null);
      const res = await fn(bookingId, classInstanceId);
      if ("error" in res) {
        setErr(res.error);
        toast.error(res.error);
      } else {
        setConfirmNoShow(false);
        toast.success(successMsg);
      }
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(markAttendedAction, ar ? "تم تسجيل الحضور" : "Checked in")}
          className="rounded-pill bg-primary px-3 py-1 text-xs font-medium text-ink disabled:opacity-50"
        >
          {pending ? <span className="spinner" aria-hidden /> : attendedLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => { setErr(null); setConfirmNoShow(true); }}
          className="rounded-pill border border-outline px-3 py-1 text-xs font-medium text-status-full disabled:opacity-50"
        >
          {noShowLabel}
        </button>
      </div>
      {err ? <p className="text-xs text-danger" role="alert">{err}</p> : null}

      <ConfirmDialog
        open={confirmNoShow}
        danger
        pending={pending}
        title={ar ? "تسجيل عدم حضور؟" : "Mark as no-show?"}
        body={ar ? "سيتم احتساب غرامة/خصم حصة على العميلة." : "This will penalise the member (credit/penalty)."}
        confirmLabel={noShowLabel}
        cancelLabel={ar ? "رجوع" : "Cancel"}
        onConfirm={() => run(markNoShowAction, ar ? "تم تسجيل عدم الحضور" : "Marked no-show")}
        onClose={() => !pending && setConfirmNoShow(false)}
      />
    </div>
  );
}
