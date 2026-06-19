import type { DisplayStatus } from "@/lib/queries";

export function StatusChip({
  displayStatus, spotsLeft, myStatus, labels,
}: {
  displayStatus: DisplayStatus;
  spotsLeft: number;
  myStatus: "confirmed" | "waitlisted" | null;
  labels: Record<string, string>;
}) {
  if (myStatus === "confirmed") return <span className="chip bg-primary-100 text-primary-700">{labels.booked}</span>;
  if (myStatus === "waitlisted") return <span className="chip bg-status-waitlist/10 text-status-waitlist">{labels.waitlisted}</span>;
  if (displayStatus === "available") return <span className="chip bg-primary-100 text-primary-700">{spotsLeft} {labels.available}</span>;
  if (displayStatus === "waitlist_open") return <span className="chip bg-status-waitlist/10 text-status-waitlist">{labels.waitlist_open}</span>;
  if (displayStatus === "booking_closed") return <span className="chip bg-status-full/15 text-status-full">{labels.booking_closed}</span>;
  return <span className="chip bg-status-full/15 text-status-full">{labels.fully_booked}</span>;
}
