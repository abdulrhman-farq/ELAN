import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { BottomTabs } from "@/components/BottomTabs";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await getServerSupabase();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const locale = await getLocale();
  return (
    <div className="mx-auto min-h-screen max-w-md pb-20">
      {children}
      <BottomTabs labels={dict[locale].tabs} />
    </div>
  );
}
