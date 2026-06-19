import Link from "next/link";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext, getMyBookings, getTimetable } from "@/lib/queries";
import { fmtLongDateTime, fmtTime, todayInRiyadh } from "@/lib/format";
import { classGradient } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [ctx, bookings, todays] = await Promise.all([
    getMemberContext(),
    getMyBookings(),
    getTimetable(todayInRiyadh()),
  ]);

  const now = Date.now();
  const next =
    bookings
      .filter((b) => (b.status === "confirmed" || b.status === "waitlisted") && new Date(b.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null;
  const attended = bookings.filter((b) => b.status === "attended").length;
  const discover = todays.filter((c) => c.display_status === "available").slice(0, 2);
  const fullName = ctx.member?.full_name ?? t.appName;
  const initial = (fullName.trim()[0] ?? "·").toUpperCase();

  return (
    <section className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-status-full">{t.home.greeting}</p>
          <h1 className="font-display text-[26px] font-medium leading-tight text-primary-900">{fullName}</h1>
        </div>
        <Link
          href="/profile"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-primary-100 font-display text-lg text-primary-700"
        >
          {initial}
        </Link>
      </header>

      {next ? (
        <Link href="/bookings" className="card-ink block p-6">
          <p className="eyebrow text-primary-200">{t.home.nextClass}</p>
          <p className="mt-3 font-display text-[26px] font-medium leading-none">{ar ? next.name_ar : next.name_en}</p>
          {(ar ? next.instructor_ar : next.instructor_en) ? (
            <p className="mt-1.5 text-sm text-surface/70">{ar ? next.instructor_ar : next.instructor_en}</p>
          ) : null}
          <p className="mt-4 text-sm text-surface/80">{fmtLongDateTime(next.starts_at, next.ends_at, locale)}</p>
          <span className="mt-5 inline-block rounded-pill bg-primary px-6 py-2.5 text-sm text-ink">{t.home.viewDetails}</span>
        </Link>
      ) : (
        <div className="card-ink p-6">
          <p className="eyebrow text-primary-200">{t.home.nextClass}</p>
          <p className="mt-3 font-display text-xl">{t.home.none}</p>
          <Link href="/schedule" className="mt-4 inline-block rounded-pill bg-primary px-6 py-2.5 text-sm text-ink">{t.timetable.title}</Link>
        </div>
      )}

      <div className="flex gap-3">
        <div className="card flex-1 p-5">
          <div className="font-display text-3xl text-primary-700">{ctx.balance}</div>
          <div className="text-[12px] text-status-full">{t.home.balance}</div>
        </div>
        <div className="card flex-1 p-5">
          <div className="font-display text-3xl text-sage-700">{attended}</div>
          <div className="text-[12px] text-status-full">{t.home.attended}</div>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-primary-900">{t.home.discover}</h2>
          <Link href="/schedule" className="text-[12px] text-primary-700">{t.home.all}</Link>
        </div>
        {discover.length === 0 ? (
          <p className="text-sm text-status-full">{t.timetable.empty}</p>
        ) : (
          <div className="flex gap-3">
            {discover.map((c) => (
              <Link key={c.id} href={`/class/${c.id}`} className="card flex-1 p-4">
                <div className="mb-3 h-16 w-full rounded-[12px]" style={{ background: classGradient(ar ? c.name_ar : c.name_en) }} />
                <div className="font-display text-base font-medium leading-tight">{ar ? c.name_ar : c.name_en}</div>
                <div className="mt-0.5 truncate text-[11px] text-status-full">
                  {fmtTime(c.starts_at, locale)}
                  {(ar ? c.instructor_ar : c.instructor_en) ? ` · ${ar ? c.instructor_ar : c.instructor_en}` : ""}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
