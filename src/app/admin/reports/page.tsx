import { getLocale } from "@/lib/locale-server";
import { getReports } from "@/lib/admin";

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

export default async function AdminReportsPage() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const r = await getReports();
  const sar = ar ? "ر.س" : "SAR";

  const typeLabels: Record<string, string> = {
    membership: ar ? "العضويات" : "Memberships",
    credit_pack: ar ? "باقات الحصص" : "Credit packs",
    penalty: ar ? "الغرامات" : "Penalties",
  };
  const bookingRows = Object.entries(r.bookingsByStatus).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <h2 className="font-semibold text-primary-800">{ar ? "التقارير · آخر 30 يوماً" : "Reports · last 30 days"}</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-700">{r.revenue30} {sar}</p>
          <p className="text-xs text-status-full">{ar ? "إجمالي الإيراد" : "Total revenue"}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-700">{r.paymentsCount}</p>
          <p className="text-xs text-status-full">{ar ? "عدد المدفوعات" : "Payments"}</p>
        </div>
      </div>

      <section className="space-y-2">
        <h3 className="font-semibold text-primary-800">{ar ? "الإيراد حسب النوع" : "Revenue by type"}</h3>
        <div className="card divide-y divide-outline">
          {(["membership", "credit_pack", "penalty"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between p-4">
              <span className="text-sm text-primary-900">{typeLabels[k]}</span>
              <span className="text-sm font-semibold text-primary-700">{r.revenueByType[k]} {sar}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-primary-800">{ar ? "الحجوزات حسب الحالة" : "Bookings by status"}</h3>
        <div className="card divide-y divide-outline">
          {bookingRows.length === 0 ? (
            <p className="p-6 text-center text-status-full">{ar ? "لا توجد بيانات." : "No data."}</p>
          ) : (
            bookingRows.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-4">
                <span className="text-sm text-primary-900">{bstatusLabel(status, ar)}</span>
                <span className="text-sm font-semibold text-primary-700">{count}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
