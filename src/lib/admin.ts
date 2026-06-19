import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc, todayInRiyadh } from "./format";

/** Returns ISO bounds for "now minus N days" up to now. */
function lastDaysIso(days: number) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Returns ISO bounds from the start of today (Riyadh) for the next N days. */
function nextDaysIso(days: number) {
  const { start } = dayBoundsUtc(todayInRiyadh());
  const end = new Date(new Date(start).getTime() + days * 86400000).toISOString();
  return { start, end };
}

export interface AdminOverview {
  classesToday: number;
  fillRateToday: number | null;
  revenueToday: number;
  revenueWeek: number;
  membersCount: number;
  upcomingClasses: number;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await getServerSupabase();
  const today = dayBoundsUtc(todayInRiyadh());
  const week = lastDaysIso(7);
  const upcoming = nextDaysIso(7);

  const { data: classes } = await supabase
    .from("class_instances")
    .select("id,capacity")
    .gte("starts_at", today.start)
    .lt("starts_at", today.end)
    .eq("status", "scheduled");
  const todayClasses = classes ?? [];

  const { data: avail } = await supabase
    .from("class_instance_availability")
    .select("class_instance_id,confirmed_count")
    .in("class_instance_id", todayClasses.map((c) => c.id));
  const confirmedById = new Map((avail ?? []).map((a) => [a.class_instance_id, a.confirmed_count ?? 0]));

  const booked = todayClasses.reduce((s, c) => s + (confirmedById.get(c.id) ?? 0), 0);
  const cap = todayClasses.reduce((s, c) => s + c.capacity, 0);

  const [{ data: payToday }, { data: payWeek }, { count: membersCount }, { count: upcomingClasses }] =
    await Promise.all([
      supabase.from("payments").select("amount_sar").eq("status", "paid").gte("created_at", today.start),
      supabase.from("payments").select("amount_sar").eq("status", "paid").gte("created_at", week.start),
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase
        .from("class_instances")
        .select("id", { count: "exact", head: true })
        .gte("starts_at", upcoming.start)
        .lt("starts_at", upcoming.end)
        .eq("status", "scheduled"),
    ]);

  const sum = (rows: { amount_sar: number }[] | null) => (rows ?? []).reduce((s, p) => s + Number(p.amount_sar), 0);

  return {
    classesToday: todayClasses.length,
    fillRateToday: cap ? Math.round((booked / cap) * 100) : null,
    revenueToday: sum(payToday),
    revenueWeek: sum(payWeek),
    membersCount: membersCount ?? 0,
    upcomingClasses: upcomingClasses ?? 0,
  };
}

export interface ScheduleRow {
  id: string;
  starts_at: string;
  ends_at: string;
  name_ar: string;
  name_en: string;
  instructor_ar: string | null;
  instructor_en: string | null;
  level: "level_1" | "level_1_5" | "level_2";
  status: "scheduled" | "cancelled";
  capacity: number;
  confirmed: number;
  waitlist: number;
}

export async function getAdminSchedule(days = 14): Promise<ScheduleRow[]> {
  const supabase = await getServerSupabase();
  const { start, end } = nextDaysIso(days);
  const { data: rows } = await supabase
    .from("class_instances")
    .select("id,starts_at,ends_at,level,capacity,status,class_types(name_ar,name_en),instructors(name_ar,name_en)")
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true });
  const classes = rows ?? [];
  if (classes.length === 0) return [];

  const { data: avail } = await supabase
    .from("class_instance_availability")
    .select("class_instance_id,confirmed_count,waitlist_count")
    .in("class_instance_id", classes.map((c) => c.id));
  const am = new Map((avail ?? []).map((a) => [a.class_instance_id, a]));

  return classes.map((c) => {
    const a = am.get(c.id);
    return {
      id: c.id,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      name_ar: c.class_types?.name_ar ?? "",
      name_en: c.class_types?.name_en ?? "",
      instructor_ar: c.instructors?.name_ar ?? null,
      instructor_en: c.instructors?.name_en ?? null,
      level: c.level,
      status: c.status,
      capacity: c.capacity,
      confirmed: a?.confirmed_count ?? 0,
      waitlist: a?.waitlist_count ?? 0,
    };
  });
}

export interface RosterEntry {
  booking_id: string;
  status: "confirmed" | "waitlisted" | "cancelled" | "attended" | "no_show" | "late_cancelled";
  waitlist_position: number | null;
  member_id: string;
  full_name: string;
  phone: string | null;
  level: "level_1" | "level_1_5" | "level_2";
}

export interface ClassRoster {
  id: string;
  starts_at: string;
  ends_at: string;
  name_ar: string;
  name_en: string;
  instructor_ar: string | null;
  instructor_en: string | null;
  level: "level_1" | "level_1_5" | "level_2";
  status: "scheduled" | "cancelled";
  capacity: number;
  confirmed: RosterEntry[];
  waitlisted: RosterEntry[];
}

export async function getClassRoster(id: string): Promise<ClassRoster | null> {
  const supabase = await getServerSupabase();
  const { data: c } = await supabase
    .from("class_instances")
    .select("id,starts_at,ends_at,level,capacity,status,class_types(name_ar,name_en),instructors(name_ar,name_en)")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;

  const { data: rows } = await supabase
    .from("bookings")
    .select("id,status,waitlist_position,members(id,full_name,phone,level)")
    .eq("class_instance_id", id)
    .order("waitlist_position", { ascending: true });

  const entries: RosterEntry[] = (rows ?? []).map((b) => ({
    booking_id: b.id,
    status: b.status,
    waitlist_position: b.waitlist_position,
    member_id: b.members?.id ?? "",
    full_name: b.members?.full_name ?? "—",
    phone: b.members?.phone ?? null,
    level: b.members?.level ?? "level_1",
  }));

  return {
    id: c.id,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    name_ar: c.class_types?.name_ar ?? "",
    name_en: c.class_types?.name_en ?? "",
    instructor_ar: c.instructors?.name_ar ?? null,
    instructor_en: c.instructors?.name_en ?? null,
    level: c.level,
    status: c.status,
    capacity: c.capacity,
    confirmed: entries.filter((e) => e.status === "confirmed" || e.status === "attended" || e.status === "no_show"),
    waitlisted: entries.filter((e) => e.status === "waitlisted"),
  };
}

export interface MemberRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  level: "level_1" | "level_1_5" | "level_2";
  created_at: string;
}

export async function getMembersDirectory(search?: string): Promise<MemberRow[]> {
  const supabase = await getServerSupabase();
  let q = supabase
    .from("members")
    .select("id,full_name,phone,email,level,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (search && search.trim()) {
    const s = search.trim().replace(/[%,()]/g, " ");
    q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const { data } = await q;
  return (data ?? []) as MemberRow[];
}

export interface MemberDetail {
  member: MemberRow & { locale: string | null };
  balance: number;
  membershipPlanAr: string | null;
  membershipPlanEn: string | null;
  membershipEnd: string | null;
  bookings: {
    id: string;
    status: string;
    starts_at: string;
    ends_at: string;
    name_ar: string;
    name_en: string;
  }[];
}

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  const supabase = await getServerSupabase();
  const { data: member } = await supabase
    .from("members")
    .select("id,full_name,phone,email,level,locale,created_at")
    .eq("id", id)
    .maybeSingle();
  if (!member) return null;

  const [{ data: balance }, { data: membership }, { data: bookings }] = await Promise.all([
    rpc<number>(supabase, "elan_credit_balance", { p_member: id }),
    supabase
      .from("member_memberships")
      .select("current_period_end,membership_plans(name_ar,name_en)")
      .eq("member_id", id)
      .eq("status", "active")
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("id,status,created_at,class_instances(starts_at,ends_at,class_types(name_ar,name_en))")
      .eq("member_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    member: member as MemberRow & { locale: string | null },
    balance: balance ?? 0,
    membershipPlanAr: membership?.membership_plans?.name_ar ?? null,
    membershipPlanEn: membership?.membership_plans?.name_en ?? null,
    membershipEnd: membership?.current_period_end ?? null,
    bookings: (bookings ?? []).map((b) => ({
      id: b.id,
      status: b.status,
      starts_at: b.class_instances?.starts_at ?? "",
      ends_at: b.class_instances?.ends_at ?? "",
      name_ar: b.class_instances?.class_types?.name_ar ?? "",
      name_en: b.class_instances?.class_types?.name_en ?? "",
    })),
  };
}

export interface AdminReports {
  revenue30: number;
  revenueByType: { membership: number; credit_pack: number; penalty: number };
  paymentsCount: number;
  bookingsByStatus: Record<string, number>;
}

export async function getReports(): Promise<AdminReports> {
  const supabase = await getServerSupabase();
  const { start } = lastDaysIso(30);

  const [{ data: pays }, { data: books }] = await Promise.all([
    supabase.from("payments").select("amount_sar,type").eq("status", "paid").gte("created_at", start),
    supabase.from("bookings").select("status").gte("created_at", start),
  ]);

  const revenueByType = { membership: 0, credit_pack: 0, penalty: 0 };
  let revenue30 = 0;
  for (const p of pays ?? []) {
    const amt = Number(p.amount_sar);
    revenue30 += amt;
    if (p.type in revenueByType) revenueByType[p.type as keyof typeof revenueByType] += amt;
  }

  const bookingsByStatus: Record<string, number> = {};
  for (const b of books ?? []) bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1;

  return { revenue30, revenueByType, paymentsCount: (pays ?? []).length, bookingsByStatus };
}
