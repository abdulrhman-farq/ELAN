import "server-only";
import { notFound, redirect } from "next/navigation";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc } from "./format";
import { DEMO } from "./demo";
import { mockBooking, mockBookings, mockCatalogue, mockClassById, mockClasses, mockMemberContext } from "./mock";

export type DisplayStatus = "available" | "waitlist_open" | "fully_booked" | "booking_closed";

/** Member id for a real signed-in subscriber (resolved via auth_user_id link).
 *  Null when logged out or admin. When non-null the member app uses real data
 *  + real booking RPCs; otherwise it falls back to the demo showcase. */
async function currentRealMemberId(): Promise<string | null> {
  try {
    const supabase = await getServerSupabase();
    const { data } = await rpc<string>(supabase, "current_member_id");
    return (data as string | null) ?? null;
  } catch {
    return null;
  }
}

export interface ClassCardData {
  id: string;
  starts_at: string;
  ends_at: string;
  level: "level_1" | "level_1_5" | "level_2";
  name_ar: string; name_en: string;
  description_ar: string | null; description_en: string | null;
  duration_minutes: number;
  instructor_ar: string | null; instructor_en: string | null;
  display_status: DisplayStatus;
  spots_left: number; waitlist_count: number; capacity: number;
  is_bookable_now: boolean;
  my_status: "confirmed" | "waitlisted" | null;
  my_booking_id: string | null;
}

/** Untyped Supabase accessor — avoids PostgREST embedded-join fragility by
 *  fetching related tables separately and joining in JS. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function q(supabase: Awaited<ReturnType<typeof getServerSupabase>>, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from(name);
}

async function fetchBetween(startIso: string, endIso: string): Promise<ClassCardData[]> {
 try {
  const supabase = await getServerSupabase();
  // Base rows only — NO embedded joins (a single failing embed used to make the
  // whole query return null, which then read as an empty schedule).
  const { data: rows, error } = await q(supabase, "class_instances")
    .select("id,starts_at,ends_at,level,capacity,class_type_id,instructor_id")
    .gte("starts_at", startIso).lt("starts_at", endIso)
    .order("starts_at", { ascending: true });
  if (error) {
    // Never swallow the error silently — surface it in server logs.
    const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/^https?:\/\//, "").split(".")[0];
    console.error(`[schedule] class_instances query error (project ref: ${ref || "default"})`, error.message ?? error);
    return [];
  }
  if (!rows || rows.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = rows.map((r: any) => r.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeIds = [...new Set(rows.map((r: any) => r.class_type_id).filter(Boolean))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const instrIds = [...new Set(rows.map((r: any) => r.instructor_id).filter(Boolean))];

  const [types, instrs, avail, mine] = await Promise.all([
    typeIds.length ? q(supabase, "class_types").select("id,name_ar,name_en,description_ar,description_en,duration_minutes").in("id", typeIds) : Promise.resolve({ data: [] }),
    instrIds.length ? q(supabase, "instructors").select("id,name_ar,name_en").in("id", instrIds) : Promise.resolve({ data: [] }),
    q(supabase, "class_instance_availability").select("*").in("class_instance_id", ids),
    q(supabase, "bookings").select("id,status,class_instance_id").in("class_instance_id", ids).in("status", ["confirmed", "waitlisted"]),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tm = new Map((types.data ?? []).map((t: any) => [t.id, t]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const im = new Map((instrs.data ?? []).map((i: any) => [i.id, i]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const am = new Map((avail.data ?? []).map((a: any) => [a.class_instance_id, a]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bm = new Map((mine.data ?? []).map((b: any) => [b.class_instance_id, b]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return rows.map((r: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ct = tm.get(r.class_type_id) as any; const ins = im.get(r.instructor_id) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = am.get(r.id) as any; const b = bm.get(r.id) as any;
    return {
      id: r.id, starts_at: r.starts_at, ends_at: r.ends_at, level: r.level,
      name_ar: ct?.name_ar ?? "", name_en: ct?.name_en ?? "",
      description_ar: ct?.description_ar ?? null, description_en: ct?.description_en ?? null,
      duration_minutes: ct?.duration_minutes ?? 0,
      instructor_ar: ins?.name_ar ?? null, instructor_en: ins?.name_en ?? null,
      display_status: (a?.display_status as DisplayStatus) ?? "available",
      spots_left: a?.spots_left ?? r.capacity, waitlist_count: a?.waitlist_count ?? 0, capacity: a?.capacity ?? r.capacity,
      is_bookable_now: a?.is_bookable_now ?? true,
      my_status: (b?.status as "confirmed" | "waitlisted" | undefined) ?? null,
      my_booking_id: b?.id ?? null,
    };
  });
 } catch (e) {
  console.error("fetchBetween failed", e);
  return [];
 }
}

export async function getTimetable(date: string) {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockClasses(date);
  const { start, end } = dayBoundsUtc(date);
  const rows = await fetchBetween(start, end);
  // Temporary diagnostic (no secrets): which project + how many rows for this day.
  const ref = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "default").replace(/^https?:\/\//, "").split(".")[0];
  console.log(`[schedule] date=${date} window=${start}..${end} ref=${ref} rows=${rows.length}`);
  // Real subscribers and production always see real data (even if empty). The
  // demo showcase only fills in mock classes when there is no real schedule.
  if (realId || !DEMO) return rows;
  return rows.length ? rows : mockClasses(date);
}

export async function getClass(id: string): Promise<{ card: ClassCardData; eligibility: string }> {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockClassById(id);
  let card: ClassCardData | undefined;
  let eligibility = "NO_CREDITS";
  try {
    const now = Date.now();
    const all = await fetchBetween(new Date(now - 30 * 86400000).toISOString(), new Date(now + 90 * 86400000).toISOString());
    card = all.find((c) => c.id === id);
    if (card) {
      const supabase = await getServerSupabase();
      const { data: elig } = await rpc<string>(supabase, "booking_eligibility_self", { p_class_instance_id: id });
      eligibility = elig ?? "NO_CREDITS";
    }
  } catch (e) {
    console.error("getClass failed", e);
    if (DEMO) return mockClassById(id);
    throw e; // surfaces via error.tsx instead of fabricating data
  }
  if (!card) {
    if (DEMO) return mockClassById(id);
    notFound(); // localized 404 instead of mock
  }
  return { card, eligibility };
}

export async function getMyBookings() {
  const realId = await currentRealMemberId();
  if (!realId && DEMO) return mockBookings();
  try {
    const supabase = await getServerSupabase();
    const { data } = await supabase
      .from("bookings")
      .select("id,status,waitlist_position,created_at,class_instances(starts_at,ends_at,class_types(name_ar,name_en),instructors(name_ar,name_en))")
      .order("created_at", { ascending: false });
    const rows = (data ?? []).map((b) => ({
      id: b.id, status: b.status as string, waitlist_position: b.waitlist_position as number | null,
      starts_at: b.class_instances?.starts_at ?? "", ends_at: b.class_instances?.ends_at ?? "",
      name_ar: b.class_instances?.class_types?.name_ar ?? "", name_en: b.class_instances?.class_types?.name_en ?? "",
      instructor_ar: b.class_instances?.instructors?.name_ar ?? null, instructor_en: b.class_instances?.instructors?.name_en ?? null,
    }));
    if (realId || !DEMO) return rows; // real / production: real bookings (even if empty)
    return rows.length ? rows : mockBookings();
  } catch (e) {
    console.error("getMyBookings failed", e);
    if (DEMO) return mockBookings();
    throw e;
  }
}

export async function getMemberContext() {
  // Resolve the real authenticated subscriber strictly via auth_user_id
  // (current_member_id), never by email. Linking happens in the signup trigger.
  try {
    const supabase = await getServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      const { data: mid } = await rpc<string>(supabase, "current_member_id");
      if (mid) {
        const { data: real } = await supabase.from("members").select("id,full_name,phone,email,role").eq("id", mid).maybeSingle();
        if (real) {
          const [{ data: bal }, { data: mem }] = await Promise.all([
            rpc<number>(supabase, "elan_credit_balance", { p_member: real.id }),
            supabase
              .from("member_memberships")
              .select("status,current_period_end,membership_plans(name_ar,name_en)")
              .eq("member_id", real.id)
              .eq("status", "active")
              .order("current_period_end", { ascending: false })
              .limit(1)
              .maybeSingle(),
          ]);
          const planRaw = (mem as { membership_plans?: unknown } | null)?.membership_plans;
          const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
          const membership = mem
            ? { current_period_end: (mem as { current_period_end: string }).current_period_end, membership_plans: (plan as { name_ar: string; name_en: string } | null) ?? null }
            : null;
          // isAdmin from the member's own role so an admin browsing the member
          // app (for testing) still sees the admin-panel link.
          const isAdmin = (real as { role?: string }).role === "admin";
          const { role: _role, ...member } = real as typeof real & { role?: string };
          void _role;
          return { member, balance: bal ?? 0, membership, isAdmin };
        }
      }
    }
  } catch (e) {
    console.error("getMemberContext (real) failed", e);
    if (!DEMO) throw e;
  }

  if (DEMO) return mockMemberContext();
  // Signed-in session with no linked member profile cannot use the member app.
  // Never fall back to an arbitrary member row (data leak) or mock data in prod.
  redirect("/login");
}

export async function getCatalogue() {
  if (DEMO) return mockCatalogue();
  try {
    const supabase = await getServerSupabase();
    const [{ data: plans }, { data: packs }] = await Promise.all([
      supabase.from("membership_plans").select("*").eq("active", true).order("price_sar"),
      supabase.from("credit_packs").select("*").eq("active", true).order("price_sar"),
    ]);
    if (DEMO && (plans?.length ?? 0) === 0 && (packs?.length ?? 0) === 0) return mockCatalogue();
    return { plans: plans ?? [], packs: packs ?? [] };
  } catch (e) {
    console.error("getCatalogue failed", e);
    if (DEMO) return mockCatalogue();
    throw e;
  }
}

export async function getBooking(id: string) {
 if (DEMO) return mockBooking(id);
 try {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("id,status,class_instances(starts_at,ends_at,class_types(name_ar,name_en,duration_minutes),instructors(name_ar,name_en))")
    .eq("id", id)
    .maybeSingle();
  if (!data) {
    if (DEMO) return mockBooking(id);
    notFound();
  }
  return {
    id: data.id,
    status: data.status,
    starts_at: data.class_instances?.starts_at ?? "",
    ends_at: data.class_instances?.ends_at ?? "",
    duration: data.class_instances?.class_types?.duration_minutes ?? 0,
    name_ar: data.class_instances?.class_types?.name_ar ?? "",
    name_en: data.class_instances?.class_types?.name_en ?? "",
    instructor_ar: data.class_instances?.instructors?.name_ar ?? null,
    instructor_en: data.class_instances?.instructors?.name_en ?? null,
  };
 } catch (e) {
  console.error("getBooking failed", e);
  if (DEMO) return mockBooking(id);
  throw e; // notFound()/real errors propagate to the 404 / error boundary
 }
}
