import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getMyBookings } from "@/lib/queries";
import { fmtLongDateTime } from "@/lib/format";
import { CancelLink } from "@/components/Buttons";

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
    <section className="space-y-5 p-6">
      <h1 className="font-display text-2xl font-medium text-primary-900">{t.bookings.title}</h1>
      <div className="flex gap-2">
        <a href="/bookings" className={`chip ${tab === "upcoming" ? "bg-primary text-ink" : "border border-outline text-primary-700"}`}>{t.bookings.upcoming}</a>
        <a href="/bookings?tab=past" className={`chip ${tab === "past" ? "bg-primary text-ink" : "border border-outline text-primary-700"}`}>{t.bookings.past}</a>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-status-full">{t.bookings.empty}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const name = b.name_en; // class names always shown in English
            const instructor = locale === "ar" ? b.instructor_ar : b.instructor_en;
            return (
              <div key={b.id} className="card space-y-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-lg font-medium text-primary-900">{name}</h3>
                  <span className="chip border border-outline text-primary-700">{(t.bstatus as Record<string, string>)[b.status] ?? b.status}</span>
                </div>
                <p className="text-sm text-status-full">
                  {b.starts_at ? fmtLongDateTime(b.starts_at, b.ends_at, locale) : ""}{instructor ? ` · ${instructor}` : ""}
                </p>
                {tab === "upcoming" ? <CancelLink bookingId={b.id} label={t.common.cancel} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
