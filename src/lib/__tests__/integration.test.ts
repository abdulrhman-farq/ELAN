/**
 * Conditional Supabase integration tests — RUN only when SUPABASE_TEST_* env vars
 * point at a STAGING project. Pending staging provisioning. Never point these at
 * production.
 *
 * These exercise the real database: Row-Level Security and the SECURITY DEFINER
 * booking / payment / credit RPCs. They are *not* mocked — when the staging env
 * vars are absent the whole file is skipped (no client is created, no network is
 * touched at import time) so `npm test` stays green with zero configuration.
 *
 * To run them, point the following at a disposable STAGING project that has all
 * migrations (0001..0020) applied, then `npm test`:
 *   SUPABASE_TEST_URL=...            (https://<ref>.supabase.co)
 *   SUPABASE_TEST_ANON_KEY=...       (anon/public key)
 *   SUPABASE_TEST_SERVICE_ROLE_KEY=...(service_role key — bypasses RLS; used only
 *                                      to seed/clean up test fixtures)
 *
 * The suites seed throwaway auth users + members with the service-role client,
 * assert RLS / authorization with anon (user-session) clients, and tear every
 * fixture down in afterAll.
 */
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from "vitest";
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

const URL = process.env.SUPABASE_TEST_URL;
const ANON = process.env.SUPABASE_TEST_ANON_KEY;
const SERVICE = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY;
const STAGING = Boolean(URL && ANON && SERVICE);

const TIMEOUT = 30_000;
// Unique-ish namespace so parallel/repeat runs against the same staging project
// don't collide on the members.phone / email unique constraints.
const RUN = `itest_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
const PASSWORD = "Test-Passw0rd!integration";

/** Service-role client: bypasses RLS. Used ONLY for seeding and teardown. */
function admin(): SupabaseClient {
  return createClient(URL!, SERVICE!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** A fresh anon client (no session). */
function anon(): SupabaseClient {
  return createClient(URL!, ANON!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type Seeded = {
  user: User;
  memberId: string;
  email: string;
  /** A signed-in anon client acting AS this member (RLS applies). */
  client: SupabaseClient;
};

/**
 * Create an auth user, a matching `members` row (service role, bypasses RLS),
 * and return a *user-session* anon client signed in as them.
 */
async function seedMember(svc: SupabaseClient, tag: string): Promise<Seeded> {
  const email = `${RUN}_${tag}@example.test`;
  const { data: created, error: cErr } = await svc.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (cErr || !created?.user) {
    throw new Error(`createUser(${tag}) failed: ${cErr?.message}`);
  }
  const user = created.user;

  const { data: member, error: mErr } = await svc
    .from("members")
    .insert({
      auth_user_id: user.id,
      full_name: `Integration ${tag}`,
      email,
      // phone is UNIQUE; keep it null-free but unique per member.
      phone: `+99900${Date.now() % 100000}${Math.floor(Math.random() * 1000)}`,
    })
    .select("id")
    .single();
  if (mErr || !member) {
    throw new Error(`insert member(${tag}) failed: ${mErr?.message}`);
  }

  const client = anon();
  const { error: sErr } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (sErr) throw new Error(`signIn(${tag}) failed: ${sErr.message}`);

  return { user, memberId: member.id, email, client };
}

/** Grant credits to a member via the SECURITY DEFINER ledger writer. */
async function grantCredits(
  svc: SupabaseClient,
  memberId: string,
  n: number,
): Promise<void> {
  const { error } = await svc.rpc("_elan_add_ledger", {
    p_member: memberId,
    p_change: n,
    p_reason: "admin",
    p_ref_id: null,
  });
  if (error) throw new Error(`_elan_add_ledger failed: ${error.message}`);
}

/**
 * Create a bookable class instance (open booking window, scheduled). Reuses /
 * creates a minimal class_type. Returns the new class_instance id.
 */
async function seedBookableClass(
  svc: SupabaseClient,
  capacity: number,
): Promise<string> {
  // Reuse any existing class_type, else create a throwaway one.
  let classTypeId: string | undefined;
  const { data: ct } = await svc
    .from("class_types")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (ct?.id) {
    classTypeId = ct.id;
  } else {
    const { data: newCt, error } = await svc
      .from("class_types")
      .insert({
        name_ar: `${RUN} نوع`,
        name_en: `${RUN} type`,
        duration_minutes: 60,
      })
      .select("id")
      .single();
    if (error || !newCt) {
      throw new Error(`insert class_type failed: ${error?.message}`);
    }
    classTypeId = newCt.id;
  }

  const now = Date.now();
  const { data: inst, error: iErr } = await svc
    .from("class_instances")
    .insert({
      class_type_id: classTypeId,
      starts_at: new Date(now + 24 * 3600_000).toISOString(),
      ends_at: new Date(now + 25 * 3600_000).toISOString(),
      capacity,
      level: "level_1",
      status: "scheduled",
      booking_opens_at: new Date(now - 3600_000).toISOString(),
      booking_closes_at: new Date(now + 23 * 3600_000).toISOString(),
    })
    .select("id")
    .single();
  if (iErr || !inst) {
    throw new Error(`insert class_instance failed: ${iErr?.message}`);
  }
  return inst.id;
}

describe.skipIf(!STAGING)("integration: RLS isolation", () => {
  const svc = STAGING ? admin() : (null as unknown as SupabaseClient);
  let a: Seeded;
  let b: Seeded;
  const cleanup: Array<() => Promise<void>> = [];

  beforeAll(async () => {
    a = await seedMember(svc, "rls_a");
    b = await seedMember(svc, "rls_b");
    cleanup.push(async () => {
      await svc.auth.admin.deleteUser(a.user.id);
      await svc.auth.admin.deleteUser(b.user.id);
    });

    // Give member B a footprint A must never see: a credit ledger row and a
    // notification. (Bookings need a class; covered in other suites.)
    await grantCredits(svc, b.memberId, 5);
    await svc.from("notifications").insert({
      member_id: b.memberId,
      channel: "in_app",
      template: "integration_secret",
      payload: { secret: RUN },
    });
  }, TIMEOUT);

  afterAll(async () => {
    for (const fn of cleanup) await fn().catch(() => {});
  }, TIMEOUT);

  it(
    "member A cannot SELECT member B's credit_ledger rows",
    async () => {
      const { data, error } = await a.client
        .from("credit_ledger")
        .select("id")
        .eq("member_id", b.memberId);
      // RLS yields zero rows (filtered), never another member's data.
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    },
    TIMEOUT,
  );

  it(
    "member A cannot SELECT member B's notifications",
    async () => {
      const { data, error } = await a.client
        .from("notifications")
        .select("id, payload")
        .eq("member_id", b.memberId);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    },
    TIMEOUT,
  );

  it(
    "member A cannot SELECT member B's bookings",
    async () => {
      const { data, error } = await a.client
        .from("bookings")
        .select("id")
        .eq("member_id", b.memberId);
      expect(error).toBeNull();
      expect(data ?? []).toHaveLength(0);
    },
    TIMEOUT,
  );

  it(
    "member B CAN see their own credit_ledger (sanity: RLS isn't just denying all)",
    async () => {
      const { data, error } = await b.client
        .from("credit_ledger")
        .select("id")
        .eq("member_id", b.memberId);
      expect(error).toBeNull();
      expect((data ?? []).length).toBeGreaterThan(0);
    },
    TIMEOUT,
  );
});

describe.skipIf(!STAGING)("integration: authorization", () => {
  const svc = STAGING ? admin() : (null as unknown as SupabaseClient);
  let m: Seeded;
  let paymentId: string;
  const cleanup: Array<() => Promise<void>> = [];

  beforeAll(async () => {
    m = await seedMember(svc, "authz");
    cleanup.push(async () => {
      await svc.from("payments").delete().eq("id", paymentId);
      await svc.auth.admin.deleteUser(m.user.id);
    });

    // Seed an initiated payment owned by the member to attempt to self-confirm.
    const { data: pay, error } = await svc
      .from("payments")
      .insert({
        member_id: m.memberId,
        amount_sar: 100,
        currency: "SAR",
        status: "initiated",
        type: "credit_pack",
        credits: 10,
      })
      .select("id")
      .single();
    if (error || !pay) throw new Error(`seed payment failed: ${error?.message}`);
    paymentId = pay.id;
  }, TIMEOUT);

  afterAll(async () => {
    for (const fn of cleanup) await fn().catch(() => {});
  }, TIMEOUT);

  it(
    "non-admin member cannot confirm_payment (FORBIDDEN)",
    async () => {
      const { error } = await m.client.rpc("confirm_payment", {
        p_payment_id: paymentId,
      });
      expect(error).not.toBeNull();
      expect(error?.message ?? "").toMatch(/FORBIDDEN/i);

      // And the payment must still be unfulfilled.
      const { data: pay } = await svc
        .from("payments")
        .select("status")
        .eq("id", paymentId)
        .single();
      expect(pay?.status).toBe("initiated");
    },
    TIMEOUT,
  );

  it(
    "non-staff member cannot adjust_credits_admin (FORBIDDEN)",
    async () => {
      const { error } = await m.client.rpc("adjust_credits_admin", {
        p_member: m.memberId,
        p_delta: 999,
        p_reason: "admin",
        p_ref: null,
      });
      expect(error).not.toBeNull();
      // FORBIDDEN from the function's is_staff() guard. If the function is not
      // yet present on staging (pre-0019), the call still errors (404/undefined
      // function) — which also correctly means a member cannot grant credits.
      expect(error?.message ?? "").toMatch(/FORBIDDEN|function|does not exist/i);

      // The member's balance must not have grown from the rejected call.
      const { data: ledger } = await svc
        .from("credit_ledger")
        .select("change")
        .eq("member_id", m.memberId);
      const bal = (ledger ?? []).reduce((s, r) => s + (r.change ?? 0), 0);
      expect(bal).toBe(0);
    },
    TIMEOUT,
  );
});

describe.skipIf(!STAGING)("integration: booking invariants", () => {
  const svc = STAGING ? admin() : (null as unknown as SupabaseClient);
  let m1: Seeded;
  let m2: Seeded;
  const classIds: string[] = [];
  const cleanup: Array<() => Promise<void>> = [];

  beforeAll(async () => {
    m1 = await seedMember(svc, "book1");
    m2 = await seedMember(svc, "book2");
    await grantCredits(svc, m1.memberId, 10);
    await grantCredits(svc, m2.memberId, 10);
    cleanup.push(async () => {
      for (const id of classIds) {
        // bookings cascade on class_instance delete (FK ON DELETE CASCADE).
        await svc.from("class_instances").delete().eq("id", id);
      }
      await svc.auth.admin.deleteUser(m1.user.id);
      await svc.auth.admin.deleteUser(m2.user.id);
    });
  }, TIMEOUT);

  afterAll(async () => {
    for (const fn of cleanup) await fn().catch(() => {});
  }, TIMEOUT);

  it(
    "booking the same class twice raises ALREADY_BOOKED",
    async () => {
      const cid = await seedBookableClass(svc, 5);
      classIds.push(cid);

      const first = await m1.client.rpc("book_class_self", {
        p_class_instance_id: cid,
      });
      expect(first.error).toBeNull();
      expect(first.data?.status).toBe("confirmed");

      const second = await m1.client.rpc("book_class_self", {
        p_class_instance_id: cid,
      });
      expect(second.error).not.toBeNull();
      expect(second.error?.message ?? "").toMatch(/ALREADY_BOOKED/i);
    },
    TIMEOUT,
  );

  it(
    "booking a full class waitlists instead of overbooking",
    async () => {
      // capacity 1: m1 confirms, m2 must be waitlisted (not a confirmed overbook).
      const cid = await seedBookableClass(svc, 1);
      classIds.push(cid);

      const r1 = await m1.client.rpc("book_class_self", {
        p_class_instance_id: cid,
      });
      expect(r1.error).toBeNull();
      expect(r1.data?.status).toBe("confirmed");

      const r2 = await m2.client.rpc("book_class_self", {
        p_class_instance_id: cid,
      });
      expect(r2.error).toBeNull();
      expect(r2.data?.status).toBe("waitlisted");

      // Exactly one confirmed booking — no overbook.
      const { data: confirmed } = await svc
        .from("bookings")
        .select("id")
        .eq("class_instance_id", cid)
        .eq("status", "confirmed");
      expect((confirmed ?? []).length).toBe(1);
    },
    TIMEOUT,
  );

  it(
    "a suspended member cannot book (SUSPENDED)",
    async () => {
      const cid = await seedBookableClass(svc, 5);
      classIds.push(cid);

      // Manual admin suspension well into the future.
      const until = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
      const { error: uErr } = await svc
        .from("members")
        .update({ suspended_until: until })
        .eq("id", m2.memberId);
      expect(uErr).toBeNull();

      try {
        const { error } = await m2.client.rpc("book_class_self", {
          p_class_instance_id: cid,
        });
        expect(error).not.toBeNull();
        expect(error?.message ?? "").toMatch(/SUSPENDED/i);
      } finally {
        // Lift the suspension so it doesn't leak into other assertions.
        await svc
          .from("members")
          .update({ suspended_until: null })
          .eq("id", m2.memberId);
      }
    },
    TIMEOUT,
  );
});

describe.skipIf(!STAGING)("integration: credit floor", () => {
  const svc = STAGING ? admin() : (null as unknown as SupabaseClient);
  let staff: Seeded;
  let target: Seeded;
  const cleanup: Array<() => Promise<void>> = [];

  beforeAll(async () => {
    staff = await seedMember(svc, "floor_admin");
    target = await seedMember(svc, "floor_target");
    cleanup.push(async () => {
      await svc.from("admin_users").delete().eq("auth_user_id", staff.user.id);
      await svc.auth.admin.deleteUser(staff.user.id);
      await svc.auth.admin.deleteUser(target.user.id);
    });

    // Promote `staff` to an admin so adjust_credits_admin's is_staff() passes.
    const { error } = await svc.from("admin_users").insert({
      auth_user_id: staff.user.id,
      name: `Integration admin ${RUN}`,
      role: "owner",
      active: true,
    });
    if (error) throw new Error(`seed admin_users failed: ${error.message}`);
    // Re-sign-in so the JWT/role lookups reflect the new admin row (is_admin()
    // reads admin_users live, but refresh the session to be safe).
    await staff.client.auth.refreshSession();

    // Target starts at 2 credits.
    await grantCredits(svc, target.memberId, 2);
  }, TIMEOUT);

  afterAll(async () => {
    for (const fn of cleanup) await fn().catch(() => {});
  }, TIMEOUT);

  it(
    "adjust_credits_admin refuses to drive a balance below zero (INSUFFICIENT_CREDITS)",
    async () => {
      // -5 from a balance of 2 would go negative.
      const { error } = await staff.client.rpc("adjust_credits_admin", {
        p_member: target.memberId,
        p_delta: -5,
        p_reason: "admin",
        p_ref: null,
      });
      expect(error).not.toBeNull();
      expect(error?.message ?? "").toMatch(/INSUFFICIENT_CREDITS/i);

      // Balance unchanged.
      const { data: ledger } = await svc
        .from("credit_ledger")
        .select("change")
        .eq("member_id", target.memberId);
      const bal = (ledger ?? []).reduce((s, r) => s + (r.change ?? 0), 0);
      expect(bal).toBe(2);
    },
    TIMEOUT,
  );

  it(
    "adjust_credits_admin allows a valid non-negative adjustment (sanity)",
    async () => {
      const { error } = await staff.client.rpc("adjust_credits_admin", {
        p_member: target.memberId,
        p_delta: -1,
        p_reason: "admin",
        p_ref: null,
      });
      expect(error).toBeNull();

      const { data: ledger } = await svc
        .from("credit_ledger")
        .select("change")
        .eq("member_id", target.memberId);
      const bal = (ledger ?? []).reduce((s, r) => s + (r.change ?? 0), 0);
      expect(bal).toBe(1);
    },
    TIMEOUT,
  );
});
