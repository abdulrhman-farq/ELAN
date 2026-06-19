import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale-server";
import { dirFor } from "@/lib/i18n";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) redirect("/");

  const locale = await getLocale();
  const ar = locale === "ar";
  const nav = [
    { href: "/admin", label: ar ? "لوحة التحكم" : "Dashboard" },
    { href: "/admin/schedule", label: ar ? "الجدول والحصص" : "Schedule" },
    { href: "/admin/members", label: ar ? "الأعضاء" : "Members" },
    { href: "/admin/trainers", label: ar ? "المدرّبات" : "Trainers" },
    { href: "/admin/reports", label: ar ? "التقارير المالية" : "Reports" },
    { href: "/admin/settings", label: ar ? "الإعدادات" : "Settings" },
  ];

  return (
    <div dir={dirFor(locale)} className="mx-auto flex min-h-screen max-w-[1200px] flex-col md:flex-row">
      <aside className="flex flex-col gap-8 border-b border-white/10 bg-brand p-7 text-ink md:w-[230px] md:shrink-0 md:border-b-0 md:border-e">
        <div className="wordmark text-3xl text-accent">ÉLAN</div>
        <AdminNav items={nav} />
        <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-display text-base text-primary-900">م</div>
          <div>
            <div className="text-[13px] text-ink">{ar ? "مديرة الاستوديو" : "Studio manager"}</div>
            <div className="text-[11px] text-ink/50">{ar ? "الرياض" : "Riyadh"}</div>
          </div>
        </div>
        <Link href="/" className="text-sm text-ink/60 hover:text-ink">{ar ? "التطبيق ›" : "App ›"}</Link>
      </aside>
      <main className="flex-1 space-y-6 p-6 md:p-8">{children}</main>
    </div>
  );
}
