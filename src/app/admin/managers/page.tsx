import { getLocale } from "@/lib/locale-server";
import { getManagers } from "@/lib/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { ManagersManager } from "@/components/admin/ManagersManager";

export const dynamic = "force-dynamic";

export default async function AdminManagers() {
  await requireAdmin();
  const ar = (await getLocale()) === "ar";
  const managers = await getManagers();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "الصلاحيات" : "Roles & access"}</h1>
        <p className="text-meta text-status-full">{ar ? "إدارة صلاحيات المديرات (تشغيل بدون ماليات)" : "Manage manager access (operations, no finances)"}</p>
      </div>
      <ManagersManager managers={managers} ar={ar} />
    </div>
  );
}
