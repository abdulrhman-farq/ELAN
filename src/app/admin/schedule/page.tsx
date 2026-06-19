import { getLocale } from "@/lib/locale-server";
import { adminMock as M } from "@/lib/adminMock";
import { classImage } from "@/lib/classColor";

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
          <div key={i} className="card overflow-hidden p-0">
            <div className="relative h-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={classImage(c.name)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(17,13,10,.85))" }} />
              <span className={`absolute end-3 top-3 rounded-pill px-2.5 py-1 text-[11px] font-medium ${c.open ? "bg-sage text-ink" : "bg-surface-elevated/90 text-accent"}`}>{c.status}</span>
              <h3 className="absolute inset-x-4 bottom-3 font-display text-lg font-medium text-ink">{c.name}</h3>
            </div>
            <div className="p-5">
              <p className="text-[12px] text-status-full">{c.time}</p>
              <div className="mt-3 flex items-center gap-3 border-t border-outline pt-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant font-display text-sm text-primary-700">{c.initial}</div>
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
