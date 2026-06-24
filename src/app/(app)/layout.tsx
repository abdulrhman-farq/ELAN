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
  if (!DEMO) {
    const supabase = await getServerSupabase();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login");
  }

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
