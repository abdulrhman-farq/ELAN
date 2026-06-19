import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc } from "./format";
import { mockBooking, mockBookings, mockCatalogue, mockClassById, mockClasses, mockMemberContext } from "./mock";

export type DisplayStatus = "available" | "waitlist_open" | "fully_booked" | "booking_closed";

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

async function fetchBetween(startIso: string, endIso: string): Promise<ClassCardData[]> {
  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("class_instances")
    .select("id,starts_at,ends_at,level,capacity,class_types(name_ar,name_en,description_ar,description_en,duration_minutes),instructors(name_ar,name_en)")
    .gte("starts_at", startIso).lt("starts_at", endIso)
    .order("starts_at", { ascending: true });
  if (!rows || rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [{ data: avail }, { data: mine }] = await Promise.all([
    supabase.from("class_instance_availability").select("*").in("class_instance_id", ids),
    supabase.from("bookings").select("id,status,class_instance_id").in("class_instance_id", ids).in("status", ["confirmed", "waitlisted"]),
  ]);
  const am = new Map((avail ?? []).map((a) => [a.class_instance_id, a]));
  const bm = new Map((mine ?? []).map((b) => [b.class_instance_id, b]));

  return rows.map((r) => {
    const a = am.get(r.id); const b = bm.get(r.id);
    return {
      id: r.id, starts_at: r.starts_at, ends_at: r.ends_at, level: r.level,
      name_ar: r.class_types?.name_ar ?? "", name_en: r.class_types?.name_en ?? "",
      description_ar: r.class_types?.description_ar ?? null, description_en: r.class_types?.description_en ?? null,
      duration_minutes: r.class_types?.duration_minutes ?? 0,
      instructor_ar: r.instructors?.name_ar ?? null, instructor_en: r.instructors?.name_en ?? null,
      display_status: (a?.display_status as DisplayStatus) ?? "available",
      spots_left: a?.spots_left ?? r.capacity, waitlist_count: a?.waitlist_count ?? 0, capacity: a?.capacity ?? r.capacity,
      is_bookable_now: a?.is_bookable_now ?? false,
      my_status: (b?.status as "confirmed" | "waitlisted" | undefined) ?? null,
      my_booking_id: b?.id ?? null,
    };
  });
}

export async function getTimetable(date: string) {
  const { start, end } = dayBoundsUtc(date);
  const rows = await fetchBetween(start, end);
  return rows.length ? rows : mockClasses(date);
}

export async function getClass(id: string): Promise<{ card: ClassCardData; eligibility: string } | null> {
  const now = Date.now();
  const all = await fetchBetween(new Date(now - 30 * 86400000).toISOString(), new Date(now + 90 * 86400000).toISOString());
  const card = all.find((c) => c.id === id);
  if (!card) return mockClassById(id);
  const supabase = await getServerSupabase();
  const { data: elig } = await rpc<string>(supabase, "booking_eligibility_self", { p_class_instance_id: id });
  return { card, eligibility: elig ?? "NO_CREDITS" };
}

export async function getMyBookings() {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("id,status,waitlist_position,created_at,class_instances(starts_at,ends_at,class_types(name_ar,name_en),instructors(name_ar,name_en))")
    .order("created_at", { ascending: false });
  const rows = (data ?? []).map((b) => ({
    id: b.id, status: b.status, waitlist_position: b.waitlist_position,
    starts_at: b.class_instances?.starts_at ?? "", ends_at: b.class_instances?.ends_at ?? "",
    name_ar: b.class_instances?.class_types?.name_ar ?? "", name_en: b.class_instances?.class_types?.name_en ?? "",
    instructor_ar: b.class_instances?.instructors?.name_ar ?? null, instructor_en: b.class_instances?.instructors?.name_en ?? null,
  }));
  return rows.length ? rows : (mockBookings() as typeof rows);
}

export async function getMemberContext() {
  try {
    const supabase = await getServerSupabase();
    const { data: member } = await supabase.from("members").select("id,full_name,phone,email").maybeSingle();
    if (!member) return mockMemberContext();
    const [{ data: balance }, { data: membership }, { data: isAdmin }] = await Promise.all([
      rpc<number>(supabase, "elan_credit_balance", { p_member: member.id }),
      supabase.from("member_memberships").select("status,current_period_end,membership_plans(name_ar,name_en)").eq("status", "active").order("current_period_end", { ascending: false }).limit(1).maybeSingle(),
      rpc<boolean>(supabase, "is_admin"),
    ]);
    // Supabase may type the embed as an array; normalise to a single object.
    const planRaw = (membership as { membership_plans?: unknown } | null)?.membership_plans;
    const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    const normalized = membership
      ? { current_period_end: (membership as { current_period_end: string }).current_period_end, membership_plans: (plan as { name_ar: string; name_en: string } | null) ?? null }
      : null;
    return { member, balance: balance ?? 0, membership: normalized, isAdmin: Boolean(isAdmin) };
  } catch (e) {
    console.error("getMemberContext failed", e);
    return mockMemberContext();
  }
}

export async function getCatalogue() {
  try {
    const supabase = await getServerSupabase();
    const [{ data: plans }, { data: packs }] = await Promise.all([
      supabase.from("membership_plans").select("*").eq("active", true).order("price_sar"),
      supabase.from("credit_packs").select("*").eq("active", true).order("price_sar"),
    ]);
    if ((plans?.length ?? 0) === 0 && (packs?.length ?? 0) === 0) return mockCatalogue();
    return { plans: plans ?? [], packs: packs ?? [] };
  } catch (e) {
    console.error("getCatalogue failed", e);
    return mockCatalogue();
  }
}

export async function getBooking(id: string) {
  const supabase = await getServerSupabase();
  const { data } = await supabase
    .from("bookings")
    .select("id,status,class_instances(starts_at,ends_at,class_types(name_ar,name_en,duration_minutes),instructors(name_ar,name_en))")
    .eq("id", id)
    .maybeSingle();
  if (!data) return mockBooking(id);
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
}
