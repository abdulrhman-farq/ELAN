import { describe, it } from "vitest";

/**
 * Integration coverage for authorization, booking and RLS.
 *
 * These assertions run against the DB (RLS + SECURITY DEFINER RPCs) and a seeded
 * test project, which is not available in this environment. They are recorded
 * here as the required suite and SKIPPED until a test Supabase project is wired
 * (e.g. gate on process.env.TEST_SUPABASE_URL and seed an admin + two members).
 *
 * Many of these invariants are already enforced and verified at the DB level:
 *   • double-booking      -> unique index uniq_active_booking
 *   • capacity overflow   -> book_class locks the class row FOR UPDATE then counts
 *   • credit on paid only -> creditsGrantedFor (unit-tested) + status guard
 *   • double fulfillment  -> atomic status flip + credit_ledger_purchase_once
 *   • member isolation    -> RLS using current_member_id()/auth.uid()
 */
describe.skip("integration: authorization", () => {
  it("non-admin cannot sell a package (sellPackageAction -> forbidden)");
  it("non-admin cannot mark a payment paid (markPaymentPaidAction -> forbidden)");
  it("a member cannot read another member's row / bookings / payments (RLS)");
  it("an admin can perform admin operations");
});

describe.skip("integration: booking", () => {
  it("cannot book without credits or an active membership (NO_CREDITS)");
  it("cannot create a second active booking for the same class (double booking)");
  it("cannot exceed class capacity (waitlist instead)");
  it("waitlist promotes the next member on cancellation");
});

describe.skip("integration: credits & payments", () => {
  it("a pending sale adds no credits; the balance is unchanged");
  it("a paid sale adds exactly its credits");
  it("marking the same payment paid twice grants credits only once");
});
