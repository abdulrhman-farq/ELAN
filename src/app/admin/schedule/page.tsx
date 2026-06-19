import { getLocale } from "@/lib/locale-server";
import { adminMock as M } from "@/lib/adminMock";

export const dynamic = "force-dynamic";

export default async function AdminSchedule() {
  const ar = (await getLocale()) === "ar";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "الجدول والحصص" : "Schedule"}</h1>
          <p className="text-[13px] text-status-full">{ar ? "إدارة حصص هذا الأسبوع · اضغطي على أي حصة للتعديل" : "Manage this week's classes"}</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-[10px] border border-outline px-4 py-3 text-sm text-primary">{ar ? "نسخ الأسبوع" : "Copy week"}</button>
          <button className="rounded-[10px] bg-primary px-4 py-3 text-sm font-semibold text-ink">{ar ? "+ إضافة حصة" : "+ Add"}</button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {M.weekDays.map((d, i) => (
          <div key={i} className={`flex min-w-[5rem] flex-col items-center rounded-[14px] px-4 py-2 ${d.active ? "bg-primary text-ink" : "border border-outline bg-surface-variant text-primary-900"}`}>
            <span className="text-[11px]">{d.day}</span>
            <span className="font-display text-lg">{d.num}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {M.weekClasses.map((c, i) => (
          <div key={i} className="card flex items-stretch overflow-hidden p-0">
            <div className="w-1.5 shrink-0" style={{ background: c.accent }} />
            <div className="flex-1 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg text-primary-900">{c.name}</h3>
                <span className={`text-[12px] ${c.open ? "text-sage" : "text-primary"}`}>{c.status}</span>
              </div>
              <p className="mt-1 text-[12px] text-status-full">{c.time}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-outline pt-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant font-display text-sm text-primary">{c.initial}</div>
                <span className="flex-1 text-[13px] text-primary-900">{ar ? `المدرّبة ${c.instr}` : c.instr}</span>
                <div className="text-end">
                  <div className="text-[11px] text-status-full">{c.note}</div>
                  <div className="font-display text-base text-primary-900">{c.occ}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
