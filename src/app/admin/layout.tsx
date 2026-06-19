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
    { href: "/admin/reports", label: ar ? "التقارير المالية" : "Reports" },
  ];

  return (
    <div dir={dirFor(locale)} className="mx-auto flex min-h-screen max-w-[1200px] flex-col md:flex-row">
      <aside className="card-ink flex flex-col gap-8 rounded-none p-7 md:w-[230px] md:shrink-0">
        <div className="wordmark text-3xl">ÉLAN</div>
        <AdminNav items={nav} />
        <Link href="/" className="mt-auto text-sm text-primary-900/60 hover:text-primary-900">{ar ? "التطبيق ›" : "App ›"}</Link>
      </aside>
      <main className="flex-1 space-y-6 p-6 md:p-8">{children}</main>
    </div>
  );
}
