import { getLocale } from "@/lib/locale-server";
import { adminMock as M } from "@/lib/adminMock";

export const dynamic = "force-dynamic";

export default async function AdminTrainers() {
  const ar = (await getLocale()) === "ar";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "المدرّبات" : "Trainers"}</h1>
          <p className="text-[13px] text-status-full">{ar ? "٤ مدرّبات · ٢٦ حصة هذا الأسبوع" : "4 trainers · 26 classes this week"}</p>
        </div>
        <button className="rounded-[10px] bg-primary px-4 py-3 text-sm font-semibold text-ink">{ar ? "+ إضافة مدرّبة" : "+ Add trainer"}</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {M.trainers.map((tr, i) => (
          <div key={i} className="card flex items-center gap-4 p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-display text-2xl text-ink" style={{ background: tr.accent }}>{tr.initial}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-primary-900">{tr.name}</h3>
                <span className="rounded-pill bg-surface-variant px-2.5 py-0.5 text-[10px] text-primary">{tr.tag}</span>
              </div>
              <p className="mt-0.5 text-[12px] text-status-full">{tr.desc}</p>
              <div className="mt-2 flex items-center gap-3 text-[12px]">
                <span className="text-primary-900/80">{tr.classes}</span>
                <span className="text-status-full">·</span>
                <span className="text-primary">★ {tr.rating}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
