import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { getLocale } from "@/lib/locale-server";
import { dirFor } from "@/lib/i18n";
import { ToastProvider } from "@/components/Toast";
import { LogoutButton } from "@/components/Buttons";

export const dynamic = "force-dynamic";

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");
  const [{ data: isInstructor }, { data: isAdmin }] = await Promise.all([
    rpc<boolean>(supabase, "is_instructor"),
    rpc<boolean>(supabase, "is_admin"),
  ]);
  // Only linked, active instructors (or admins, for oversight) may enter.
  if (!isInstructor && !isAdmin) redirect("/");

  const locale = await getLocale();
  const ar = locale === "ar";

  return (
    <ToastProvider dismissLabel={ar ? "إغلاق" : "Dismiss"}>
      <div dir={dirFor(locale)} className="mx-auto min-h-screen max-w-3xl">
        <header className="flex items-center justify-between border-b border-outline bg-brand px-6 py-4 text-ink">
          <Link href="/trainer" className="wordmark text-2xl text-accent">ÉLAN</Link>
          <div className="flex items-center gap-4">
            <span className="text-meta text-ink/70">{ar ? "بوابة المدرّبة" : "Trainer portal"}</span>
            {isAdmin ? <Link href="/admin" className="text-meta text-ink/60 hover:text-ink">{ar ? "الإدارة ›" : "Admin ›"}</Link> : null}
          </div>
        </header>
        <main className="space-y-6 p-6">{children}</main>
        <div className="px-6 pb-8">
          <LogoutButton label={ar ? "تسجيل الخروج" : "Log out"} />
        </div>
      </div>
    </ToastProvider>
  );
}
