import { getLocale } from "@/lib/locale-server";
import { getAdminOverview, getAdminSchedule } from "@/lib/admin";
import { fmtTime, levelLabel } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const [overview, schedule] = await Promise.all([getAdminOverview(), getAdminSchedule(1)]);
  const sar = ar ? "ر.س" : "SAR";

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-medium text-primary-900">{ar ? "لوحة التحكم" : "Dashboard"}</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={ar ? "حصص اليوم" : "Classes today"} value={String(overview.classesToday)} />
        <Stat label={ar ? "نسبة الإشغال" : "Fill rate"} value={overview.fillRateToday === null ? "—" : `${overview.fillRateToday}%`} />
        <Stat label={ar ? "إيراد اليوم" : "Revenue today"} value={`${overview.revenueToday} ${sar}`} />
        <Stat label={ar ? "إيراد الأسبوع" : "Revenue (7d)"} value={`${overview.revenueWeek} ${sar}`} />
        <Stat label={ar ? "الأعضاء" : "Members"} value={String(overview.membersCount)} />
        <Stat label={ar ? "حصص قادمة (7 أيام)" : "Upcoming (7d)"} value={String(overview.upcomingClasses)} />
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-primary-900">{ar ? "حصص اليوم" : "Today's classes"}</h2>
          <Link href="/admin/schedule" className="text-sm text-primary-600">{ar ? "كل الجدول ›" : "Full schedule ›"}</Link>
        </div>
        <div className="card divide-y divide-outline">
          {schedule.length === 0 ? (
            <p className="p-6 text-center text-status-full">{ar ? "لا توجد حصص اليوم." : "No classes today."}</p>
          ) : (
            schedule.map((c) => (
              <Link key={c.id} href={`/admin/class/${c.id}`} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-primary-900">{ar ? c.name_ar : c.name_en}</p>
                  <p className="text-xs text-status-full">
                    {fmtTime(c.starts_at, locale)} · {levelLabel(c.level, locale)}
                    {(ar ? c.instructor_ar : c.instructor_en) ? ` · ${ar ? c.instructor_ar : c.instructor_en}` : ""}
                  </p>
                </div>
                <div className="text-sm text-status-full">
                  {c.confirmed}/{c.capacity}
                  {c.waitlist ? ` · +${c.waitlist} ${ar ? "انتظار" : "wait"}` : ""}
                  <span className="chevron"> ›</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="font-display text-3xl font-medium text-primary">{value}</p>
      <p className="text-xs text-status-full">{label}</p>
    </div>
  );
}
