import { getLocale } from "@/lib/locale-server";
import { requireAdmin } from "@/lib/admin-guard";
import { getStudioSettings } from "@/lib/queries";
import { SettingsForm } from "@/components/admin/SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await requireAdmin();
  const ar = (await getLocale()) === "ar";
  const settings = await getStudioSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "الإعدادات" : "Settings"}</h1>
        <p className="text-[13px] text-status-full">{ar ? "إدارة معلومات الاستوديو وسياسة الحجز" : "Studio info and booking policy"}</p>
      </div>
      <SettingsForm initial={settings} ar={ar} />
    </div>
  );
}
