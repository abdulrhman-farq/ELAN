import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc, todayInRiyadh } from "./format";

type ServerSupabase = Awaited<ReturnType<typeof getServerSupabase>>;

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

export interface MemberNote {
  id: string;
  body: string;
  created_at: string;
}

export interface MemberDetail {
  member: MemberRow & { locale: string | null };
  leadStatus: string | null;
  source: string | null;
  balance: number;
  membershipPlanAr: string | null;
  membershipPlanEn: string | null;
  membershipEnd: string | null;
  notes: MemberNote[];
  bookings: {
    id: string;
    status: string;
    starts_at: string;
    ends_at: string;
    name_ar: string;
    name_en: string;
  }[];
}

/** member_notes is a new table not yet in the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notesTable(supabase: ServerSupabase): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from("member_notes");
}

export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  const supabase = await getServerSupabase();
  const { data: member } = await supabase
    .from("members")
    .select("id,full_name,phone,email,level,locale,created_at,lead_status,source")
    .eq("id", id)
    .maybeSingle();
  if (!member) return null;

  const [{ data: balance }, { data: membership }, { data: bookings }, { data: notes }] = await Promise.all([
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
    notesTable(supabase)
      .select("id,body,created_at")
      .eq("member_id", id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    member: member as MemberRow & { locale: string | null },
    leadStatus: (member as { lead_status: string | null }).lead_status ?? null,
    source: (member as { source: string | null }).source ?? null,
    balance: balance ?? 0,
    membershipPlanAr: membership?.membership_plans?.name_ar ?? null,
    membershipPlanEn: membership?.membership_plans?.name_en ?? null,
    membershipEnd: membership?.current_period_end ?? null,
    notes: (notes ?? []) as MemberNote[],
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

export interface MemberListRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  lead_status: string | null;
  credits: number;
  plan_ar: string | null;
  plan_en: string | null;
  period_end: string | null;
  last_seen: string | null;
  created_at: string;
}

export interface MembersKpis {
  total: number;
  active: number;
  expiring: number;
  trials: number;
  newWeek: number;
}

export interface MembersOverview {
  kpis: MembersKpis;
  rows: MemberListRow[];
}

/** Real members directory + KPIs for the admin console (gated by RLS is_admin). */
export async function getMembersOverview(search?: string, status?: string): Promise<MembersOverview> {
  const supabase = await getServerSupabase();
  const now = Date.now();
  const weekAgoIso = new Date(now - 7 * 86400000).toISOString();
  const nowIso = new Date(now).toISOString();
  const soonIso = new Date(now + 7 * 86400000).toISOString();

  // KPIs across ALL members (independent of the filtered list).
  const [{ count: total }, { count: newWeek }, { count: trials }, { count: active }, { count: expiring }] =
    await Promise.all([
      supabase.from("members").select("id", { count: "exact", head: true }),
      supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", weekAgoIso),
      supabase.from("members").select("id", { count: "exact", head: true }).eq("lead_status", "trial"),
      supabase.from("member_memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase
        .from("member_memberships")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .gte("current_period_end", nowIso)
        .lte("current_period_end", soonIso),
    ]);

  // Filtered list.
  let q = supabase
    .from("members")
    .select("id,full_name,email,phone,lead_status,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (status && status.trim()) q = q.eq("lead_status", status.trim());
  if (search && search.trim()) {
    const s = search.trim().replace(/[%,()]/g, " ");
    q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const { data: members } = await q;
  const list = members ?? [];
  const ids = list.map((m) => m.id);

  const [memberships, lastSeenRows, balances] = await Promise.all([
    ids.length
      ? supabase
          .from("member_memberships")
          .select("member_id,current_period_end,membership_plans(name_ar,name_en)")
          .eq("status", "active")
          .in("member_id", ids)
      : Promise.resolve({ data: [] as { member_id: string; current_period_end: string | null; membership_plans: { name_ar: string; name_en: string } | { name_ar: string; name_en: string }[] | null }[] }),
    ids.length
      ? supabase.from("bookings").select("member_id,created_at").in("member_id", ids)
      : Promise.resolve({ data: [] as { member_id: string; created_at: string }[] }),
    Promise.all(list.map((m) => rpc<number>(supabase, "elan_credit_balance", { p_member: m.id }).then((r) => r.data ?? 0))),
  ]);

  const mmById = new Map<string, { current_period_end: string | null; plan_ar: string | null; plan_en: string | null }>();
  for (const mm of memberships.data ?? []) {
    if (mmById.has(mm.member_id)) continue;
    const planRaw = mm.membership_plans;
    const plan = Array.isArray(planRaw) ? planRaw[0] : planRaw;
    mmById.set(mm.member_id, { current_period_end: mm.current_period_end, plan_ar: plan?.name_ar ?? null, plan_en: plan?.name_en ?? null });
  }
  const lastById = new Map<string, string>();
  for (const b of lastSeenRows.data ?? []) {
    const prev = lastById.get(b.member_id);
    if (!prev || new Date(b.created_at) > new Date(prev)) lastById.set(b.member_id, b.created_at);
  }

  const rows: MemberListRow[] = list.map((m, i) => {
    const mm = mmById.get(m.id);
    return {
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      phone: m.phone,
      lead_status: m.lead_status,
      credits: balances[i] ?? 0,
      plan_ar: mm?.plan_ar ?? null,
      plan_en: mm?.plan_en ?? null,
      period_end: mm?.current_period_end ?? null,
      last_seen: lastById.get(m.id) ?? null,
      created_at: m.created_at,
    };
  });

  return {
    kpis: {
      total: total ?? 0,
      active: active ?? 0,
      expiring: expiring ?? 0,
      trials: trials ?? 0,
      newWeek: newWeek ?? 0,
    },
    rows,
  };
}
