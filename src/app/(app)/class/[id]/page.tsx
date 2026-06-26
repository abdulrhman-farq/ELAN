import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getClass, isWatchingClass } from "@/lib/queries";
import { fmtLongDateTime, levelLabel, fmtTime, fmtDayHeading } from "@/lib/format";
import { ctaState, type Eligibility } from "@/lib/cta";
import { CtaButton } from "@/components/Buttons";
import { WatchButton } from "@/components/WatchButton";
import { Icon } from "@/components/Icon";
import { classImage } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = dict[locale];
  const result = await getClass(id);
  if (!result) notFound();
  const { card: c, eligibility } = result;

  // For full classes, offer a seat-open alert (complements the waitlist) when
  // the member isn't already booked/waitlisted.
  const isFull = c.display_status === "fully_booked" || c.display_status === "waitlist_open";
  const canWatch = isFull && !c.my_status;
  const watching = canWatch ? await isWatchingClass(id) : false;

  const name = c.name_en; // class names always shown in English
  const instructor = locale === "ar" ? c.instructor_ar : c.instructor_en;
  const description = locale === "ar" ? c.description_ar : c.description_en;

  // Server-driven CTA state (pure, unit-tested in cta.ts).
  const cta = ctaState({ myStatus: c.my_status, eligibility: eligibility as Eligibility, displayStatus: c.display_status });
  const ctaLabels: Record<string, string> = {
    book: t.cta.book, joinWaitlist: t.cta.joinWaitlist, cancel: t.cta.cancel,
    leaveWaitlist: t.cta.leaveWaitlist, closed: t.cta.closed, levelTooLow: t.cta.levelTooLow,
    noCredits: t.cta.noCredits, fullyBooked: t.status.fully_booked,
  };
  const label = ctaLabels[cta.key];
  const variant = cta.variant;
  const disabled = cta.disabled;
  const bookingId = cta.isCancel ? c.my_booking_id : null;

  // One label component, elegant in both locales: Latin uppercase eyebrow vs
  // Arabic weight/colour label (no uppercase/heavy tracking).
  const heading = locale === "en" ? "eyebrow" : "eyebrow-ar";
  // Context for the cancel-confirm dialog (class name + date/time).
  const cancelMeta = `${name} · ${fmtDayHeading(c.starts_at, locale)} · ${fmtTime(c.starts_at, locale)}`;

  return (
    <section className="pb-44 md:pb-28">
      <div className="relative h-56 overflow-hidden rounded-b-xl md:mt-4 md:rounded-xl">
        <Image src={classImage(c.name_en)} alt={name} fill sizes="(max-width:768px) 100vw, 768px" className="object-cover" priority />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(33,28,24,.15),rgba(33,28,24,.55))" }} />
        <Link href="/schedule" className="absolute start-3 top-3 inline-flex min-h-[44px] items-center rounded-pill bg-surface-elevated/85 px-3 text-body text-primary-900">‹ {t.common.back}</Link>
      </div>
      <div className="space-y-4 p-6">
        <h1 className="font-display text-page-title font-medium text-primary-900">{name}</h1>

        {c.display_status === "waitlist_open" && !c.my_status ? (
          <div className="flex items-center gap-2 rounded-lg border border-accent/40 bg-status-waitlist/10 px-4 py-2 text-body text-primary-900">
            <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            {t.detail.waitlistBanner.replace("{n}", String(c.waitlist_count)).replace("{cap}", String(c.capacity))}
          </div>
        ) : null}

        <div><p className={heading}>{t.detail.time}</p><p className="text-body">{fmtLongDateTime(c.starts_at, c.ends_at, locale)}</p></div>
        {instructor ? <div><p className={heading}>{t.detail.instructor}</p><p className="flex items-center gap-1 text-body"><Icon name="person" className="text-base text-primary-400" />{instructor}</p></div> : null}
        <div><p className={heading}>{t.detail.level}</p><p className="text-body">{levelLabel(c.level, locale)}</p></div>
        {description ? <div><p className={heading}>{t.detail.description}</p><p className="text-body leading-relaxed">{description}</p></div> : null}
      </div>

      <div className="sticky-cta mx-auto max-w-md">
        <CtaButton classInstanceId={c.id} bookingId={bookingId} label={label} variant={variant} disabled={disabled} locale={locale} cancelMeta={cancelMeta} />
        {canWatch ? <WatchButton classInstanceId={c.id} watching={watching} ar={locale === "ar"} /> : null}
      </div>
    </section>
  );
}
