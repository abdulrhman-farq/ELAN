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
  if (booked) right = <span className="whitespace-nowrap text-xs text-primary-200">{statusLabels.booked} ✓</span>;
  else if (waitlisted) right = <span className="whitespace-nowrap text-xs text-status-waitlist">{statusLabels.waitlisted}</span>;
  else if (card.display_status === "available")
    right = <span className="whitespace-nowrap rounded-[2px] border border-primary px-4 py-2 text-xs text-primary">{ctaLabels.book}</span>;
  else if (card.display_status === "waitlist_open")
    right = <span className="whitespace-nowrap rounded-[2px] border border-status-waitlist px-4 py-2 text-xs text-status-waitlist">{ctaLabels.joinWaitlist}</span>;
  else right = <span className="whitespace-nowrap text-xs text-status-full">{statusLabels.fully_booked}</span>;

  const meta = [instructor, card.display_status === "available" ? `${card.spots_left} ${statusLabels.available}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/class/${card.id}`}
      className={`flex items-center gap-3 p-4 ${booked ? "card-ink" : "card"} ${dim ? "opacity-60" : ""}`}
    >
      <div className={`min-w-[3.25rem] border-e pe-3 text-center ${booked ? "border-white/15" : "border-outline"}`}>
        <div className="font-display text-base font-medium">{fmtTime(card.starts_at, locale)}</div>
        <div className={`text-[10px] ${booked ? "text-primary-200" : "text-status-full"}`}>{levelLabel(card.level, locale)}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-base font-medium leading-tight">{name}</div>
        <div className={`mt-0.5 truncate text-[11px] ${booked ? "text-primary-100/80" : "text-status-full"}`}>{meta}</div>
      </div>
      {right}
    </Link>
  );
}
