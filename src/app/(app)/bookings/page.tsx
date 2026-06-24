import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMyBookings } from "@/lib/queries";
import { fmtLongDateTime, fmtTime, fmtDayHeading } from "@/lib/format";
import { CancelLink } from "@/components/Buttons";
import { EmptyState } from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const locale = await getLocale();
  const t = dict[locale];
  const tab = (await searchParams).tab === "past" ? "past" : "upcoming";
  const all = await getMyBookings();
  const now = Date.now();
  const rows = all.filter((b) => {
    const upcoming = new Date(b.starts_at).getTime() >= now;
    const active = b.status === "confirmed" || b.status === "waitlisted";
    return tab === "upcoming" ? upcoming && active : !upcoming || !active;
  });

  return (
    <section className="space-y-6 p-6">
      <h1 className="font-display text-page-title font-medium text-primary-900">{t.bookings.title}</h1>
      <div className="flex gap-2">
        <a href="/bookings" className={`chip chip-md ${tab === "upcoming" ? "chip-selected" : "chip-outline"}`}>{t.bookings.upcoming}</a>
        <a href="/bookings?tab=past" className={`chip chip-md ${tab === "past" ? "chip-selected" : "chip-outline"}`}>{t.bookings.past}</a>
      </div>

      {rows.length === 0 ? (
        tab === "upcoming" ? (
          <EmptyState icon="event_available" title={t.empty.noBookings} hint={t.empty.noBookingsHint} ctaHref="/schedule" ctaLabel={t.empty.noBookingsCta} />
        ) : (
          <EmptyState icon="history" title={t.empty.noPast} hint={t.empty.noPastHint} />
        )
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const name = b.name_en; // class names always shown in English
            const instructor = locale === "ar" ? b.instructor_ar : b.instructor_en;
            const classMeta = b.starts_at ? `${name} · ${fmtDayHeading(b.starts_at, locale)} · ${fmtTime(b.starts_at, locale)}` : name;
            return (
              <div key={b.id} className="card space-y-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lead font-medium text-primary-900">{name}</h3>
                  <span className="chip chip-outline">{(t.bstatus as Record<string, string>)[b.status] ?? b.status}</span>
                </div>
                <p className="text-meta text-status-full">
                  {b.starts_at ? fmtLongDateTime(b.starts_at, b.ends_at, locale) : ""}{instructor ? ` · ${instructor}` : ""}
                </p>
                {tab === "upcoming" ? <CancelLink bookingId={b.id} label={t.common.cancel} locale={locale} classMeta={classMeta} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
