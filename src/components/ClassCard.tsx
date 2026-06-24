import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import type { ClassCardData } from "@/lib/queries";
import { fmtTime } from "@/lib/format";
import { classImage } from "@/lib/classColor";

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
  const name = card.name_en; // class names always shown in English
  const instructor = locale === "ar" ? card.instructor_ar : card.instructor_en;
  const booked = card.my_status === "confirmed";
  const waitlisted = card.my_status === "waitlisted";
  const dim = (card.display_status === "fully_booked" || card.display_status === "booking_closed") && !card.my_status;

  let right: ReactNode;
  if (booked) right = <span className="chip shrink-0 self-center whitespace-nowrap bg-sage text-ink">{statusLabels.booked} ✓</span>;
  else if (waitlisted) right = <span className="chip chip-outline shrink-0 self-center whitespace-nowrap text-status-full">{statusLabels.waitlisted}</span>;
  else if (card.display_status === "available") right = <span className="chip shrink-0 self-center whitespace-nowrap bg-primary px-4 text-ink">{ctaLabels.book}</span>;
  else if (card.display_status === "waitlist_open") right = <span className="chip shrink-0 self-center whitespace-nowrap border border-accent bg-accent/10 px-4 text-primary-900">{ctaLabels.joinWaitlist}</span>;
  else right = <span className="shrink-0 self-center whitespace-nowrap text-caption text-status-full">{statusLabels.fully_booked}</span>;

  const seats = card.display_status === "available" ? `${card.spots_left} ${statusLabels.available}` : null;
  const meta = [instructor, seats].filter(Boolean).join(" · ");

  return (
    <Link href={`/class/${card.id}`} className={`card flex items-center gap-3 p-3.5 ${dim ? "opacity-60" : ""}`}>
      <div className="min-w-[2.5rem] shrink-0 text-center">
        <div className="font-number text-lead font-medium text-primary-900">{fmtTime(card.starts_at, locale)}</div>
      </div>
      <Image src={classImage(name)} alt="" width={56} height={56} className="h-14 w-14 shrink-0 rounded-md object-cover ring-1 ring-outline" />
      <div className="min-w-0 flex-1">
        <div className="font-display text-body font-medium leading-tight text-primary-900">{name}</div>
        <div className="mt-0.5 truncate text-caption text-status-full">{meta}</div>
      </div>
      {right}
    </Link>
  );
}
