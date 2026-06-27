import { getLocale } from "@/lib/locale-server";
import { getRecentAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ACTION: Record<string, [string, string]> = {
  sale: ["بيع", "Sale"],
  package_sale: ["بيع باقة", "Package sale"],
  discount_applied: ["تطبيق خصم", "Discount applied"],
  comp: ["حصة مجانية", "Complimentary"],
  mark_paid: ["تأكيد الدفع", "Marked paid"],
  refund: ["استرداد", "Refund"],
  promo_created: ["إنشاء كود خصم", "Promo created"],
  promo_toggle: ["تبديل كود خصم", "Promo toggled"],
  cancel_class: ["إلغاء حصة", "Class cancelled"],
  delete_class: ["حذف حصة", "Class deleted"],
  edit_class: ["تعديل حصة", "Class edited"],
  generate: ["توليد جدول", "Schedule generated"],
  link_auth: ["ربط دخول مدرّبة", "Trainer access linked"],
  unlink_auth: ["إلغاء دخول مدرّبة", "Trainer access revoked"],
  suspend: ["إيقاف عضوة", "Member suspended"],
  lift_suspension: ["رفع إيقاف", "Suspension lifted"],
  broadcast: ["إعلان جماعي", "Broadcast sent"],
};

const ENTITY: Record<string, [string, string]> = {
  payment: ["دفعة", "Payment"],
  booking: ["حجز", "Booking"],
  promo: ["كود خصم", "Promo"],
  class_instance: ["حصة", "Class"],
  schedule: ["الجدول", "Schedule"],
  instructor: ["مدرّبة", "Trainer"],
  member: ["عضوة", "Member"],
  broadcast: ["إعلان", "Broadcast"],
};

export default async function AdminAudit() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const rows = await getRecentAudit(100);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Riyadh",
    }).format(new Date(iso));

  return (
    <div className="space-y-6" dir={ar ? "rtl" : "ltr"}>
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">
          {ar ? "سجل التدقيق" : "Audit log"}
        </h1>
        <p className="text-meta text-status-full">
          {ar ? "أحدث ١٠٠ عملية · من ذ / متى / لماذا / قبل ← بعد" : "Latest 100 events · who / when / why / old → new"}
        </p>
      </div>

      <section className="card p-6">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-body text-status-full">
            {ar ? "لا توجد عمليات مسجلة بعد." : "No audit events recorded yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body">
              <thead>
                <tr className="border-b border-outline text-caption text-status-full">
                  <th className="py-2 pe-4 text-start font-medium">{ar ? "التاريخ" : "Date"}</th>
                  <th className="py-2 pe-4 text-start font-medium">{ar ? "العملية" : "Action"}</th>
                  <th className="py-2 pe-4 text-start font-medium">{ar ? "العنصر" : "Entity"}</th>
                  <th className="py-2 pe-4 text-start font-medium">{ar ? "الحقل" : "Field"}</th>
                  <th className="py-2 pe-4 text-start font-medium">{ar ? "قبل ← بعد" : "Old → New"}</th>
                  <th className="py-2 pe-4 text-start font-medium">{ar ? "السبب" : "Reason"}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-outline last:border-0 align-top">
                    <td className="py-2.5 pe-4 whitespace-nowrap font-number text-primary-700">{fmtDate(r.created_at)}</td>
                    <td className="py-2.5 pe-4 text-primary-900">{ACTION[r.action]?.[ar ? 0 : 1] ?? r.action}</td>
                    <td className="py-2.5 pe-4 text-primary-900">
                      {ENTITY[r.entity_type]?.[ar ? 0 : 1] ?? r.entity_type}
                      {r.entity_id ? (
                        <span className="ms-1 font-number text-caption text-status-full">{r.entity_id.slice(0, 8)}</span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pe-4 text-status-full">{r.field ?? "—"}</td>
                    <td className="py-2.5 pe-4 font-number text-primary-700">
                      {r.old_value != null || r.new_value != null ? (
                        <span>
                          <span className="text-status-full">{r.old_value ?? "—"}</span>
                          <span className="mx-1.5 text-status-full">{ar ? "←" : "→"}</span>
                          <span className="text-primary-900">{r.new_value ?? "—"}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 pe-4 text-status-full">{r.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
