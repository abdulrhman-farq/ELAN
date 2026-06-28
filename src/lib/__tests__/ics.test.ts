import { describe, it, expect } from "vitest";
import { googleCalendarUrl } from "../ics";

const START = "2026-06-28T10:00:00.000Z";
const END = "2026-06-28T11:00:00.000Z";

describe("googleCalendarUrl", () => {
  it("returns a Google Calendar render URL with action=TEMPLATE", () => {
    const url = new URL(googleCalendarUrl({ title: "Yoga", startIso: START, endIso: END }));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
  });

  it("encodes the title in the text param", () => {
    const url = new URL(googleCalendarUrl({ title: "Yoga & Pilates", startIso: START, endIso: END }));
    expect(url.searchParams.get("text")).toBe("Yoga & Pilates");
  });

  it("builds a compact START/END dates param (YYYYMMDDTHHMMSSZ, no dashes/colons)", () => {
    const url = new URL(googleCalendarUrl({ title: "Yoga", startIso: START, endIso: END }));
    expect(url.searchParams.get("dates")).toBe("20260628T100000Z/20260628T110000Z");
  });

  it("includes location and details when provided", () => {
    const url = new URL(
      googleCalendarUrl({
        title: "Yoga",
        startIso: START,
        endIso: END,
        location: "Riyadh Studio",
        details: "Bring a mat",
      }),
    );
    expect(url.searchParams.get("location")).toBe("Riyadh Studio");
    expect(url.searchParams.get("details")).toBe("Bring a mat");
  });

  it("omits location and details when not provided", () => {
    const url = new URL(googleCalendarUrl({ title: "Yoga", startIso: START, endIso: END }));
    expect(url.searchParams.has("location")).toBe(false);
    expect(url.searchParams.has("details")).toBe(false);
  });
});
