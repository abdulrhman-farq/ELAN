import { getLocale } from "@/lib/locale-server";
import { getAdminSchedule, getScheduleFormOptions, type ScheduleRow } from "@/lib/admin";
import { fmtTime, fmtDayHeading } from "@/lib/format";
import { classImage } from "@/lib/classColor";
import { ScheduleGenerator } from "@/components/admin/ScheduleGenerator";

export const dynamic = "force-dynamic";

export default async function AdminSchedule() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const [rows, opts] = await Promise.all([getAdminSchedule(14), getScheduleFormOptions()]);

  // Group by calendar day.
  const groups = new Map<string, ScheduleRow[]>();
  for (const r of rows) {
    const key = r.starts_at.slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "الجدول والحصص" : "Schedule"}</h1>
          <p className="text-meta text-status-full">{ar ? "حصص الأسبوعين القادمين" : "Classes for the next two weeks"}</p>
        </div>
        <ScheduleGenerator ar={ar} classTypes={opts.classTypes} instructors={opts.instructors} />
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-body text-status-full">
          {ar ? "لا توجد حصص مجدولة. أضيفي حصصًا لتظهر هنا." : "No classes scheduled yet."}
        </div>
      ) : (
        [...groups.entries()].map(([day, list]) => (
          <section key={day} className="space-y-3">
            <h2 className="font-display text-lead font-medium text-primary-900">{fmtDayHeading(list[0].starts_at, locale)}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {list.map((c) => {
                const full = c.confirmed >= c.capacity;
                return (
                  <div key={c.id} className="card overflow-hidden p-0">
                    <div className="relative h-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={classImage(c.name_en)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(17,13,10,.85))" }} />
                      <span className={`absolute end-3 top-3 rounded-pill px-2.5 py-1 text-caption font-medium ${c.status === "cancelled" ? "bg-danger text-ink" : full ? "bg-surface-elevated/90 text-primary-700" : "bg-sage text-ink"}`}>
                        {c.status === "cancelled" ? (ar ? "ملغاة" : "Cancelled") : full ? (ar ? "مكتملة" : "Full") : ar ? "مفتوحة" : "Open"}
                      </span>
                      <h3 className="absolute inset-x-4 bottom-3 font-display text-lead font-medium text-ink">{c.name_en}</h3>
                    </div>
                    <div className="p-5">
                      <p className="font-number text-meta text-status-full">{fmtTime(c.starts_at, locale)}</p>
                      <div className="mt-3 flex items-center gap-3 border-t border-outline pt-3">
                        <span className="flex-1 text-body text-primary-900">{(ar ? c.instructor_ar : c.instructor_en) ?? "—"}</span>
                        <div className="text-end">
                          <div className="text-caption text-status-full">{ar ? "الإشغال" : "Booked"}{c.waitlist > 0 ? ` · ${c.waitlist} ${ar ? "بالانتظار" : "waiting"}` : ""}</div>
                          <div className="font-number text-body text-primary-900">{c.confirmed} / {c.capacity}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
