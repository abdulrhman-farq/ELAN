import { describe, it, expect } from "vitest";
import {
  fmtTime,
  fmtDayHeading,
  fmtWeekdayShort,
  isTodayInRiyadh,
  dayBoundsUtc,
  upcomingDays,
} from "../format";

const FIXED_ISO = "2026-06-28T10:00:00.000Z";

describe("dayBoundsUtc", () => {
  it("returns start/end ISO strings exactly 24h apart", () => {
    const { start, end } = dayBoundsUtc("2026-06-28");
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    expect(diffMs).toBe(86400000);
    expect(typeof start).toBe("string");
    expect(typeof end).toBe("string");
  });
});

describe("upcomingDays", () => {
  it("returns N consecutive, strictly increasing YYYY-MM-DD strings", () => {
    const days = upcomingDays(3);
    expect(days).toHaveLength(3);
    for (const d of days) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(days[0] < days[1]).toBe(true);
    expect(days[1] < days[2]).toBe(true);
  });
});

describe("fmtWeekdayShort", () => {
  it("returns a non-empty string in both locales", () => {
    expect(fmtWeekdayShort(FIXED_ISO, "ar").length).toBeGreaterThan(0);
    expect(fmtWeekdayShort(FIXED_ISO, "en").length).toBeGreaterThan(0);
  });
});

describe("isTodayInRiyadh", () => {
  it("returns true for the current instant", () => {
    expect(isTodayInRiyadh(new Date().toISOString())).toBe(true);
  });

  it("returns false for a date far in the past", () => {
    expect(isTodayInRiyadh("2000-01-01T00:00:00Z")).toBe(false);
  });
});

describe("fmtTime / fmtDayHeading", () => {
  it("fmtTime returns a non-empty string for a fixed ISO", () => {
    expect(fmtTime(FIXED_ISO, "en").length).toBeGreaterThan(0);
    expect(fmtTime(FIXED_ISO, "ar").length).toBeGreaterThan(0);
  });

  it("fmtDayHeading returns a non-empty string for a fixed ISO", () => {
    expect(fmtDayHeading(FIXED_ISO, "en").length).toBeGreaterThan(0);
    expect(fmtDayHeading(FIXED_ISO, "ar").length).toBeGreaterThan(0);
  });
});
