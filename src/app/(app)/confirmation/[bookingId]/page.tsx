import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getBooking } from "@/lib/queries";
import { fmtDayHeading, fmtTime } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { HERO_IMAGE, INSTRUCTOR_IMAGE } from "@/lib/classColor";

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
    <section className="pb-10">
      <div className="relative h-56 overflow-hidden rounded-b-xl md:mt-4 md:rounded-xl">
        <Image src={HERO_IMAGE} alt="" fill sizes="(min-width:768px) 768px, 100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(33,28,24,.25),rgba(33,28,24,.92))" }} />
        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center text-ink">
          <div className="mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full border-2 border-accent text-accent">
            <Icon name="check" className="text-3xl" />
          </div>
          <h1 className="font-display text-page-title font-medium text-ink">{t.confirmation.title}</h1>
          <p className="mt-1.5 text-body text-ink/75">{t.confirmation.subtitle}</p>
        </div>
      </div>

      <div className="px-6">
        <div className="card relative -mt-10 p-6">
          <div className="flex items-center gap-3">
            <Image src={INSTRUCTOR_IMAGE} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-full object-cover ring-1 ring-outline" />
            <div className="min-w-0">
              <p className="font-display text-title font-medium leading-tight text-primary-900">{name}</p>
              {instructor ? <p className="mt-0.5 text-meta text-status-full">{t.confirmation.with} {instructor}</p> : null}
            </div>
          </div>
          <div className="mt-5 space-y-3.5 text-body">
            <Row label={t.confirmation.date} value={fmtDayHeading(b.starts_at, locale)} />
            <Row label={t.confirmation.time} value={`${fmtTime(b.starts_at, locale)} · ${b.duration} ${t.common.minutes}`} top />
            <Row label={t.confirmation.place} value={t.confirmation.studio} top />
          </div>
        </div>

        <Link href="/bookings" className="btn-primary mt-5 w-full">{t.confirmation.viewBookings}</Link>
        <Link href="/schedule" className="btn-outline mt-2.5 w-full">{t.timetable.title}</Link>
      </div>
    </section>
  );
}

function Row({ label, value, top }: { label: string; value: string; top?: boolean }) {
  return (
    <div className={`flex justify-between ${top ? "border-t border-outline pt-3.5" : ""}`}>
      <span className="text-status-full">{label}</span>
      <span className="text-primary-900">{value}</span>
    </div>
  );
}
