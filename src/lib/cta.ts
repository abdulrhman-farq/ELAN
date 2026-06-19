/** Pure mapping from server state to the class-detail sticky button state.
 * Kept side-effect-free so it can be unit-tested without a database. */
import type { DisplayStatus } from "./queries";

export type Eligibility = "ELIGIBLE" | "LEVEL_TOO_LOW" | "NO_CREDITS" | "ALREADY_BOOKED" | "BOOKING_CLOSED";
export type CtaKey = "book" | "joinWaitlist" | "cancel" | "leaveWaitlist" | "closed" | "levelTooLow" | "noCredits" | "fullyBooked";

export interface CtaState {
  key: CtaKey;
  variant: "primary" | "muted" | "disabled";
  disabled: boolean;
  isCancel: boolean;
}

export function ctaState(input: {
  myStatus: "confirmed" | "waitlisted" | null;
  eligibility: Eligibility;
  displayStatus: DisplayStatus;
}): CtaState {
  const { myStatus, eligibility, displayStatus } = input;
  if (myStatus === "confirmed") return { key: "cancel", variant: "muted", disabled: false, isCancel: true };
  if (myStatus === "waitlisted") return { key: "leaveWaitlist", variant: "muted", disabled: false, isCancel: true };
  if (eligibility === "BOOKING_CLOSED") return { key: "closed", variant: "disabled", disabled: true, isCancel: false };
  if (eligibility === "LEVEL_TOO_LOW") return { key: "levelTooLow", variant: "disabled", disabled: true, isCancel: false };
  if (eligibility === "NO_CREDITS") return { key: "noCredits", variant: "disabled", disabled: true, isCancel: false };
  if (displayStatus === "waitlist_open") return { key: "joinWaitlist", variant: "primary", disabled: false, isCancel: false };
  if (displayStatus === "fully_booked") return { key: "fullyBooked", variant: "disabled", disabled: true, isCancel: false };
  return { key: "book", variant: "primary", disabled: false, isCancel: false };
}

/** Level progression rank: Level 1 < 1.5 < 2. Mirrors the SQL _elan_level_rank. */
export function levelRank(level: "level_1" | "level_1_5" | "level_2"): number {
  return level === "level_1" ? 1 : level === "level_1_5" ? 2 : 3;
}
