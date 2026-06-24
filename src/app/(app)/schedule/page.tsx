import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getTimetable } from "@/lib/queries";
import { todayInRiyadh } from "@/lib/format";
import { DateStrip } from "@/components/DateStrip";
import { ClassCard } from "@/components/ClassCard";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const locale = await getLocale();
  const t = dict[locale];
  const date = (await searchParams).date ?? todayInRiyadh();
  const classes = await getTimetable(date);

  return (
    <section className="space-y-6 p-6">
      <h1 className="font-display text-page-title font-medium text-primary-900">{t.timetable.title}</h1>
      <DateStrip selected={date} locale={locale} todayLabel={t.common.today} />

      {classes.length === 0 ? (
        <EmptyState icon="self_improvement" title={t.empty.noClasses} hint={t.empty.noClassesHint} />
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <ClassCard
              key={c.id}
              card={c}
              locale={locale}
              statusLabels={t.status}
              ctaLabels={{ book: t.cta.book, joinWaitlist: t.cta.joinWaitlist }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
