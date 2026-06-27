import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getMemberDetail, getMemberTasks, getMemberFinancials, getMemberPayments } from "@/lib/admin";
import { getIsAdmin } from "@/lib/admin-guard";
import { fmtLongDateTime, levelLabel } from "@/lib/format";
import { fmtHalalas } from "@/lib/pricing";
import { CLASS_INFO, type ClassRec } from "@/lib/quiz";
import { MemberStatusSelect } from "@/components/admin/MemberStatusSelect";
import { AddNoteForm } from "@/components/admin/AddNoteForm";
import { EditMemberDialog } from "@/components/admin/EditMemberDialog";
import { WhatsAppActions } from "@/components/admin/WhatsAppActions";
import { MemberTasks } from "@/components/admin/MemberTasks";
import { SellBundleDialog, BookingMoneyControls } from "@/components/admin/MemberMoney";
import { MemberPayments } from "@/components/admin/MemberPayments";
import { MemberSuspension } from "@/components/admin/MemberSuspension";

export const dynamic = "force-dynamic";

const bstatusLabel = (s: string, ar: boolean): string => {
  const m: Record<string, [string, string]> = {
    confirmed: ["مؤكد", "Confirmed"],
    waitlisted: ["قائمة الانتظار", "Waitlisted"],
    attended: ["تم الحضور", "Attended"],
    cancelled: ["ملغي", "Cancelled"],
    late_cancelled: ["إلغاء متأخر", "Late cancelled"],
    no_show: ["لم تحضر", "No-show"],
  };
  return m[s]?.[ar ? 0 : 1] ?? s;
};

function fmtDateTime(iso: string, ar: boolean): string {
  return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const ar = locale === "ar";
  const [detail, tasks, fin, payments, isAdmin] = await Promise.all([
    getMemberDetail(id),
    getMemberTasks(id),
    getMemberFinancials(id),
    getMemberPayments(id),
    getIsAdmin(),
  ]);
  if (!detail) notFound();
  const { member, balance, notes } = detail;
  const plan = ar ? detail.membershipPlanAr : detail.membershipPlanEn;
  const sar = (h: number) => `${fmtHalalas(h, ar ? "ar" : "en")} ${ar ? "ر.س" : "SAR"}`;

  return (
    <div className="space-y-6">
      <Link href="/admin/members" className="inline-flex min-h-[44px] items-center text-meta text-primary-700">
        ‹ {ar ? "كل العميلات" : "All clients"}
      </Link>

      <section className="card space-y-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-title font-medium text-primary-900">{member.full_name}</h2>
            <p className="text-meta text-status-full">
              {member.phone ?? "—"}{member.email ? ` · ${member.email}` : ""}
            </p>
            <p className="text-meta text-status-full">
              {levelLabel(member.level, locale)}
              {detail.source ? ` · ${ar ? "المصدر" : "Source"}: ${detail.source}` : ""}
            </p>
            {detail.recommendedClass ? (
              <p className="text-meta text-primary-700">
                {ar ? "الكلاس المنصوح: " : "Recommended class: "}
                {CLASS_INFO[detail.recommendedClass as ClassRec]?.name_ar ?? detail.recommendedClass}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-caption text-status-full">{ar ? "حالة المتابعة" : "Follow-up status"}</span>
            <MemberStatusSelect memberId={member.id} current={detail.leadStatus} ar={ar} />
            <EditMemberDialog
              memberId={member.id}
              ar={ar}
              initial={{
                full_name: member.full_name,
                phone: member.phone ?? "",
                email: member.email ?? "",
                source: detail.source ?? "",
                lead_status: detail.leadStatus ?? "lead",
              }}
            />
          </div>
        </div>

        <div className="border-t border-outline pt-3">
          <p className="mb-2 text-caption text-status-full">{ar ? "تواصل واتساب سريع" : "WhatsApp quick actions"}</p>
          <WhatsAppActions phone={member.phone} name={member.full_name} ar={ar} />
        </div>
      </section>

      <MemberSuspension
        memberId={member.id}
        suspendedUntil={detail.suspendedUntil}
        recentPenalties={detail.recentPenalties}
        ar={ar}
      />

      <section className="space-y-3">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "مهام المتابعة" : "Follow-up tasks"}</h3>
        <div className="card p-5">
          <MemberTasks memberId={member.id} ar={ar} tasks={tasks} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5 text-center">
          <p className="font-number text-3xl text-primary-700">{balance}</p>
          <p className="text-caption text-status-full">{ar ? "رصيد الحصص" : "Credits"}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="truncate font-display text-lead text-primary-700">{plan ?? (ar ? "لا توجد عضوية" : "No membership")}</p>
          <p className="text-caption text-status-full">{ar ? "العضوية" : "Membership"}</p>
          {detail.membershipEnd ? (
            <p className="mt-1 font-number text-caption text-status-full">
              {ar ? "ينتهي: " : "Expires: "}
              {new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(detail.membershipEnd))}
            </p>
          ) : null}
        </div>
      </div>

      {isAdmin ? (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "الملخص المالي" : "Financial summary"}</h3>
              <SellBundleDialog memberId={member.id} ar={ar} />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <MoneyStat label={ar ? "إجمالي المدفوع" : "Total paid"} value={sar(fin.totalPaidHalalas)} />
              <MoneyStat label={ar ? "إجمالي الخصومات" : "Total discount"} value={sar(fin.totalDiscountHalalas)} />
              <MoneyStat label={ar ? "قيمة الحصص المحضورة" : "Attended value"} value={sar(fin.attendedValueHalalas)} />
              <MoneyStat label={ar ? "قيمة الرصيد المتبقي" : "Remaining package value"} value={sar(fin.remainingPackageHalalas)} />
              <MoneyStat label={ar ? "قيمة عدم الحضور" : "No-show value"} value={sar(fin.noShowValueHalalas)} />
              <MoneyStat label={ar ? "قيمة الحصص المجانية" : "Complimentary value"} value={sar(fin.compValueHalalas)} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "المدفوعات" : "Payments"}</h3>
            <div className="card p-5">
              <MemberPayments ar={ar} payments={payments} />
            </div>
          </section>
        </>
      ) : null}

      <section className="space-y-3">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "سجل المتابعة" : "Follow-up log"}</h3>
        <div className="card space-y-3 p-5">
          <AddNoteForm memberId={member.id} ar={ar} />
          {notes.length === 0 ? (
            <p className="py-2 text-meta text-status-full">{ar ? "لا توجد ملاحظات بعد." : "No notes yet."}</p>
          ) : (
            <ul className="divide-y divide-outline">
              {notes.map((n) => (
                <li key={n.id} className="py-3">
                  <p className="whitespace-pre-wrap text-body text-primary-900">{n.body}</p>
                  <p className="mt-1 font-number text-caption text-status-full">{fmtDateTime(n.created_at, ar)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "آخر الحجوزات" : "Recent bookings"}</h3>
        <div className="card divide-y divide-outline">
          {detail.bookings.length === 0 ? (
            <p className="p-6 text-center text-body text-status-full">{ar ? "لا توجد حجوزات." : "No bookings."}</p>
          ) : (
            detail.bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-primary-900">{ar ? b.name_ar : b.name_en}</p>
                  <p className="truncate text-caption text-status-full">
                    {b.starts_at ? fmtLongDateTime(b.starts_at, b.ends_at, locale) : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isAdmin ? <BookingMoneyControls bookingId={b.id} ar={ar} /> : null}
                  <span className="chip bg-surface-variant text-primary-700">{bstatusLabel(b.status, ar)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function MoneyStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-caption text-status-full">{label}</p>
      <p className="mt-1 font-number text-lead text-primary-900">{value}</p>
    </div>
  );
}
