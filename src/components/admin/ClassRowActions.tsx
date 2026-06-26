"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelClassAction, deleteClassAction, editClassAction } from "@/admin-actions";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

type Opt = { id: string; name_ar: string; name_en: string };

const TZ = "Asia/Riyadh";
const riyadhDate = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
const riyadhTime = (iso: string) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

/** Per-class admin controls on the schedule: edit (time/instructor/capacity), cancel (soft) or delete (if empty). */
export function ClassRowActions({
  id, confirmed, cancelled, ar, instructors = [], instructorId = null, capacity = 6, startsAt, endsAt,
}: {
  id: string; confirmed: number; cancelled: boolean; ar: boolean;
  instructors?: Opt[]; instructorId?: string | null; capacity?: number; startsAt?: string; endsAt?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [confirm, setConfirm] = useState<null | "cancel" | "delete">(null);
  const [editOpen, setEditOpen] = useState(false);
  const [eTime, setETime] = useState(startsAt ? riyadhTime(startsAt) : "09:00");
  const [eInstr, setEInstr] = useState(instructorId ?? "");
  const [eCap, setECap] = useState(String(capacity));

  const hasBookings = confirmed > 0;

  const saveEdit = () =>
    start(async () => {
      setErr(null);
      let startsIso: string | undefined; let endsIso: string | undefined;
      if (startsAt && /^([01]\d|2[0-3]):[0-5]\d$/.test(eTime)) {
        const newStart = new Date(`${riyadhDate(startsAt)}T${eTime}:00+03:00`);
        startsIso = newStart.toISOString();
        if (endsAt) endsIso = new Date(newStart.getTime() + (new Date(endsAt).getTime() - new Date(startsAt).getTime())).toISOString();
      }
      const res = await editClassAction(id, { startsAt: startsIso, endsAt: endsIso, instructorId: eInstr || null, capacity: Number(eCap) });
      if (!res.ok) {
        const msg = res.error === "instructor_overlap"
          ? (ar ? "المدرّبة لديها حصة في نفس الوقت" : "Instructor already has a class then")
          : ar ? "تعذّر الحفظ" : "Failed to save";
        setErr(msg); toast.error(msg);
        return;
      }
      setEditOpen(false);
      toast.success(ar ? "تم تحديث الحصة" : "Class updated");
      router.refresh();
    });

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
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setErr(null); setOk(false);
          setETime(startsAt ? riyadhTime(startsAt) : "09:00");
          setEInstr(instructorId ?? "");
          setECap(String(capacity));
          setEditOpen(true);
        }}
        className="rounded-pill border border-outline px-2.5 py-1 text-caption text-primary-700 disabled:opacity-50"
      >
        {ar ? "تعديل" : "Edit"}
      </button>
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

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm space-y-4 rounded-xl bg-surface p-5 shadow-xl">
            <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "تعديل الحصة" : "Edit class"}</h3>

            <label className="block space-y-1">
              <span className="text-caption text-status-full">{ar ? "الوقت" : "Time"}</span>
              <input
                type="time"
                value={eTime}
                onChange={(e) => setETime(e.target.value)}
                className="w-full rounded-md border border-outline px-3 py-2 text-body"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-caption text-status-full">{ar ? "المدرّبة" : "Instructor"}</span>
              <select
                value={eInstr}
                onChange={(e) => setEInstr(e.target.value)}
                className="w-full rounded-md border border-outline px-3 py-2 text-body"
              >
                <option value="">{ar ? "بدون مدرّبة" : "Unassigned"}</option>
                {instructors.map((i) => (
                  <option key={i.id} value={i.id}>{ar ? i.name_ar : i.name_en}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-caption text-status-full">{ar ? "السعة" : "Capacity"}</span>
              <input
                type="number"
                min={1}
                value={eCap}
                onChange={(e) => setECap(e.target.value)}
                className="w-full rounded-md border border-outline px-3 py-2 text-body"
              />
            </label>

            {err ? <p className="text-caption text-danger" role="alert">{err}</p> : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={pending}
                onClick={() => !pending && setEditOpen(false)}
                className="rounded-pill border border-outline px-3 py-1.5 text-caption text-primary-700 disabled:opacity-50"
              >
                {ar ? "رجوع" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={saveEdit}
                className="rounded-pill bg-primary-900 px-4 py-1.5 text-caption text-ink disabled:opacity-50"
              >
                {pending ? (ar ? "جارٍ الحفظ…" : "Saving…") : ar ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
