import { notFound } from "next/navigation";
import { getLocale } from "@/lib/locale-server";
import { getMemberDetail } from "@/lib/admin";
import { fmtLongDateTime, levelLabel } from "@/lib/format";

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
  return (m[s]?.[ar ? 0 : 1]) ?? s;
};

export default async function AdminMemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const ar = locale === "ar";
  const detail = await getMemberDetail(id);
  if (!detail) notFound();
  const { member, balance } = detail;
  const plan = ar ? detail.membershipPlanAr : detail.membershipPlanEn;

  return (
    <div className="space-y-5">
      <section className="card space-y-1 p-5">
        <h2 className="text-lg font-bold text-primary-900">{member.full_name}</h2>
        <p className="text-sm text-status-full">{member.phone ?? "—"}{member.email ? ` · ${member.email}` : ""}</p>
        <p className="text-sm text-status-full">{levelLabel(member.level, locale)}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-700">{balance}</p>
          <p className="text-xs text-status-full">{ar ? "رصيد الحصص" : "Credits"}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="truncate text-base font-bold text-primary-700">{plan ?? (ar ? "لا توجد عضوية" : "No membership")}</p>
          <p className="text-xs text-status-full">{ar ? "العضوية" : "Membership"}</p>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="font-semibold text-primary-800">{ar ? "آخر الحجوزات" : "Recent bookings"}</h3>
        <div className="card divide-y divide-outline">
          {detail.bookings.length === 0 ? (
            <p className="p-6 text-center text-status-full">{ar ? "لا توجد حجوزات." : "No bookings."}</p>
          ) : (
            detail.bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-primary-900">{ar ? b.name_ar : b.name_en}</p>
                  <p className="truncate text-xs text-status-full">
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
