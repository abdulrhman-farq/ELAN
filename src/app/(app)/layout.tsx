import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { DEMO } from "@/lib/demo";
import { BottomTabs } from "@/components/BottomTabs";
import { MemberSidebar } from "@/components/MemberSidebar";
import { ToastProvider } from "@/components/Toast";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  // Both members and admins may use the member app — admins land on /admin after
  // login but can open the app (via the "App ›" link) to test as their own
  // member profile. Production requires a real session; demo allows local browsing.
  if (!auth.user && !DEMO) redirect("/login");

  const locale = await getLocale();
  return (
    <ToastProvider dismissLabel={dict[locale].toast.dismiss}>
      <div className="md:flex md:min-h-screen">
        <MemberSidebar labels={dict[locale].tabs} />
        <div className="mx-auto w-full max-w-md pb-24 md:max-w-3xl md:pb-10">{children}</div>
        <BottomTabs labels={dict[locale].tabs} />
      </div>
    </ToastProvider>
  );
}
