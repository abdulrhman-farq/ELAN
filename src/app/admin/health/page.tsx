import { getServerSupabase } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale-server";
import { DEMO } from "@/lib/demo";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

type Check = { label: string; status: "ok" | "warn" | "fail" | "info"; detail: string };

export default async function HealthPage() {
  await requireAdmin();
  const ar = (await getLocale()) === "ar";
  const supabase = await getServerSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const any = (t: string): any => (supabase as unknown as { from: (x: string) => any }).from(t);
  const nowIso = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function count(table: string, build?: (q: any) => any): Promise<{ n: number | null; err?: string }> {
    try {
      let q = any(table).select("*", { count: "exact", head: true });
      if (build) q = build(q);
      const { count, error } = await q;
      if (error) return { n: null, err: error.message };
      return { n: count ?? 0 };
    } catch (e) {
      return { n: null, err: e instanceof Error ? e.message : String(e) };
    }
  }

  const [types, upcoming, trainers, packs, plans, members, admins, pendingPays] = await Promise.all([
    count("class_types"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count("class_instances", (q: any) => q.gte("starts_at", nowIso).eq("status", "scheduled")),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count("instructors", (q: any) => q.eq("active", true)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count("credit_packs", (q: any) => q.eq("active", true)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count("membership_plans", (q: any) => q.eq("active", true)),
    count("members"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count("admin_users", (q: any) => q.eq("active", true)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count("payments", (q: any) => q.eq("status", "initiated")),
  ]);

  const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "default").replace(/^https?:\/\//, "").split(".")[0];
  const gatewayReady = Boolean(process.env.PAYMENT_WEBHOOK_SECRET && (process.env.SUPABASE_SERVICE_ROLE_KEY));

  const t = (a: string, e: string) => (ar ? a : e);
  const checks: Check[] = [
    types.n !== null
      ? { label: t("الاتصال بقاعدة البيانات", "Database connection"), status: "ok", detail: t("متصل", "Connected") }
      : { label: t("الاتصال بقاعدة البيانات", "Database connection"), status: "fail", detail: types.err ?? t("فشل الاتصال", "Connection failed") },
    { label: t("مشروع قاعدة البيانات", "Database project"), status: "info", detail: ref },
    {
      label: t("وضع العرض التجريبي (Demo)", "Demo mode"),
      status: DEMO ? "warn" : "ok",
      detail: DEMO ? t("مُفعّل — يجب إطفاؤه في الإنتاج", "ON — must be off in production") : t("مُطفأ", "Off"),
    },
    {
      label: t("حصص قادمة مجدولة", "Upcoming scheduled classes"),
      status: upcoming.n === null ? "fail" : upcoming.n > 0 ? "ok" : "warn",
      detail: upcoming.n === null ? (upcoming.err ?? "—") : `${upcoming.n}`,
    },
    {
      label: t("مدرّبات نشطات", "Active trainers"),
      status: trainers.n === null ? "fail" : trainers.n > 0 ? "ok" : "warn",
      detail: trainers.n === null ? (trainers.err ?? "—") : `${trainers.n}`,
    },
    {
      label: t("باقات/عضويات متاحة", "Packs / memberships available"),
      status: packs.n === null || plans.n === null ? "warn" : (packs.n + plans.n) > 0 ? "ok" : "warn",
      detail: `${ar ? "باقات" : "packs"}: ${packs.n ?? "—"} · ${ar ? "عضويات" : "plans"}: ${plans.n ?? "—"}`,
    },
    {
      label: t("حساب مدير مفعّل", "Active admin account"),
      status: admins.n === null ? "info" : admins.n > 0 ? "ok" : "fail",
      detail: admins.n === null ? t("غير مقروء", "not readable") : `${admins.n}`,
    },
    { label: t("عدد العضوات", "Members"), status: "info", detail: `${members.n ?? "—"}` },
    {
      label: t("مدفوعات بانتظار التأكيد", "Payments awaiting confirmation"),
      status: pendingPays.n && pendingPays.n > 0 ? "warn" : "ok",
      detail: `${pendingPays.n ?? 0}`,
    },
    {
      label: t("بوابة الدفع الآلية", "Automatic payment gateway"),
      status: gatewayReady ? "ok" : "info",
      detail: gatewayReady ? t("مهيّأة", "Configured") : t("غير مهيّأة — التأكيد يدوي من الإدارة", "Not configured — admin confirms manually"),
    },
  ];

  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;
  const overall = fails > 0 ? "fail" : warns > 0 ? "warn" : "ok";
  const dot = (s: Check["status"]) =>
    s === "ok" ? "bg-sage" : s === "warn" ? "bg-accent" : s === "fail" ? "bg-danger" : "bg-status-full/40";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{t("فحص النظام", "System health")}</h1>
        <p className="text-meta text-status-full">{t("حالة المكوّنات الأساسية قبل وأثناء الإطلاق.", "Status of core components before and during launch.")}</p>
      </div>

      <div className={`card flex items-center gap-3 p-5 ${overall === "fail" ? "border border-danger" : ""}`}>
        <span className={`h-3 w-3 rounded-full ${dot(overall)}`} />
        <span className="text-lead font-medium text-primary-900">
          {overall === "ok" ? t("النظام سليم", "All systems healthy") : overall === "warn" ? t("جاهز مع ملاحظات", "Ready with notes") : t("يوجد خلل يمنع الاستخدام", "Problem detected")}
        </span>
        <span className="ms-auto text-meta text-status-full">{fails} ✕ · {warns} ⚠</span>
      </div>

      <div className="card divide-y divide-outline p-0">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-3 p-4">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot(c.status)}`} />
            <span className="flex-1 text-body text-primary-900">{c.label}</span>
            <span className="text-meta text-status-full">{c.detail}</span>
          </div>
        ))}
      </div>

      <div className="card p-5 text-meta text-status-full">
        <p className="mb-1 font-medium text-primary-700">{t("أين أرى الأخطاء؟", "Where to see errors?")}</p>
        <p>{t("• أخطاء المستخدم تظهر كصفحة خطأ عربية مع زر إعادة المحاولة.", "• User errors show a localized error page with retry.")}</p>
        <p>{t("• سجلّات الخادم: لوحة Vercel ← Project ← Logs (وRuntime errors).", "• Server logs: Vercel → Project → Logs (and Runtime errors).")}</p>
        <p>{t("• هذه الصفحة تعكس الحالة الحيّة عند كل تحديث.", "• This page reflects live status on each refresh.")}</p>
      </div>
    </div>
  );
}
