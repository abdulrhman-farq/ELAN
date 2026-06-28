import { describe, it, expect } from "vitest";
import { ctaState, levelRank } from "../cta";
import { dayBoundsUtc } from "../format";
import { getInvoiceProvider } from "../providers";

describe("ctaState — server-driven booking button", () => {
  it("shows Cancel when the member is confirmed", () => {
    expect(ctaState({ myStatus: "confirmed", eligibility: "ALREADY_BOOKED", displayStatus: "available" }))
      .toMatchObject({ key: "cancel", isCancel: true });
  });
  it("shows Leave waitlist when waitlisted", () => {
    expect(ctaState({ myStatus: "waitlisted", eligibility: "ALREADY_BOOKED", displayStatus: "waitlist_open" }))
      .toMatchObject({ key: "leaveWaitlist", isCancel: true });
  });
  it("disables with reason when booking is closed", () => {
    expect(ctaState({ myStatus: null, eligibility: "BOOKING_CLOSED", displayStatus: "available" }))
      .toMatchObject({ key: "closed", disabled: true });
  });
  it("disables when the member's level is too low", () => {
    expect(ctaState({ myStatus: null, eligibility: "LEVEL_TOO_LOW", displayStatus: "available" }))
      .toMatchObject({ key: "levelTooLow", disabled: true });
  });
  it("disables when there are no credits", () => {
    expect(ctaState({ myStatus: null, eligibility: "NO_CREDITS", displayStatus: "available" }))
      .toMatchObject({ key: "noCredits", disabled: true });
  });
  it("disables when the member is suspended", () => {
    expect(ctaState({ myStatus: null, eligibility: "SUSPENDED", displayStatus: "available" }))
      .toMatchObject({ key: "suspended", disabled: true });
  });
  it("offers Join waitlist when full but waitlist open", () => {
    expect(ctaState({ myStatus: null, eligibility: "ELIGIBLE", displayStatus: "waitlist_open" }))
      .toMatchObject({ key: "joinWaitlist", disabled: false });
  });
  it("offers Book when eligible and spots remain", () => {
    expect(ctaState({ myStatus: null, eligibility: "ELIGIBLE", displayStatus: "available" }))
      .toMatchObject({ key: "book", variant: "primary", disabled: false });
  });
});

describe("levelRank — progression 1 < 1.5 < 2", () => {
  it("orders levels correctly", () => {
    expect(levelRank("level_1")).toBeLessThan(levelRank("level_1_5"));
    expect(levelRank("level_1_5")).toBeLessThan(levelRank("level_2"));
  });
});

describe("dayBoundsUtc — Riyadh day window", () => {
  it("spans 24h from local midnight (+03:00)", () => {
    const { start, end } = dayBoundsUtc("2026-06-20");
    expect(start).toBe("2026-06-19T21:00:00.000Z");
    expect(new Date(end).getTime() - new Date(start).getTime()).toBe(86400000);
  });
});

describe("MockInvoiceProvider — ZATCA-style VAT split", () => {
  it("extracts 15% VAT from a gross amount", async () => {
    const inv = await getInvoiceProvider().generate({ amountSar: 115, taxPct: 15, buyer: "X", description: "Pack" });
    expect(inv.totalSar).toBe(115);
    expect(inv.vatSar).toBeCloseTo(15, 2);
    expect(inv.subtotalSar).toBeCloseTo(100, 2);
    expect(inv.number).toMatch(/^ELAN-/);
    expect(inv.qr.length).toBeGreaterThan(0);
  });
});
