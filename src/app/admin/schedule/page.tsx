import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getAdminSchedule, type ScheduleRow } from "@/lib/admin";
import { fmtTime, fmtDayHeading, levelLabel, todayInRiyadh } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const rows = await getAdminSchedule(14);

  // Group by Riyadh calendar day.
  const groups = new Map<string, ScheduleRow[]>();
  for (const r of rows) {
    const key = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh" }).format(new Date(r.starts_at));
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
  }
  const today = todayInRiyadh();

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-primary-800">{ar ? "الجدول · الأيام القادمة" : "Schedule · upcoming"}</h2>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-status-full">{ar ? "لا توجد حصص مجدولة." : "No scheduled classes."}</div>
      ) : (
        [...groups.entries()].map(([day, list]) => (
          <section key={day} className="space-y-2">
            <h3 className="text-sm font-semibold text-status-full">
              {day === today ? (ar ? "اليوم" : "Today") : fmtDayHeading(list[0].starts_at, locale)}
            </h3>
            <div className="card divide-y divide-outline">
              {list.map((c) => {
                const cancelled = c.status === "cancelled";
                return (
                  <Link
                    key={c.id}
                    href={`/admin/class/${c.id}`}
                    className={`flex items-center justify-between p-4 ${cancelled ? "opacity-50" : ""}`}
                  >
                    <div>
                      <p className="font-medium text-primary-900">
                        {ar ? c.name_ar : c.name_en}
                        {cancelled ? ` · ${ar ? "ملغاة" : "Cancelled"}` : ""}
                      </p>
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
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
