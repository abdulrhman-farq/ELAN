import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { ClassCardData } from "@/lib/queries";
import { fmtTime, levelLabel } from "@/lib/format";

export function ClassCard({
  card,
  locale,
  statusLabels,
  ctaLabels,
}: {
  card: ClassCardData;
  locale: Locale;
  statusLabels: Record<string, string>;
  ctaLabels: { book: string; joinWaitlist: string };
}) {
  const name = locale === "ar" ? card.name_ar : card.name_en;
  const instructor = locale === "ar" ? card.instructor_ar : card.instructor_en;
  const booked = card.my_status === "confirmed";
  const waitlisted = card.my_status === "waitlisted";
  const dim = (card.display_status === "fully_booked" || card.display_status === "booking_closed") && !card.my_status;

  let right: ReactNode;
  if (booked) right = <span className="whitespace-nowrap text-xs font-medium text-sage-700">{statusLabels.booked} ✓</span>;
  else if (waitlisted) right = <span className="whitespace-nowrap text-xs text-accent">{statusLabels.waitlisted}</span>;
  else if (card.display_status === "available")
    right = <span className="whitespace-nowrap rounded-pill border border-primary px-4 py-2 text-xs text-primary-700">{ctaLabels.book}</span>;
  else if (card.display_status === "waitlist_open")
    right = <span className="whitespace-nowrap rounded-pill border border-accent px-4 py-2 text-xs text-accent">{ctaLabels.joinWaitlist}</span>;
  else right = <span className="whitespace-nowrap text-xs text-status-full">{statusLabels.fully_booked}</span>;

  const meta = [instructor, card.display_status === "available" ? `${card.spots_left} ${statusLabels.available}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/class/${card.id}`}
      className={`card flex items-center gap-4 p-4 ${booked ? "border-s-2 border-s-sage" : ""} ${dim ? "opacity-60" : ""}`}
    >
      <div className="min-w-[3.25rem] border-e border-outline pe-4 text-center">
        <div className="font-display text-lg font-medium text-primary-900">{fmtTime(card.starts_at, locale)}</div>
        <div className="text-[10px] text-status-full">{levelLabel(card.level, locale)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-lg font-medium leading-tight text-primary-900">{name}</div>
        <div className="mt-0.5 truncate text-[11px] text-status-full">{meta}</div>
      </div>
      {right}
    </Link>
  );
}
