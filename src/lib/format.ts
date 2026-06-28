import type { Locale } from "./i18n";

const TZ = "Asia/Riyadh";

export function dayBoundsUtc(date: string) {
  const start = new Date(`${date}T00:00:00+03:00`);
  return { start: start.toISOString(), end: new Date(start.getTime() + 86400000).toISOString() };
}

export function todayInRiyadh(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function upcomingDays(count: number): string[] {
  const base = new Date(`${todayInRiyadh()}T00:00:00+03:00`);
  return Array.from({ length: count }, (_, i) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(base.getTime() + i * 86400000)),
  );
}

/** True when the given instant falls on the current Riyadh calendar day. */
export function isTodayInRiyadh(iso: string): boolean {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso)) === todayInRiyadh();
}

export function fmtTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso));
}

export function fmtDayNum(date: string): string {
  return String(new Date(`${date}T00:00:00+03:00`).getUTCDate());
}

export function fmtWeekday(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", { timeZone: TZ, weekday: "short" })
    .format(new Date(`${date}T00:00:00+03:00`));
}

export function fmtLongDateTime(startIso: string, endIso: string, locale: Locale): string {
  const day = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long",
  }).format(new Date(startIso));
  return `${day}، ${fmtTime(startIso, locale)} – ${fmtTime(endIso, locale)}`;
}

export function fmtDayHeading(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", {
    timeZone: TZ, weekday: "long", day: "numeric", month: "long",
  }).format(new Date(iso));
}

export function levelLabel(level: "level_1" | "level_1_5" | "level_2", locale: Locale): string {
  if (locale === "ar") return level === "level_1" ? "المستوى 1" : level === "level_1_5" ? "المستوى 1.5" : "المستوى 2";
  return level === "level_1" ? "Level 1" : level === "level_1_5" ? "Level 1.5" : "Level 2";
}
