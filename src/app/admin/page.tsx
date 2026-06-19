import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale-server";
import { dayBoundsUtc, todayInRiyadh, fmtTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) redirect("/");

  const locale = await getLocale();
  const ar = locale === "ar";
  const { start, end } = dayBoundsUtc(todayInRiyadh());

  const { data: rows } = await supabase
    .from("class_instances")
    .select("id,starts_at,capacity,class_types(name_ar,name_en)")
    .gte("starts_at", start).lt("starts_at", end).order("starts_at");
  const classes = rows ?? [];

  const { data: avail } = await supabase
    .from("class_instance_availability").select("class_instance_id,confirmed_count,waitlist_count")
    .in("class_instance_id", classes.map((c) => c.id));
  const am = new Map((avail ?? []).map((a) => [a.class_instance_id, a]));

  const { data: pays } = await supabase
    .from("payments").select("amount_sar,status,created_at").gte("created_at", start).eq("status", "paid");
  const revenue = (pays ?? []).reduce((s, p) => s + Number(p.amount_sar), 0);

  const totalBooked = classes.reduce((s, c) => s + (am.get(c.id)?.confirmed_count ?? 0), 0);
  const totalCap = classes.reduce((s, c) => s + c.capacity, 0);

  return (
    <div dir={ar ? "rtl" : "ltr"} className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-800">{ar ? "لوحة الإدارة · إيلان" : "Admin · ELAN"}</h1>
        <Link href="/" className="text-sm text-primary-600">{ar ? "التطبيق ›" : "App ›"}</Link>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={ar ? "حصص اليوم" : "Classes today"} value={String(classes.length)} />
        <Stat label={ar ? "نسبة الإشغال" : "Fill rate"} value={totalCap ? `${Math.round((totalBooked / totalCap) * 100)}%` : "—"} />
        <Stat label={ar ? "إيراد اليوم" : "Revenue today"} value={`${revenue} ${ar ? "ر.س" : "SAR"}`} />
      </div>

      <div className="card divide-y divide-outline">
        {classes.length === 0 ? (
          <p className="p-6 text-center text-status-full">{ar ? "لا توجد حصص اليوم." : "No classes today."}</p>
        ) : (
          classes.map((c) => {
            const av = am.get(c.id);
            return (
              <div key={c.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-primary-900">{ar ? c.class_types?.name_ar : c.class_types?.name_en}</p>
                  <p className="text-xs text-status-full">{fmtTime(c.starts_at, locale)}</p>
                </div>
                <div className="text-sm text-status-full">
                  {av?.confirmed_count ?? 0}/{c.capacity}
                  {av?.waitlist_count ? ` · +${av.waitlist_count} ${ar ? "انتظار" : "wait"}` : ""}
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-center text-xs text-status-full">
        {ar
          ? "هذه نسخة عرض للوحة الإدارة. إدارة الجدول والأعضاء والتقارير قيد الإكمال."
          : "Read-only admin preview. Schedule, members, and reports management are in progress."}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-2xl font-bold text-primary-700">{value}</p>
      <p className="text-xs text-status-full">{label}</p>
    </div>
  );
}
