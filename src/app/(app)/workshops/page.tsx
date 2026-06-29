import { getLocale } from "@/lib/locale-server";
import { getWorkshops } from "@/lib/queries";
import { EmptyState } from "@/components/EmptyState";
import { WorkshopList } from "@/components/WorkshopList";

export const dynamic = "force-dynamic";

export default async function WorkshopsPage() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const workshops = await getWorkshops();

  return (
    <section className="space-y-6 p-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "الورش" : "Workshops"}</h1>
        <p className="text-meta text-status-full">
          {ar ? "فعاليات خاصة محدودة المقاعد — احجزي مقعدكِ والدفع في الاستوديو." : "Special limited-seat events — reserve your spot, pay at the studio."}
        </p>
      </div>

      {workshops.length === 0 ? (
        <EmptyState icon="auto_awesome" title={ar ? "لا توجد ورش حاليًا" : "No workshops yet"} hint={ar ? "تابعينا — قريبًا فعاليات جديدة." : "Stay tuned — new events coming soon."} />
      ) : (
        <WorkshopList workshops={workshops} locale={locale} />
      )}
    </section>
  );
}
