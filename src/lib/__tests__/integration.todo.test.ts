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
 *   • credit on paid only -> create_pending_purchase grants nothing; confirm_payment
 *                            only fulfills on the initiated->paid transition
 *   • no free fulfillment -> simulate_purchase EXECUTE revoked from anon/authenticated;
 *                            confirm_payment is is_admin() guarded
 *   • double fulfillment  -> confirm_payment row lock + status guard + credit_ledger_purchase_once
 *   • member isolation    -> RLS using current_member_id()/auth.uid()
 */
describe.skip("integration: authorization", () => {
  it("non-admin cannot sell a package (sellPackageAction -> forbidden)");
  it("non-admin cannot mark a payment paid (markPaymentPaidAction -> forbidden)");
  it("a member cannot call simulate_purchase (EXECUTE revoked)");
  it("a member cannot call confirm_payment on their own pending payment (is_admin guard -> FORBIDDEN)");
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
  it("create_pending_purchase records an initiated payment and adds NO credits");
  it("confirm_payment on a credit_pack grants exactly its credits");
  it("confirm_payment on a membership activates member_memberships once");
  it("confirm_payment twice on the same payment fulfills only once (idempotent)");
});
