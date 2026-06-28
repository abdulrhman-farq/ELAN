"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { suspendMemberAction, liftSuspensionAction, freezeMembershipAction, unfreezeMembershipAction } from "@/admin-actions";
import { useToast } from "@/components/Toast";

/** Admin control: shows suspension status + recent penalties, with suspend / lift,
 *  plus membership freeze/pause. */
export function MemberSuspension({
  memberId, suspendedUntil, recentPenalties, ar, hasActiveMembership = false, frozenUntil = null,
}: {
  memberId: string;
  suspendedUntil: string | null;
  recentPenalties: number;
  ar: boolean;
  hasActiveMembership?: boolean;
  frozenUntil?: string | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [days, setDays] = useState("14");
  const [freezeDays, setFreezeDays] = useState("7");

  const isFrozen = frozenUntil ? new Date(frozenUntil).getTime() > Date.now() : false;
  const frozenLabel = frozenUntil
    ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(frozenUntil))
    : null;

  const freeze = () =>
    start(async () => {
      const res = await freezeMembershipAction(memberId, Number(freezeDays));
      if (!res.ok) { toast.error(res.error === "no_membership" ? (ar ? "لا توجد عضوية فعّالة" : "No active membership") : ar ? "تعذّر التجميد" : "Freeze failed"); return; }
      toast.success(ar ? "تم تجميد العضوية" : "Membership frozen");
      router.refresh();
    });

  const unfreeze = () =>
    start(async () => {
      const res = await unfreezeMembershipAction(memberId);
      if (!res.ok) { toast.error(ar ? "تعذّر الإلغاء" : "Unfreeze failed"); return; }
      toast.success(ar ? "تم استئناف العضوية" : "Membership resumed");
      router.refresh();
    });

  const active = suspendedUntil ? new Date(suspendedUntil).getTime() > Date.now() : false;
  const untilLabel = suspendedUntil
    ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(suspendedUntil))
    : null;

  const suspend = () =>
    start(async () => {
      const res = await suspendMemberAction(memberId, Number(days));
      if (!res.ok) { toast.error(ar ? "تعذّر الإيقاف" : "Failed to suspend"); return; }
      toast.success(ar ? "تم إيقاف الحجز مؤقتًا" : "Member suspended");
      router.refresh();
    });

  const lift = () =>
    start(async () => {
      const res = await liftSuspensionAction(memberId);
      if (!res.ok) { toast.error(ar ? "تعذّر الإلغاء" : "Failed to lift"); return; }
      toast.success(ar ? "تم رفع الإيقاف" : "Suspension lifted");
      router.refresh();
    });

  return (
    <section className="card space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "حالة الحجز" : "Booking status"}</h3>
        {active ? (
          <span className="rounded-pill bg-danger/10 px-2.5 py-0.5 text-caption text-danger">{ar ? "موقوفة" : "Suspended"}</span>
        ) : (
          <span className="rounded-pill bg-sage/15 px-2.5 py-0.5 text-caption text-sage">{ar ? "نشطة" : "Active"}</span>
        )}
      </div>

      <p className="text-meta text-status-full">
        {ar ? `مخالفات آخر ٦٠ يومًا (عدم حضور / إلغاء متأخر): ` : `Penalties in last 60 days (no-show / late-cancel): `}
        <span className="font-number text-primary-700">{recentPenalties}</span>
      </p>

      {active && untilLabel ? (
        <p className="text-meta text-danger">{ar ? `موقوفة حتى ${untilLabel}` : `Suspended until ${untilLabel}`}</p>
      ) : null}

      {active ? (
        <button type="button" disabled={pending} onClick={lift} className="rounded-pill border border-outline px-3 py-1.5 text-caption text-primary-700 disabled:opacity-50">
          {ar ? "رفع الإيقاف" : "Lift suspension"}
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={1}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-20 rounded-md border border-outline px-2.5 py-1 text-caption"
          />
          <span className="text-caption text-status-full">{ar ? "يوم" : "days"}</span>
          <button type="button" disabled={pending} onClick={suspend} className="rounded-pill border border-outline px-3 py-1.5 text-caption text-danger disabled:opacity-50">
            {ar ? "إيقاف مؤقت" : "Suspend"}
          </button>
        </div>
      )}

      {/* Membership freeze/pause (perk) */}
      {hasActiveMembership ? (
        <div className="border-t border-outline pt-3">
          <p className="mb-2 text-meta font-medium text-primary-900">{ar ? "تجميد العضوية" : "Freeze membership"}</p>
          {isFrozen ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-meta text-primary-700">{ar ? `مجمّدة حتى ${frozenLabel}` : `Frozen until ${frozenLabel}`}</span>
              <button type="button" disabled={pending} onClick={unfreeze} className="rounded-pill border border-outline px-3 py-1.5 text-caption text-primary-700 disabled:opacity-50">
                {ar ? "استئناف" : "Resume"}
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input type="number" min={1} value={freezeDays} onChange={(e) => setFreezeDays(e.target.value)} className="w-20 rounded-md border border-outline px-2.5 py-1 text-caption" />
              <span className="text-caption text-status-full">{ar ? "يوم" : "days"}</span>
              <button type="button" disabled={pending} onClick={freeze} className="rounded-pill border border-outline px-3 py-1.5 text-caption text-primary-700 disabled:opacity-50">
                {ar ? "تجميد" : "Freeze"}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
