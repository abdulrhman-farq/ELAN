"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelClassAction, deleteClassAction } from "@/admin-actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

/** Per-class admin controls on the schedule: cancel (soft) or delete (if empty). */
export function ClassRowActions({ id, confirmed, cancelled, ar }: { id: string; confirmed: number; cancelled: boolean; ar: boolean }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);

  const hasBookings = confirmed > 0;

  const cancel = () =>
    start(async () => {
      setErr(null);
      setOk(false);
      const res = await cancelClassAction(id);
      if (!res.ok) {
        const msg = ar ? "تعذّر الإلغاء" : "Failed to cancel";
        setErr(msg);
        toast.error(msg);
      } else {
        setConfirm(null);
        setOk(true);
        toast.success(ar ? "تم إلغاء الحصة" : "Class cancelled");
        router.refresh();
      }
    });

  const remove = () =>
    start(async () => {
      setErr(null);
      setOk(false);
      const res = await deleteClassAction(id);
      if (!res.ok) {
        const msg = res.error === "has_bookings" ? (ar ? "فيها حجوزات" : "Has bookings") : ar ? "تعذّر الحذف" : "Failed to delete";
        setErr(msg);
        toast.error(msg);
      } else {
        setConfirm(null);
        setOk(true);
        toast.success(ar ? "تم حذف الحصة" : "Class deleted");
        router.refresh();
      }
    });

  if (cancelled) return null;

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => { setErr(null); setOk(false); setConfirm("cancel"); }}
        className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700 disabled:opacity-50"
      >
        {ar ? "إلغاء الحصة" : "Cancel"}
      </button>
      {confirmed === 0 ? (
        <button
          type="button"
          disabled={pending}
          onClick={() => { setErr(null); setOk(false); setConfirm("delete"); }}
          className="rounded-pill border border-outline px-2.5 py-1 text-caption text-danger disabled:opacity-50"
        >
          {ar ? "حذف" : "Delete"}
        </button>
      ) : null}
      {err ? <span className="text-caption text-danger" role="alert">{err}</span> : null}
      {ok && !err ? <span className="text-caption text-sage">{ar ? "تم" : "Done"}</span> : null}

      <ConfirmDialog
        open={confirm === "cancel"}
        danger
        pending={pending}
        title={ar ? "إلغاء الحصة؟" : "Cancel this class?"}
        body={
          hasBookings
            ? ar
              ? "تنبيه: لهذه الحصة حجوزات مؤكّدة. الإلغاء سيؤثّر على العميلات المسجّلات."
              : "Warning: this class has confirmed bookings. Cancelling will affect enrolled members."
            : ar
              ? "سيتم إلغاء الحصة. يمكن إعادة جدولتها لاحقًا."
              : "The class will be cancelled. It can be rescheduled later."
        }
        meta={hasBookings ? (ar ? `الحجوزات المؤكّدة: ${confirmed}` : `Confirmed bookings: ${confirmed}`) : undefined}
        confirmLabel={ar ? "تأكيد الإلغاء" : "Cancel class"}
        cancelLabel={ar ? "رجوع" : "Keep class"}
        onConfirm={cancel}
        onClose={() => !pending && setConfirm(null)}
      />

      <ConfirmDialog
        open={confirm === "delete"}
        danger
        pending={pending}
        title={ar ? "حذف الحصة نهائيًا؟" : "Delete this class permanently?"}
        body={ar ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}
        confirmLabel={ar ? "حذف نهائي" : "Delete"}
        cancelLabel={ar ? "رجوع" : "Keep"}
        onConfirm={remove}
        onClose={() => !pending && setConfirm(null)}
      />
    </div>
  );
}
