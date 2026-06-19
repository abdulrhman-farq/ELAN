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
    <section className="space-y-4 p-4">
      <h1 className="text-xl font-bold text-primary-800">{t.bookings.title}</h1>
      <div className="flex gap-2">
        <a href="/bookings" className={`chip ${tab === "upcoming" ? "bg-primary text-white" : "bg-surface-variant text-primary-700"}`}>{t.bookings.upcoming}</a>
        <a href="/bookings?tab=past" className={`chip ${tab === "past" ? "bg-primary text-white" : "bg-surface-variant text-primary-700"}`}>{t.bookings.past}</a>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-status-full">{t.bookings.empty}</div>
      ) : (
        <div className="space-y-3">
          {rows.map((b) => {
            const name = locale === "ar" ? b.name_ar : b.name_en;
            const instructor = locale === "ar" ? b.instructor_ar : b.instructor_en;
            return (
              <div key={b.id} className="card space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-primary-900">{name}</h3>
                  <span className="chip bg-surface-variant text-primary-700">{(t.bstatus as Record<string, string>)[b.status] ?? b.status}</span>
                </div>
                <p className="text-sm text-status-full">
                  {b.starts_at ? fmtLongDateTime(b.starts_at, b.ends_at, locale) : ""}{instructor ? ` • ${instructor}` : ""}
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
