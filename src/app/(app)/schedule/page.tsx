import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getTimetable } from "@/lib/queries";
import { todayInRiyadh } from "@/lib/format";
import { DateStrip } from "@/components/DateStrip";
import { ClassCard } from "@/components/ClassCard";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const locale = await getLocale();
  const t = dict[locale];
  const date = (await searchParams).date ?? todayInRiyadh();
  const classes = await getTimetable(date);

  return (
    <section className="space-y-5 p-6">
      <h1 className="font-display text-2xl font-medium text-primary-900">{t.timetable.title}</h1>
      <DateStrip selected={date} locale={locale} todayLabel={t.common.today} />

      {classes.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-10 text-center text-status-full">
          <Icon name="self_improvement" className="text-4xl text-primary-300" />
          <p>{t.timetable.empty}</p>
        </div>
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
