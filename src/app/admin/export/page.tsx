import { getLocale } from "@/lib/locale-server";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminExport() {
  await requireAdmin();
  const ar = (await getLocale()) === "ar";
  // Stable date stamp for filenames (Riyadh date).
  const stamp = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const sets: { type: string; label: [string, string] }[] = [
    { type: "members", label: ["العضوات", "Members"] },
    { type: "bookings", label: ["الحجوزات", "Bookings"] },
    { type: "payments", label: ["المدفوعات", "Payments"] },
    { type: "classes", label: ["الحصص", "Classes"] },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "نسخ احتياطي وتصدير" : "Backup & export"}</h1>
        <p className="text-meta text-status-full">{ar ? "نزّلي بياناتك كملفات CSV للحفظ" : "Download your data as CSV files to keep"}</p>
      </div>

      <div className="card divide-y divide-outline">
        {sets.map((s) => (
          <div key={s.type} className="flex items-center justify-between gap-3 p-4">
            <span className="text-body text-primary-900">{s.label[ar ? 0 : 1]}</span>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href={`/admin/export/download?type=${s.type}&stamp=${stamp}`}
              className="inline-flex min-h-[40px] items-center rounded-lg border border-outline px-4 text-sm font-medium text-primary-700"
            >
              {ar ? "تنزيل CSV" : "Download CSV"}
            </a>
          </div>
        ))}
      </div>

      <div className="card border-s-4 border-s-sage p-5">
        <h2 className="mb-2 font-display text-lead font-medium text-primary-900">{ar ? "النسخ الاحتياطي التلقائي" : "Automatic backups"}</h2>
        <p className="text-meta text-status-full">
          {ar
            ? "قاعدة البيانات (Supabase) تأخذ نسخة احتياطية يوميًا تلقائيًا مع إمكانية الاستعادة لأي لحظة (Point-in-time). للاستعادة: من لوحة Supabase → Database → Backups، اختاري النقطة الزمنية ثم Restore. ملفات CSV أعلاه نسخة إضافية يمكنكِ حفظها خارجيًا."
            : "The database (Supabase) takes an automatic daily backup with point-in-time restore. To restore: Supabase dashboard → Database → Backups → pick the timestamp → Restore. The CSV files above are an extra copy you can keep off-site."}
        </p>
      </div>
    </div>
  );
}
