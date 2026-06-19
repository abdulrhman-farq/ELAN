import Link from "next/link";
import { notFound } from "next/navigation";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getBooking } from "@/lib/queries";
import { fmtDayHeading, fmtTime } from "@/lib/format";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const locale = await getLocale();
  const t = dict[locale];
  const ar = locale === "ar";
  const b = await getBooking(bookingId);
  if (!b) notFound();

  const name = b.name_en; // class names always shown in English
  const instructor = ar ? b.instructor_ar : b.instructor_en;

  return (
    <section className="flex min-h-screen flex-col justify-center p-7">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-sage text-ink shadow-glow">
          <Icon name="check" className="text-4xl" />
        </div>
        <h1 className="font-display text-3xl font-medium text-primary-900">{t.confirmation.title}</h1>
        <p className="mt-2 text-sm text-status-full">{t.confirmation.subtitle}</p>
      </div>

      <div className="card p-6">
        <p className="font-display text-2xl font-medium">{name}</p>
        {instructor ? <p className="mt-0.5 text-[13px] text-status-full">{t.confirmation.with} {instructor}</p> : null}
        <div className="mt-5 space-y-3.5 text-sm">
          <Row label={t.confirmation.date} value={fmtDayHeading(b.starts_at, locale)} />
          <Row label={t.confirmation.time} value={`${fmtTime(b.starts_at, locale)} · ${b.duration} ${t.common.minutes}`} top />
          <Row label={t.confirmation.place} value={t.confirmation.studio} top />
        </div>
      </div>

      <Link href="/bookings" className="btn-primary mt-5">{t.confirmation.viewBookings}</Link>
      <Link href="/schedule" className="btn-outline mt-2.5">{t.timetable.title}</Link>
    </section>
  );
}

function Row({ label, value, top }: { label: string; value: string; top?: boolean }) {
  return (
    <div className={`flex justify-between ${top ? "border-t border-outline pt-3.5" : ""}`}>
      <span className="text-status-full">{label}</span>
      <span>{value}</span>
    </div>
  );
}
