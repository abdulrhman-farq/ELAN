import { getLocale } from "@/lib/locale-server";
import { requireAdmin } from "@/lib/admin-guard";
import { getAdminWorkshops, getInstructors } from "@/lib/admin";
import { WorkshopsManager } from "@/components/admin/WorkshopsManager";

export const dynamic = "force-dynamic";

export default async function AdminWorkshops() {
  await requireAdmin();
  const ar = (await getLocale()) === "ar";
  const [workshops, instructors] = await Promise.all([getAdminWorkshops(), getInstructors()]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "الورش" : "Workshops"}</h1>
        <p className="text-meta text-status-full">
          {ar ? "فعاليات خاصة محدودة المقاعد. الدفع يُسجَّل في الاستوديو." : "Standalone limited-seat events. Payment is recorded at the desk."}
        </p>
      </div>
      <WorkshopsManager
        ar={ar}
        workshops={workshops}
        instructors={instructors.map((i) => ({ id: i.id, name: ar ? i.name_ar : i.name_en }))}
      />
    </div>
  );
}
