import { getLocale } from "@/lib/locale-server";
import { getReports } from "@/lib/admin";

export const dynamic = "force-dynamic";

const BSTATUS: Record<string, [string, string]> = {
  confirmed: ["مؤكد", "Confirmed"],
  waitlisted: ["قائمة الانتظار", "Waitlisted"],
  attended: ["تم الحضور", "Attended"],
  cancelled: ["ملغي", "Cancelled"],
  late_cancelled: ["إلغاء متأخر", "Late cancelled"],
  no_show: ["لم تحضر", "No-show"],
};

export default async function AdminReports() {
  const ar = (await getLocale()) === "ar";
  const r = await getReports();
  const sar = (n: number) => n.toLocaleString(ar ? "ar-SA" : "en-US");

  const byType = [
    { key: "membership", ar: "العضويات", en: "Memberships", v: r.revenueByType.membership },
    { key: "credit_pack", ar: "باقات الحصص", en: "Credit packs", v: r.revenueByType.credit_pack },
    { key: "penalty", ar: "الغرامات", en: "Penalties", v: r.revenueByType.penalty },
  ];
  const maxType = Math.max(1, ...byType.map((t) => t.v));
  const bookings = Object.entries(r.bookingsByStatus).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "التقارير المالية" : "Financial reports"}</h1>
        <p className="text-meta text-status-full">{ar ? "آخر ٣٠ يومًا" : "Last 30 days"}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "الإيراد (٣٠ يوم)" : "Revenue (30d)"} value={`${sar(r.revenue30)} ${ar ? "ر.س" : "SAR"}`} />
        <Kpi label={ar ? "عدد المدفوعات" : "Payments"} value={sar(r.paymentsCount)} />
        <Kpi label={ar ? "إيراد العضويات" : "Membership rev."} value={sar(r.revenueByType.membership)} />
        <Kpi label={ar ? "إيراد الباقات" : "Pack rev."} value={sar(r.revenueByType.credit_pack)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="card p-6">
          <h2 className="mb-5 font-display text-lead font-medium text-primary-900">{ar ? "الإيراد حسب النوع" : "Revenue by type"}</h2>
          {r.revenue30 === 0 ? (
            <p className="py-6 text-center text-body text-status-full">{ar ? "لا توجد مدفوعات في آخر ٣٠ يومًا." : "No payments in the last 30 days."}</p>
          ) : (
            <div className="space-y-4">
              {byType.map((t) => (
                <div key={t.key}>
                  <div className="mb-1.5 flex justify-between text-body"><span className="text-primary-900">{ar ? t.ar : t.en}</span><span className="text-primary-700">{sar(t.v)}</span></div>
                  <div className="h-2 overflow-hidden rounded-pill bg-surface-variant">
                    <div className="h-full rounded-pill" style={{ width: `${Math.round((t.v / maxType) * 100)}%`, background: "linear-gradient(90deg,#D6B47A,#E4C58E)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-5 font-display text-lead font-medium text-primary-900">{ar ? "الحجوزات حسب الحالة" : "Bookings by status"}</h2>
          {bookings.length === 0 ? (
            <p className="py-6 text-center text-body text-status-full">{ar ? "لا توجد حجوزات في آخر ٣٠ يومًا." : "No bookings in the last 30 days."}</p>
          ) : (
            <div className="space-y-3">
              {bookings.map(([status, count]) => (
                <div key={status} className="flex items-center justify-between border-b border-outline pb-2 text-body last:border-0">
                  <span className="text-primary-900">{BSTATUS[status]?.[ar ? 0 : 1] ?? status}</span>
                  <span className="font-display text-primary-700">{count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-caption text-status-full">{label}</div>
      <div className="mt-2 font-display text-2xl text-primary-900">{value}</div>
    </div>
  );
}
