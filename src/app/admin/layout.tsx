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
    { href: "/admin", label: ar ? "اللوحة" : "Dashboard" },
    { href: "/admin/schedule", label: ar ? "الجدول" : "Schedule" },
    { href: "/admin/members", label: ar ? "الأعضاء" : "Members" },
    { href: "/admin/reports", label: ar ? "التقارير" : "Reports" },
  ];

  return (
    <div dir={dirFor(locale)} className="mx-auto max-w-3xl space-y-5 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-primary-800">{ar ? "لوحة الإدارة · ÉLAN" : "Admin · ÉLAN"}</h1>
        <Link href="/" className="text-sm text-primary-600">{ar ? "التطبيق ›" : "App ›"}</Link>
      </header>
      <AdminNav items={nav} />
      {children}
    </div>
  );
}
