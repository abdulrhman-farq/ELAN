import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { ClassCardData } from "@/lib/queries";
import { fmtTime, levelLabel } from "@/lib/format";
import { StatusChip } from "./StatusChip";
import { Icon } from "./Icon";

export function ClassCard({
  card, locale, minutesLabel, statusLabels,
}: {
  card: ClassCardData; locale: Locale; minutesLabel: string; statusLabels: Record<string, string>;
}) {
  const name = locale === "ar" ? card.name_ar : card.name_en;
  const instructor = locale === "ar" ? card.instructor_ar : card.instructor_en;
  const grey = (card.display_status === "fully_booked" || card.display_status === "booking_closed") && !card.my_status;
  return (
    <Link href={`/class/${card.id}`} className={`card flex items-center gap-3 p-3 ${grey ? "opacity-60" : ""}`}>
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-card bg-primary-100"><Icon name="self_improvement" className="text-3xl text-primary-500" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-bold text-primary-900">{name}</h3>
          <StatusChip displayStatus={card.display_status} spotsLeft={card.spots_left} myStatus={card.my_status} labels={statusLabels} />
        </div>
        <p className="mt-1 truncate text-xs text-status-full">
          {card.duration_minutes} {minutesLabel}{instructor ? ` • ${instructor}` : ""} • {levelLabel(card.level, locale)}
        </p>
      </div>
      <div className="shrink-0 text-sm font-semibold text-primary-700">{fmtTime(card.starts_at, locale)}</div>
    </Link>
  );
}
