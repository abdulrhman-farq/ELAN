import { getLocale } from "@/lib/locale-server";
import { getReports } from "@/lib/admin";
import { fmtHalalas } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const BSTATUS: Record<string, [string, string]> = {
  confirmed: ["مؤكد", "Confirmed"],
  waitlisted: ["قائمة الانتظار", "Waitlisted"],
  attended: ["تم الحضور", "Attended"],
  cancelled: ["ملغي", "Cancelled"],
  late_cancelled: ["إلغاء متأخر", "Late cancelled"],
  no_show: ["لم تحضر", "No-show"],
};

const PTYPE: Record<string, [string, string]> = {
  membership: ["العضويات", "Memberships"],
  credit_pack: ["باقات الحصص", "Credit packs"],
  single_class: ["حصص مفردة", "Single classes"],
  private_session: ["جلسات خاصة", "Private sessions"],
  penalty: ["الغرامات", "Penalties"],
};

export default async function AdminReports({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const ar = locale === "ar";
  const days = Math.min(365, Math.max(1, Number.parseInt(sp.days ?? "30", 10) || 30));
  const r = await getReports(days);
  const sar = (h: number) => `${fmtHalalas(h, ar ? "ar" : "en")} ${ar ? "ر.س" : "SAR"}`;
  const bookings = Object.entries(r.bookingsByStatus).sort((a, b) => b[1] - a[1]);
  const types = Object.entries(r.revenueByType).sort((a, b) => b[1] - a[1]);
  const maxType = Math.max(1, ...types.map(([, v]) => v));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "التقارير المالية" : "Financial reports"}</h1>
        <p className="text-meta text-status-full">{ar ? `آخر ${days} يومًا · الأرقام بالريال شاملة منطق ضريبة القيمة المضافة` : `Last ${days} days · VAT-aware`}</p>
      </div>

      {/* Cash sales breakdown */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "المبيعات الإجمالية (شامل الضريبة)" : "Gross sales (incl. VAT)"} value={sar(r.grossHalalas)} strong />
        <Kpi label={ar ? "المبيعات الصافية" : "Net sales"} value={sar(r.netHalalas)} />
        <Kpi label={ar ? "ضريبة القيمة المضافة" : "VAT collected"} value={sar(r.vatHalalas)} />
        <Kpi label={ar ? "إجمالي الخصومات" : "Discounts given"} value={sar(r.discountsHalalas)} />
      </div>

      {/* Value flows that are NOT cash revenue */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "استهلاك باقات الحصص" : "Package utilization"} value={sar(r.packageUtilHalalas)} sub />
        <Kpi label={ar ? "استهلاك العضويات غير المحدودة" : "Unlimited utilization"} value={sar(r.unlimitedUtilHalalas)} sub />
        <Kpi label={ar ? "قيمة الحصص المجانية" : "Complimentary value"} value={sar(r.compValueHalalas)} sub />
        <Kpi label={ar ? "قيمة عدم الحضور المفقودة" : "No-show lost value"} value={sar(r.noShowLostHalalas)} sub />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-5 font-display text-lead font-medium text-primary-900">{ar ? "الإيراد حسب النوع" : "Revenue by type"}</h2>
          {types.length === 0 ? (
            <p className="py-6 text-center text-body text-status-full">{ar ? `لا توجد مدفوعات في آخر ${days} يومًا.` : `No payments in the last ${days} days.`}</p>
          ) : (
            <div className="space-y-4">
              {types.map(([type, v]) => (
                <div key={type}>
                  <div className="mb-1.5 flex justify-between text-body">
                    <span className="text-primary-900">{PTYPE[type]?.[ar ? 0 : 1] ?? type}</span>
                    <span className="font-number text-primary-700">{sar(v)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-pill bg-surface-variant">
                    <div className="h-full rounded-pill" style={{ width: `${Math.round((v / maxType) * 100)}%`, background: "linear-gradient(90deg,#B89B72,#C8A98A)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-display text-lead font-medium text-primary-900">{ar ? "الحجوزات حسب الحالة" : "Bookings by status"}</h2>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-body text-status-full">{ar ? `لا توجد حجوزات في آخر ${days} يومًا.` : `No bookings in the last ${days} days.`}</p>
          ) : (
            <div className="space-y-3">
              {bookings.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between border-b border-outline pb-2 text-body last:border-0">
                  <span className="text-primary-900">{BSTATUS[status]?.[ar ? 0 : 1] ?? status}</span>
                  <span className="font-number text-primary-700">{count}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 text-body">
                <span className="text-status-full">{ar ? "قيمة الإلغاءات" : "Cancellation value"}</span>
                <span className="font-number text-status-full">{sar(r.cancellationValueHalalas)}</span>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, strong, sub }: { label: string; value: string; strong?: boolean; sub?: boolean }) {
  return (
    <div className={sub ? "card p-5 bg-surface-variant/40" : "card p-5"}>
      <div className="text-caption text-status-full">{label}</div>
      <div className={`mt-2 font-number ${strong ? "text-2xl text-primary-900" : "text-xl text-primary-900"}`}>{value}</div>
    </div>
  );
}
