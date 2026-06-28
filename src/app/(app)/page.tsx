import Link from "next/link";
import Image from "next/image";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMemberContext, getMyBookings, getDiscoverClasses } from "@/lib/queries";
import { fmtTime, fmtDayHeading, fmtWeekdayShort, isTodayInRiyadh } from "@/lib/format";
import { classImage, HERO_IMAGE, INSTRUCTOR_IMAGE } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const [ctx, bookings, discover] = await Promise.all([getMemberContext(), getMyBookings(), getDiscoverClasses(2)]);

  const now = Date.now();
  const next =
    bookings
      .filter((b) => (b.status === "confirmed" || b.status === "waitlisted") && new Date(b.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())[0] ?? null;
  const attended = bookings.filter((b) => b.status === "attended").length;
  const fullName = ctx.member?.full_name ?? t.appName;
  const initial = (fullName.trim()[0] ?? "·").toUpperCase();

  return (
    <section className="pb-6">
      <div className="relative h-[300px] overflow-hidden rounded-b-xl md:mt-4 md:rounded-xl">
        <Image src={HERO_IMAGE} alt="" fill priority sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(33,28,24,.12),rgba(33,28,24,.9))" }} />
        <div className="relative flex h-full flex-col p-6 text-ink">
          <div className="flex items-start justify-between">
            <div className="wordmark text-3xl text-ink">ÉLAN</div>
            <Link href="/profile" className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/50 bg-surface-elevated font-display text-lead text-accent">{initial}</Link>
          </div>
          <div className="mt-auto pb-14">
            <p className="text-body text-ink/80">{t.home.greeting}</p>
            <h1 className="font-display text-hero font-medium leading-tight text-ink">{fullName}</h1>
            <p className="mt-1 text-meta text-ink/70">{next ? `${t.home.nextClass} · ${isTodayInRiyadh(next.starts_at) ? t.common.today : fmtDayHeading(next.starts_at, locale)}` : t.home.none}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 px-6">
        {next ? (
          <Link href="/bookings" className="card relative -mt-16 flex items-center gap-3 p-4">
            <Image src={classImage(next.name_en)} alt={next.name_en} width={80} height={80} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-title font-medium text-primary-900">{next.name_en}</h3>
              <p className="mt-0.5 truncate text-caption text-status-full">
                {(ar ? next.instructor_ar : next.instructor_en) ? `${ar ? next.instructor_ar : next.instructor_en} · ` : ""}{fmtTime(next.starts_at, locale)}
              </p>
              <span className="mt-2 inline-block rounded-pill bg-accent px-4 py-2 text-caption font-medium text-primary-900">{t.home.viewDetails}</span>
            </div>
            <Image src={INSTRUCTOR_IMAGE} alt="" width={48} height={48} className="h-12 w-12 shrink-0 self-start rounded-full object-cover ring-1 ring-outline" />
          </Link>
        ) : (
          <Link href="/schedule" className="btn-primary -mt-8 w-full">{t.timetable.title}</Link>
        )}

        <div className="flex gap-3">
          <div className="card flex-1 p-5 text-center">
            <div className="font-number text-3xl text-primary-700">{ctx.balance}</div>
            <div className="text-caption text-status-full">{t.home.balance}</div>
          </div>
          <div className="card flex-1 p-5 text-center">
            <div className="font-number text-3xl text-sage">{attended}</div>
            <div className="text-caption text-status-full">{t.home.attended}</div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lead font-medium text-primary-900">{t.home.discover}</h2>
            <Link href="/schedule" className="text-meta text-primary-700">{t.home.all}</Link>
          </div>
          {discover.length === 0 ? (
            <p className="text-body text-status-full">{t.empty.noClasses}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {discover.map((c) => (
                <Link key={c.id} href={`/class/${c.id}`} className="relative h-36 overflow-hidden rounded-lg">
                  <Image src={classImage(c.name_en)} alt={c.name_en} fill sizes="(min-width:768px) 360px, 50vw" className="object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 25%,rgba(17,13,10,.88))" }} />
                  <div className="absolute inset-x-3 bottom-3 text-ink">
                    <div className="font-display text-body font-medium">{c.name_en}</div>
                    <div className="truncate text-caption text-ink/80">
                      {isTodayInRiyadh(c.starts_at) ? t.common.today : fmtWeekdayShort(c.starts_at, locale)} · {fmtTime(c.starts_at, locale)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
