import { getLocale } from "@/lib/locale-server";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

// Studio configuration. Static for now — wire to a settings table when needed.
const S = {
  name: "ÉLAN — استوديو بيلاتس للسيدات",
  city: "الرياض",
  phone: "+966 11 234 5678",
  bookingWindow: "٧ أيام",
  cancellation: "قبل ٤ ساعات",
  maxBookings: "٣ حصص",
  notifications: ["تذكير قبل الحصة بساعة", "إشعار قائمة الانتظار", "تنبيه انتهاء الباقة"],
};

export default async function AdminSettings() {
  await requireAdmin();
  const ar = (await getLocale()) === "ar";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "الإعدادات" : "Settings"}</h1>
        <p className="text-[13px] text-status-full">{ar ? "إدارة معلومات الاستوديو والحجز والإشعارات" : "Studio info, booking and notifications"}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title={ar ? "معلومات الاستوديو" : "Studio info"}>
          <Row label={ar ? "اسم الاستوديو" : "Studio name"} value={S.name} />
          <Row label={ar ? "المدينة" : "City"} value={S.city} />
          <Row label={ar ? "الهاتف" : "Phone"} value={S.phone} />
        </Section>

        <Section title={ar ? "سياسة الحجز" : "Booking policy"}>
          <Row label={ar ? "فتح الحجز قبل الحصة بـ" : "Booking opens before"} value={S.bookingWindow} />
          <Row label={ar ? "الإلغاء المجاني حتى" : "Free cancellation until"} value={S.cancellation} />
          <Row label={ar ? "الحد الأقصى للحجوزات المتزامنة" : "Max concurrent bookings"} value={S.maxBookings} />
        </Section>

        <Section title={ar ? "الإشعارات" : "Notifications"}>
          {S.notifications.map((n, i) => (
            <div key={i} className="flex items-center justify-between border-b border-outline py-3 text-[14px] text-primary-900 last:border-0">
              <span>{n}</span>
              <span className="flex h-5 w-9 items-center rounded-pill bg-primary px-0.5"><span className="ms-auto h-4 w-4 rounded-full bg-ink" /></span>
            </div>
          ))}
        </Section>

        <Section title={ar ? "اللغة والمظهر" : "Language & appearance"}>
          <div className="flex items-center justify-between border-b border-outline py-3 text-[14px]">
            <span className="text-primary-900">{ar ? "لغة الواجهة" : "Interface language"}</span>
            <span className="flex gap-2">
              <span className="rounded-pill bg-primary px-3 py-1 text-[12px] text-ink">العربية</span>
              <span className="rounded-pill border border-outline px-3 py-1 text-[12px] text-status-full">English</span>
            </span>
          </div>
          <div className="flex items-center justify-between py-3 text-[14px]">
            <span className="text-primary-900">{ar ? "لون العلامة" : "Brand colour"}</span>
            <span className="h-6 w-6 rounded-full" style={{ background: "#B89B72" }} />
          </div>
        </Section>
      </div>

      <button className="rounded-[10px] bg-primary px-6 py-3 text-sm font-semibold text-ink">{ar ? "حفظ التغييرات" : "Save changes"}</button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-3 font-display text-lg font-medium text-primary-900">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline py-3 text-[14px] last:border-0">
      <span className="text-status-full">{label}</span>
      <span className="text-primary-900">{value}</span>
    </div>
  );
}
