import Link from "next/link";
import { notFound } from "next/navigation";
import { dict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { getClass } from "@/lib/queries";
import { fmtLongDateTime, levelLabel } from "@/lib/format";
import { ctaState, type Eligibility } from "@/lib/cta";
import { CtaButton } from "@/components/Buttons";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = dict[locale];
  const result = await getClass(id);
  if (!result) notFound();
  const { card: c, eligibility } = result;

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

  const heading = locale === "en" ? "eyebrow" : "text-xs font-semibold tracking-wide text-status-full";

  return (
    <section className="pb-44 md:pb-28">
      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-b-card bg-primary-100">
        <Icon name="self_improvement" className="text-6xl text-primary-400" />
        <Link href="/schedule" className="absolute start-3 top-3 rounded-pill bg-surface-elevated/80 px-3 py-1 text-sm text-primary-900">‹ {t.common.back}</Link>
      </div>
      <div className="space-y-4 p-5">
        <h1 className="font-display text-3xl font-medium text-primary-900">{name}</h1>

        {c.display_status === "waitlist_open" && !c.my_status ? (
          <div className="rounded-card bg-status-waitlist/10 px-4 py-2 text-sm text-status-waitlist">
            {t.detail.waitlistBanner.replace("{n}", String(c.waitlist_count)).replace("{cap}", String(c.capacity))}
          </div>
        ) : null}

        <div><p className={heading}>{t.detail.time}</p><p>{fmtLongDateTime(c.starts_at, c.ends_at, locale)}</p></div>
        {instructor ? <div><p className={heading}>{t.detail.instructor}</p><p className="flex items-center gap-1"><Icon name="person" className="text-base text-primary-400" />{instructor}</p></div> : null}
        <div><p className={heading}>{t.detail.level}</p><p>{levelLabel(c.level, locale)}</p></div>
        {description ? <div><p className={heading}>{t.detail.description}</p><p className="text-sm leading-relaxed">{description}</p></div> : null}
      </div>

      <div className="sticky-cta mx-auto max-w-md">
        <CtaButton classInstanceId={c.id} bookingId={bookingId} label={label} variant={variant} disabled={disabled} />
      </div>
    </section>
  );
}
