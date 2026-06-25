"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markPaymentPaidAction } from "@/admin-actions";
import { fmtHalalas } from "@/lib/pricing";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";

type Payment = {
  id: string;
  type: string;
  status: string;
  gross_halalas: number;
  credits: number;
  method: string | null;
  created_at: string;
  starts_at: string | null;
};

const TYPE: Record<string, [string, string]> = {
  credit_pack: ["باقة حصص", "Credit pack"],
  membership: ["عضوية", "Membership"],
  single_class: ["حصة مفردة", "Single class"],
  private_session: ["جلسة خاصة", "Private"],
  penalty: ["غرامة", "Penalty"],
};
const STATUS: Record<string, [string, string]> = {
  paid: ["مدفوع", "Paid"],
  initiated: ["معلّق", "Pending"],
  failed: ["فشل", "Failed"],
  refunded: ["مُسترد", "Refunded"],
};

export function MemberPayments({ ar, payments }: { ar: boolean; payments: Payment[] }) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  // Track which row is being mutated so only that button shows loading.
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const markPaid = (id: string) =>
    start(async () => {
      setErr(null);
      setBusyId(id);
      const res = await markPaymentPaidAction(id);
      if (!res.ok) {
        const msg = ar ? "تعذّر التحديث" : "Failed to mark paid";
        setErr(msg);
        toast.error(msg);
      } else {
        setConfirmId(null);
        toast.success(ar ? "تم تعليمه كمدفوع" : "Marked as paid");
        router.refresh();
      }
      setBusyId(null);
    });

  const confirmTarget = payments.find((p) => p.id === confirmId) ?? null;

  const sar = (h: number) => `${fmtHalalas(h, ar ? "ar" : "en")} ${ar ? "ر.س" : "SAR"}`;
  const date = (iso: string) => new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso));

  if (payments.length === 0) {
    return <p className="py-2 text-meta text-status-full">{ar ? "لا توجد مدفوعات." : "No payments."}</p>;
  }

  return (
    <div className="space-y-2">
      {err ? <p className="text-meta text-danger" role="alert">{err}</p> : null}
      <ul className="divide-y divide-outline">
        {payments.map((p) => {
          const isPending = p.status === "initiated";
          return (
            <li key={p.id} className="flex items-center justify-between gap-2 py-3">
              <div className="min-w-0">
                <p className="text-body text-primary-900">
                  {TYPE[p.type]?.[ar ? 0 : 1] ?? p.type}
                  {p.credits > 0 ? <span className="text-status-full"> · <span className="font-number">{p.credits}</span> {ar ? "حصة" : "credits"}</span> : null}
                </p>
                <p className="text-caption text-status-full">
                  <span className="font-number">{date(p.created_at)}</span>
                  {p.method ? ` · ${p.method}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-number text-body text-primary-900">{sar(p.gross_halalas)}</span>
                {isPending ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => { setErr(null); setConfirmId(p.id); }}
                    className="rounded-pill bg-primary px-2.5 py-1 text-caption text-ink disabled:opacity-50"
                  >
                    {busyId === p.id ? <span className="spinner" aria-hidden /> : ar ? "تعليم كمدفوع" : "Mark paid"}
                  </button>
                ) : (
                  <span className={`rounded-pill px-2.5 py-1 text-caption ${p.status === "paid" ? "bg-sage/15 text-sage" : "bg-surface-variant text-status-full"}`}>
                    {STATUS[p.status]?.[ar ? 0 : 1] ?? p.status}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        open={confirmTarget != null}
        pending={pending}
        title={ar ? "تعليم الدفعة كمدفوعة؟" : "Mark payment as paid?"}
        body={ar ? "سيتم احتساب هذه الدفعة ضمن الإيراد وقد تُضاف رصيد/حصص للعميلة." : "This counts toward revenue and may credit the member."}
        meta={confirmTarget ? sar(confirmTarget.gross_halalas) : undefined}
        confirmLabel={ar ? "تأكيد الدفع" : "Mark paid"}
        cancelLabel={ar ? "رجوع" : "Cancel"}
        onConfirm={() => confirmTarget && markPaid(confirmTarget.id)}
        onClose={() => !pending && setConfirmId(null)}
      />
    </div>
  );
}
