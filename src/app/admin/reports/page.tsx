import { getLocale } from "@/lib/locale-server";
import { adminMock as M } from "@/lib/adminMock";

export const dynamic = "force-dynamic";

export default async function AdminReports() {
  const ar = (await getLocale()) === "ar";
  const R = M.reports;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "التقارير المالية" : "Financial reports"}</h1>
          <p className="text-[13px] text-status-full">{ar ? "يونيو ٢٠٢٦" : "June 2026"}</p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-pill bg-primary px-4 py-2 text-[13px] text-ink">{ar ? "شهري" : "Monthly"}</span>
          <span className="rounded-pill border border-outline px-4 py-2 text-[13px] text-status-full">{ar ? "ربع سنوي" : "Quarterly"}</span>
          <button className="rounded-[10px] border border-outline px-4 py-2 text-[13px] text-primary">{ar ? "تصدير PDF" : "Export PDF"}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "إيراد يونيو" : "June revenue"} value={R.revenueMonth} note={R.revNote} good />
        <Kpi label={ar ? "اشتراكات جديدة" : "New subscriptions"} value={R.newSubs} note={R.newSubsNote} good />
        <Kpi label={ar ? "متوسط قيمة العضوة" : "Avg member value"} value={R.avgValue} note={ar ? "ريال شهريًا" : "SAR / month"} />
        <Kpi label={ar ? "نسبة الاحتفاظ" : "Retention"} value={R.retention} note={R.retentionNote} good />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-5 font-display text-lg font-medium text-primary-900">{ar ? "الإيراد عبر الأشهر" : "Revenue by month"}</h2>
          <div className="flex h-44 items-end justify-around gap-3">
            {R.byMonth.map((b, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-t-[8px]" style={{ height: `${b.v}%`, background: "linear-gradient(180deg,#E4C58E,#D6B47A)" }} />
                <span className="text-[11px] text-status-full">{b.m}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-display text-lg font-medium text-primary-900">{ar ? "الإيراد حسب الباقة" : "Revenue by plan"}</h2>
          <div className="space-y-4">
            {R.byPackage.map((p, i) => (
              <div key={i}>
                <div className="mb-1.5 flex justify-between text-[13px]"><span className="text-primary-900">{p.name}</span><span className="text-primary">{p.pct}٪</span></div>
                <div className="h-2 overflow-hidden rounded-pill bg-surface-variant">
                  <div className="h-full rounded-pill" style={{ width: `${p.pct}%`, background: "linear-gradient(90deg,#D6B47A,#E4C58E)" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, good }: { label: string; value: string; note: string; good?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-[12px] text-status-full">{label}</div>
      <div className="mt-2 font-display text-3xl text-primary-900">{value}</div>
      <div className={`text-[11px] ${good ? "text-sage" : "text-status-full"}`}>{note}</div>
    </div>
  );
}
