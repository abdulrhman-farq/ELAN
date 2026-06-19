import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getTimetable } from "@/lib/queries";
import { todayInRiyadh } from "@/lib/format";
import { DateStrip } from "@/components/DateStrip";
import { ClassCard } from "@/components/ClassCard";

export const dynamic = "force-dynamic";

export default async function TimetablePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const locale = await getLocale();
  const t = dict[locale];
  const date = (await searchParams).date ?? todayInRiyadh();
  const classes = await getTimetable(date);

  return (
    <section className="space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary-800">{t.timetable.title}</h1>
        <span className="chip bg-surface-variant text-primary-700">{t.timetable.filters}</span>
      </header>

      <DateStrip selected={date} locale={locale} todayLabel={t.common.today} />

      {classes.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 p-10 text-center text-status-full">
          <span className="text-3xl" aria-hidden>🧘‍♀️</span>
          <p>{t.timetable.empty}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {classes.map((c) => (
            <ClassCard key={c.id} card={c} locale={locale} minutesLabel={t.common.minutes} statusLabels={t.status} />
          ))}
        </div>
      )}
    </section>
  );
}
