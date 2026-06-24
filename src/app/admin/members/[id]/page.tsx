import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getMemberDetail, getMemberTasks } from "@/lib/admin";
import { fmtLongDateTime, levelLabel } from "@/lib/format";
import { MemberStatusSelect } from "@/components/admin/MemberStatusSelect";
import { AddNoteForm } from "@/components/admin/AddNoteForm";
import { EditMemberDialog } from "@/components/admin/EditMemberDialog";
import { WhatsAppActions } from "@/components/admin/WhatsAppActions";
import { MemberTasks } from "@/components/admin/MemberTasks";

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
  const [detail, tasks] = await Promise.all([getMemberDetail(id), getMemberTasks(id)]);
  if (!detail) notFound();
  const { member, balance, notes } = detail;
  const plan = ar ? detail.membershipPlanAr : detail.membershipPlanEn;

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

      <section className="space-y-3">
        <h3 className="font-display text-lead font-medium text-primary-900">{ar ? "مهام المتابعة" : "Follow-up tasks"}</h3>
        <div className="card p-5">
          <MemberTasks memberId={member.id} ar={ar} tasks={tasks} />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-5 text-center">
          <p className="font-display text-3xl text-primary-700">{balance}</p>
          <p className="text-caption text-status-full">{ar ? "رصيد الحصص" : "Credits"}</p>
        </div>
        <div className="card p-5 text-center">
          <p className="truncate font-display text-lead text-primary-700">{plan ?? (ar ? "لا توجد عضوية" : "No membership")}</p>
          <p className="text-caption text-status-full">{ar ? "العضوية" : "Membership"}</p>
        </div>
      </div>

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
                  <p className="mt-1 text-caption text-status-full">{fmtDateTime(n.created_at, ar)}</p>
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
                <span className="chip bg-surface-variant text-primary-700">{bstatusLabel(b.status, ar)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
