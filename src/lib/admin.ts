import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc, todayInRiyadh } from "./format";
import { grossFromNet, DEFAULT_CLASS_NET_HALALAS } from "./pricing";

type ServerSupabase = Awaited<ReturnType<typeof getServerSupabase>>;

/** Untyped table accessor for tables/columns outside the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyFrom(supabase: ServerSupabase, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from(name);
}

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
  instructor_id: string | null;
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
  // No embedded joins (they can silently return null); fetch + join in JS.
  const { data: rows } = await anyFrom(supabase, "class_instances")
    .select("id,starts_at,ends_at,level,capacity,status,class_type_id,instructor_id")
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const classes = (rows ?? []) as any[];
  if (classes.length === 0) return [];

  const ids = classes.map((c) => c.id);
  const typeIds = [...new Set(classes.map((c) => c.class_type_id).filter(Boolean))];
  const instrIds = [...new Set(classes.map((c) => c.instructor_id).filter(Boolean))];
  const [availR, typesR, instrsR] = await Promise.all([
    anyFrom(supabase, "class_instance_availability").select("class_instance_id,confirmed_count,waitlist_count").in("class_instance_id", ids),
    typeIds.length ? anyFrom(supabase, "class_types").select("id,name_ar,name_en").in("id", typeIds) : Promise.resolve({ data: [] }),
    instrIds.length ? anyFrom(supabase, "instructors").select("id,name_ar,name_en").in("id", instrIds) : Promise.resolve({ data: [] }),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const am = new Map((availR.data ?? []).map((a: any) => [a.class_instance_id, a]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tm = new Map((typesR.data ?? []).map((t: any) => [t.id, t]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const im = new Map((instrsR.data ?? []).map((i: any) => [i.id, i]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return classes.map((c: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = am.get(c.id) as any; const ct = tm.get(c.class_type_id) as any; const ins = im.get(c.instructor_id) as any;
    return {
      id: c.id,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      name_ar: ct?.name_ar ?? "",
      name_en: ct?.name_en ?? "",
      instructor_id: c.instructor_id ?? null,
      instructor_ar: ins?.name_ar ?? null,
      instructor_en: ins?.name_en ?? null,
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: c } = await anyFrom(supabase, "class_instances")
    .select("id,starts_at,ends_at,level,capacity,status,class_type_id,instructor_id")
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;

  const [ctR, insR, rowsR] = await Promise.all([
    c.class_type_id ? anyFrom(supabase, "class_types").select("name_ar,name_en").eq("id", c.class_type_id).maybeSingle() : Promise.resolve({ data: null }),
    c.instructor_id ? anyFrom(supabase, "instructors").select("name_ar,name_en").eq("id", c.instructor_id).maybeSingle() : Promise.resolve({ data: null }),
    anyFrom(supabase, "bookings").select("id,status,waitlist_position,member_id").eq("class_instance_id", id).order("waitlist_position", { ascending: true }),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (rowsR.data ?? []) as any[];
  const memberIds = [...new Set(rows.map((b) => b.member_id).filter(Boolean))];
  const { data: mems } = memberIds.length
    ? await anyFrom(supabase, "members").select("id,full_name,phone,level").in("id", memberIds)
    : { data: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mm = new Map((mems ?? []).map((m: any) => [m.id, m]));

  const entries: RosterEntry[] = rows.map((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = mm.get(b.member_id) as any;
    return {
      booking_id: b.id,
      status: b.status,
      waitlist_position: b.waitlist_position,
      member_id: b.member_id ?? "",
      full_name: m?.full_name ?? "—",
      phone: m?.phone ?? null,
      level: m?.level ?? "level_1",
    };
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ct = ctR.data as any; const ins = insR.data as any;

  return {
    id: c.id,
    starts_at: c.starts_at,
    ends_at: c.ends_at,
    name_ar: ct?.name_ar ?? "",
    name_en: ct?.name_en ?? "",
    instructor_ar: ins?.name_ar ?? null,
    instructor_en: ins?.name_en ?? null,
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

export async function getMembersDirectory(search?: string, page = 1, pageSize = 200): Promise<MemberRow[]> {
  const supabase = await getServerSupabase();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 200);
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;
  let q = supabase
    .from("members")
    .select("id,full_name,phone,email,level,created_at")
    .order("created_at", { ascending: false })
    .range(from, to);
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
  recommendedClass: string | null;
  balance: number;
  membershipPlanAr: string | null;
  membershipPlanEn: string | null;
  membershipEnd: string | null;
  suspendedUntil: string | null; // effective suspension end (null = active)
  recentPenalties: number; // no-show + late-cancel in the suspension window
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
  const { data: member } = await anyFrom(supabase, "members")
    .select("id,full_name,phone,email,level,locale,created_at,lead_status,source,recommended_class")
    .eq("id", id)
    .maybeSingle();
  if (!member) return null;

  const penaltyWindowIso = new Date(Date.now() - 60 * 86400000).toISOString();
  const [{ data: balance }, { data: membership }, { data: bookings }, { data: notes }, { data: suspendedUntil }, { data: penaltyRows }] = await Promise.all([
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
    rpc<string>(supabase, "member_suspended_until", { p_member: id }),
    anyFrom(supabase, "penalties")
      .select("id")
      .eq("member_id", id)
      .in("kind", ["no_show", "late_cancel"])
      .gte("created_at", penaltyWindowIso),
  ]);

  return {
    member: member as MemberRow & { locale: string | null },
    leadStatus: (member as { lead_status: string | null }).lead_status ?? null,
    source: (member as { source: string | null }).source ?? null,
    recommendedClass: (member as { recommended_class: string | null }).recommended_class ?? null,
    balance: balance ?? 0,
    membershipPlanAr: membership?.membership_plans?.name_ar ?? null,
    membershipPlanEn: membership?.membership_plans?.name_en ?? null,
    membershipEnd: membership?.current_period_end ?? null,
    suspendedUntil: (suspendedUntil as string | null) ?? null,
    recentPenalties: (penaltyRows ?? []).length,
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

export interface ReportParams {
  from?: string; // YYYY-MM-DD (Riyadh), inclusive
  to?: string; // YYYY-MM-DD (Riyadh), inclusive
  days?: number; // fallback window when from/to not given
  instructorId?: string; // filter booking metrics to one trainer
  classTypeId?: string; // filter booking metrics to one class type
}

export interface ReportGroupRow {
  id: string;
  name_ar: string;
  name_en: string;
  bookings: number;
  attended: number;
  valueHalalas: number; // sum of list value (utilization)
}

export interface AdminReports {
  rangeStart: string; // ISO
  rangeEnd: string; // ISO
  // Cash sales (from paid payments in range) — halalas
  grossHalalas: number;
  netHalalas: number;
  vatHalalas: number;
  discountsHalalas: number;
  paymentsCount: number;
  revenueByType: Record<string, number>; // gross halalas per payment type
  // Booking-derived value (in range, by list value) — halalas
  compValueHalalas: number;
  packageUtilHalalas: number;
  unlimitedUtilHalalas: number;
  noShowLostHalalas: number;
  cancellationValueHalalas: number;
  bookingsByStatus: Record<string, number>;
  byTrainer: ReportGroupRow[]; // booking utilization grouped by instructor
  byClassType: ReportGroupRow[]; // booking utilization grouped by class type
}

export async function getReports(params: ReportParams | number = {}): Promise<AdminReports> {
  const p: ReportParams = typeof params === "number" ? { days: params } : params;
  const supabase = await getServerSupabase();

  // Resolve the date range: explicit from/to (Riyadh days) override the rolling window.
  let startIso: string, endIso: string;
  if (p.from || p.to) {
    const from = p.from || p.to!;
    const to = p.to || p.from!;
    startIso = new Date(`${from}T00:00:00+03:00`).toISOString();
    endIso = new Date(`${to}T23:59:59+03:00`).toISOString();
  } else {
    const windowDays = Math.min(365, Math.max(1, Math.floor(p.days || 30) || 30));
    const r = lastDaysIso(windowDays);
    startIso = r.start;
    endIso = r.end;
  }

  const [{ data: pays }, { data: books }] = await Promise.all([
    anyFrom(supabase, "payments")
      .select("type,amount_sar,gross_halalas,net_halalas,vat_amount_halalas,discount_amount_halalas")
      .eq("status", "paid")
      .gte("created_at", startIso).lte("created_at", endIso),
    anyFrom(supabase, "bookings")
      .select("status,pricing_source,list_value_halalas,class_instance_id")
      .gte("created_at", startIso).lte("created_at", endIso),
  ]);

  let grossHalalas = 0, netHalalas = 0, vatHalalas = 0, discountsHalalas = 0;
  const revenueByType: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const pay of (pays ?? []) as any[]) {
    const g = pay.gross_halalas ?? Math.round(Number(pay.amount_sar || 0) * 100);
    grossHalalas += g; netHalalas += pay.net_halalas ?? 0; vatHalalas += pay.vat_amount_halalas ?? 0;
    discountsHalalas += pay.discount_amount_halalas ?? 0;
    revenueByType[pay.type] = (revenueByType[pay.type] ?? 0) + g;
  }

  // Resolve each booking's class instance → instructor + class type (for grouping/filtering).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allBooks = (books ?? []) as any[];
  const ciIds = [...new Set(allBooks.map((b) => b.class_instance_id).filter(Boolean))];
  const { data: cis } = ciIds.length
    ? await anyFrom(supabase, "class_instances").select("id,instructor_id,class_type_id").in("id", ciIds)
    : { data: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ciMap = new Map((cis ?? []).map((c: any) => [c.id, c]));
  const [{ data: trainers }, { data: ctypes }] = await Promise.all([
    anyFrom(supabase, "instructors").select("id,name_ar,name_en"),
    anyFrom(supabase, "class_types").select("id,name_ar,name_en"),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trMap = new Map((trainers ?? []).map((t: any) => [t.id, t]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctMap = new Map((ctypes ?? []).map((t: any) => [t.id, t]));

  let compValueHalalas = 0, packageUtilHalalas = 0, unlimitedUtilHalalas = 0, noShowLostHalalas = 0, cancellationValueHalalas = 0;
  const bookingsByStatus: Record<string, number> = {};
  const byTrainerMap = new Map<string, ReportGroupRow>();
  const byClassTypeMap = new Map<string, ReportGroupRow>();

  for (const b of allBooks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ci = ciMap.get(b.class_instance_id) as any;
    const instId = ci?.instructor_id as string | undefined;
    const ctId = ci?.class_type_id as string | undefined;
    // Apply optional trainer / class-type filters to the booking metrics.
    if (p.instructorId && instId !== p.instructorId) continue;
    if (p.classTypeId && ctId !== p.classTypeId) continue;

    const lv = b.list_value_halalas ?? 0;
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1;
    if (b.pricing_source === "complimentary") compValueHalalas += lv;
    if (b.pricing_source === "package_credit") packageUtilHalalas += lv;
    if (b.pricing_source === "unlimited_membership") unlimitedUtilHalalas += lv;
    if (b.status === "no_show") noShowLostHalalas += lv;
    if (b.status === "cancelled" || b.status === "late_cancelled") cancellationValueHalalas += lv;

    if (instId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = trMap.get(instId) as any;
      const row = byTrainerMap.get(instId) ?? { id: instId, name_ar: t?.name_ar ?? "—", name_en: t?.name_en ?? "—", bookings: 0, attended: 0, valueHalalas: 0 };
      row.bookings++; if (b.status === "attended") row.attended++; row.valueHalalas += lv;
      byTrainerMap.set(instId, row);
    }
    if (ctId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const t = ctMap.get(ctId) as any;
      const row = byClassTypeMap.get(ctId) ?? { id: ctId, name_ar: t?.name_ar ?? "—", name_en: t?.name_en ?? "—", bookings: 0, attended: 0, valueHalalas: 0 };
      row.bookings++; if (b.status === "attended") row.attended++; row.valueHalalas += lv;
      byClassTypeMap.set(ctId, row);
    }
  }

  const paysCount = p.instructorId || p.classTypeId ? 0 : (pays ?? []).length;
  return {
    rangeStart: startIso,
    rangeEnd: endIso,
    grossHalalas, netHalalas, vatHalalas, discountsHalalas,
    paymentsCount: paysCount,
    revenueByType,
    compValueHalalas, packageUtilHalalas, unlimitedUtilHalalas, noShowLostHalalas, cancellationValueHalalas,
    bookingsByStatus,
    byTrainer: [...byTrainerMap.values()].sort((a, b) => b.bookings - a.bookings),
    byClassType: [...byClassTypeMap.values()].sort((a, b) => b.bookings - a.bookings),
  };
}

// ---- Occupancy / peak-time analytics (#9) --------------------------------

export interface OccupancyCell {
  weekday: number; // 0=Sun … 6=Sat (JS getUTCDay convention, in Riyadh time)
  hour: number; // 0-23 Riyadh
  capacity: number;
  booked: number;
  classes: number;
}

export interface OccupancyReport {
  rangeStart: string;
  rangeEnd: string;
  totalClasses: number;
  totalCapacity: number;
  totalBooked: number;
  fillRate: number | null; // 0-100, booked/capacity
  cells: OccupancyCell[]; // only non-empty (weekday,hour) buckets
  hours: number[]; // distinct hours present, ascending
  byWeekday: { weekday: number; capacity: number; booked: number; classes: number }[];
}

const RIYADH_TZ = "Asia/Riyadh";
const WD_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const occHourFmt = new Intl.DateTimeFormat("en-GB", { timeZone: RIYADH_TZ, hour: "2-digit", hour12: false });
const occWdFmt = new Intl.DateTimeFormat("en-US", { timeZone: RIYADH_TZ, weekday: "short" });

/** Aggregate class occupancy by Riyadh weekday × hour for a peak-time heatmap. */
export async function getOccupancy(params: ReportParams | number = {}): Promise<OccupancyReport> {
  const p: ReportParams = typeof params === "number" ? { days: params } : params;
  const supabase = await getServerSupabase();

  let startIso: string, endIso: string;
  if (p.from || p.to) {
    const from = p.from || p.to!;
    const to = p.to || p.from!;
    startIso = new Date(`${from}T00:00:00+03:00`).toISOString();
    endIso = new Date(`${to}T23:59:59+03:00`).toISOString();
  } else {
    const windowDays = Math.min(365, Math.max(1, Math.floor(p.days || 30) || 30));
    const r = lastDaysIso(windowDays);
    startIso = r.start;
    endIso = r.end;
  }

  // Only real (non-cancelled) classes count toward occupancy.
  const { data: classes } = await anyFrom(supabase, "class_instances")
    .select("id,starts_at,capacity,status,instructor_id,class_type_id")
    .gte("starts_at", startIso).lte("starts_at", endIso)
    .neq("status", "cancelled");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let list = (classes ?? []) as any[];
  if (p.instructorId) list = list.filter((c) => c.instructor_id === p.instructorId);
  if (p.classTypeId) list = list.filter((c) => c.class_type_id === p.classTypeId);

  const empty: OccupancyReport = {
    rangeStart: startIso, rangeEnd: endIso, totalClasses: 0, totalCapacity: 0,
    totalBooked: 0, fillRate: null, cells: [], hours: [], byWeekday: [],
  };
  if (list.length === 0) return empty;

  const ids = list.map((c) => c.id);
  const { data: avail } = await anyFrom(supabase, "class_instance_availability")
    .select("class_instance_id,confirmed_count").in("class_instance_id", ids);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookedMap = new Map((avail ?? []).map((a: any) => [a.class_instance_id, a.confirmed_count ?? 0]));

  const cellMap = new Map<string, OccupancyCell>();
  const hourSet = new Set<number>();
  let totalCapacity = 0, totalBooked = 0;

  for (const c of list) {
    const d = new Date(c.starts_at);
    const hour = Number.parseInt(occHourFmt.format(d), 10);
    const weekday = WD_INDEX[occWdFmt.format(d)] ?? 0;
    const cap = c.capacity ?? 0;
    const booked = (bookedMap.get(c.id) as number) ?? 0;
    totalCapacity += cap; totalBooked += booked; hourSet.add(hour);
    const key = `${weekday}-${hour}`;
    const cell = cellMap.get(key) ?? { weekday, hour, capacity: 0, booked: 0, classes: 0 };
    cell.capacity += cap; cell.booked += booked; cell.classes += 1;
    cellMap.set(key, cell);
  }

  const byWeekdayMap = new Map<number, { weekday: number; capacity: number; booked: number; classes: number }>();
  for (const cell of cellMap.values()) {
    const w = byWeekdayMap.get(cell.weekday) ?? { weekday: cell.weekday, capacity: 0, booked: 0, classes: 0 };
    w.capacity += cell.capacity; w.booked += cell.booked; w.classes += cell.classes;
    byWeekdayMap.set(cell.weekday, w);
  }

  return {
    rangeStart: startIso,
    rangeEnd: endIso,
    totalClasses: list.length,
    totalCapacity,
    totalBooked,
    fillRate: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : null,
    cells: [...cellMap.values()],
    hours: [...hourSet].sort((a, b) => a - b),
    byWeekday: [...byWeekdayMap.values()],
  };
}

export interface MemberFinancials {
  totalPaidHalalas: number;
  totalDiscountHalalas: number;
  attendedValueHalalas: number;
  remainingPackageHalalas: number;
  noShowValueHalalas: number;
  compValueHalalas: number;
}

export async function getMemberFinancials(memberId: string): Promise<MemberFinancials> {
  const supabase = await getServerSupabase();
  const [{ data: pays }, { data: books }, { data: bal }] = await Promise.all([
    anyFrom(supabase, "payments").select("gross_halalas,amount_sar,discount_amount_halalas").eq("member_id", memberId).eq("status", "paid"),
    anyFrom(supabase, "bookings").select("status,pricing_source,list_value_halalas").eq("member_id", memberId),
    rpc<number>(supabase, "elan_credit_balance", { p_member: memberId }),
  ]);
  let totalPaidHalalas = 0,
    totalDiscountHalalas = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (pays ?? []) as any[]) {
    totalPaidHalalas += p.gross_halalas ?? Math.round(Number(p.amount_sar || 0) * 100);
    totalDiscountHalalas += p.discount_amount_halalas ?? 0;
  }
  let attendedValueHalalas = 0,
    noShowValueHalalas = 0,
    compValueHalalas = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (books ?? []) as any[]) {
    const lv = b.list_value_halalas ?? 0;
    if (b.status === "attended") attendedValueHalalas += lv;
    if (b.status === "no_show") noShowValueHalalas += lv;
    if (b.pricing_source === "complimentary") compValueHalalas += lv;
  }
  return {
    totalPaidHalalas,
    totalDiscountHalalas,
    attendedValueHalalas,
    remainingPackageHalalas: (bal ?? 0) * grossFromNet(DEFAULT_CLASS_NET_HALALAS),
    noShowValueHalalas,
    compValueHalalas,
  };
}

export interface MemberPaymentRow {
  id: string;
  type: string;
  status: string;
  gross_halalas: number;
  credits: number;
  method: string | null;
  created_at: string;
  starts_at: string | null;
}

export async function getMemberPayments(memberId: string): Promise<MemberPaymentRow[]> {
  const supabase = await getServerSupabase();
  const { data } = await anyFrom(supabase, "payments")
    .select("id,type,status,gross_halalas,amount_sar,credits,method,created_at,starts_at")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(20);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((p) => ({
    id: p.id,
    type: p.type,
    status: p.status,
    gross_halalas: p.gross_halalas ?? Math.round(Number(p.amount_sar || 0) * 100),
    credits: p.credits ?? 0,
    method: p.method ?? null,
    created_at: p.created_at,
    starts_at: p.starts_at ?? null,
  }));
}

export interface PromoCodeRow {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  starts_at: string | null;
  expires_at: string | null;
  max_redemptions: number | null;
  per_member_limit: number | null;
  active: boolean;
  redemptions: number;
}

export async function getPromoCodes(): Promise<PromoCodeRow[]> {
  const supabase = await getServerSupabase();
  const { data } = await anyFrom(supabase, "promo_codes").select("*").order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (data ?? []) as any[];
  const ids = list.map((p) => p.id);
  const counts = new Map<string, number>();
  if (ids.length) {
    const { data: reds } = await anyFrom(supabase, "promo_redemptions").select("promo_code_id").in("promo_code_id", ids);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const r of (reds ?? []) as any[]) counts.set(r.promo_code_id, (counts.get(r.promo_code_id) ?? 0) + 1);
  }
  return list.map((p) => ({
    id: p.id,
    code: p.code,
    discount_type: p.discount_type,
    discount_value: p.discount_value,
    starts_at: p.starts_at,
    expires_at: p.expires_at,
    max_redemptions: p.max_redemptions,
    per_member_limit: p.per_member_limit,
    active: p.active,
    redemptions: counts.get(p.id) ?? 0,
  }));
}

export interface DashboardData {
  bookingsToday: number;
  fillRate: number | null;
  newMembersWeek: number;
  revenueMonth: number;
  today: {
    id: string;
    starts_at: string;
    name_ar: string;
    name_en: string;
    instructor_ar: string | null;
    instructor_en: string | null;
    booked: number;
    capacity: number;
    open: boolean;
  }[];
  waitlist: { name: string; class_ar: string; class_en: string; starts_at: string }[];
  topClass: { name_en: string; pct: number } | null;
  newBookingsToday: number;
  noShowsToday: number;
  revenueToday: number;
  upcomingCount: number;
  topAttenders: { id: string; name: string; attended: number }[];
  atRisk: { id: string; name: string; ends_at: string }[];
}

export async function getDashboard(): Promise<DashboardData> {
  const supabase = await getServerSupabase();
  const today = dayBoundsUtc(todayInRiyadh());
  const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();
  const d = new Date();
  const monthStartIso = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();

  // No embedded joins — fetch today's classes, then resolve type/instructor in JS.
  const { data: classesRaw } = await anyFrom(supabase, "class_instances")
    .select("id,starts_at,capacity,class_type_id,instructor_id")
    .gte("starts_at", today.start)
    .lt("starts_at", today.end)
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cls = (classesRaw ?? []) as any[];
  const ids = cls.map((c) => c.id);
  const typeIds = [...new Set(cls.map((c) => c.class_type_id).filter(Boolean))];
  const instrIds = [...new Set(cls.map((c) => c.instructor_id).filter(Boolean))];

  const nowIso = new Date().toISOString();
  const attendedSinceIso = new Date(Date.now() - 90 * 86400000).toISOString();
  const riskUntilIso = new Date(Date.now() + 7 * 86400000).toISOString();

  const [availR, wlR, newMembersR, paysR, newBookingsR, typesR, instrsR, noShowR, revTodayR, upcomingR, attendedR, atRiskR] = await Promise.all([
    ids.length ? anyFrom(supabase, "class_instance_availability").select("class_instance_id,confirmed_count").in("class_instance_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? anyFrom(supabase, "bookings").select("id,member_id,class_instance_id").eq("status", "waitlisted").in("class_instance_id", ids) : Promise.resolve({ data: [] }),
    anyFrom(supabase, "members").select("id", { count: "exact", head: true }).gte("created_at", weekAgoIso),
    anyFrom(supabase, "payments").select("amount_sar").eq("status", "paid").gte("created_at", monthStartIso),
    anyFrom(supabase, "bookings").select("id", { count: "exact", head: true }).eq("status", "confirmed").gte("created_at", today.start).lt("created_at", today.end),
    typeIds.length ? anyFrom(supabase, "class_types").select("id,name_ar,name_en").in("id", typeIds) : Promise.resolve({ data: [] }),
    instrIds.length ? anyFrom(supabase, "instructors").select("id,name_ar,name_en").in("id", instrIds) : Promise.resolve({ data: [] }),
    ids.length ? anyFrom(supabase, "bookings").select("id", { count: "exact", head: true }).eq("status", "no_show").in("class_instance_id", ids) : Promise.resolve({ count: 0 }),
    anyFrom(supabase, "payments").select("amount_sar").eq("status", "paid").gte("created_at", today.start).lt("created_at", today.end),
    anyFrom(supabase, "class_instances").select("id", { count: "exact", head: true }).eq("status", "scheduled").gte("starts_at", nowIso),
    anyFrom(supabase, "bookings").select("member_id").eq("status", "attended").gte("created_at", attendedSinceIso),
    anyFrom(supabase, "member_memberships").select("member_id,current_period_end").eq("status", "active").gte("current_period_end", nowIso).lte("current_period_end", riskUntilIso).order("current_period_end", { ascending: true }),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avail = availR.data as any[]; const wl = (wlR.data ?? []) as any[]; const newMembersWeek = newMembersR.count; const pays = (paysR.data ?? []) as any[]; const newBookingsToday = newBookingsR.count;
  const noShowsToday = noShowR.count ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const revenueToday = ((revTodayR.data ?? []) as any[]).reduce((s, p) => s + Number(p.amount_sar || 0), 0);
  const upcomingCount = upcomingR.count ?? 0;

  // Top attenders (last 90 days) + at-risk members (membership ending within 7 days).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const attCounts = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of ((attendedR.data ?? []) as any[])) if (b.member_id) attCounts.set(b.member_id, (attCounts.get(b.member_id) ?? 0) + 1);
  const topAttenderIds = [...attCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atRiskRaw = ((atRiskR.data ?? []) as any[]).slice(0, 8);
  const nameIds = [...new Set([...topAttenderIds.map(([id]) => id), ...atRiskRaw.map((r) => r.member_id)].filter(Boolean))];
  const { data: nameRows } = nameIds.length ? await anyFrom(supabase, "members").select("id,full_name").in("id", nameIds) : { data: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nameMap = new Map(((nameRows ?? []) as any[]).map((m) => [m.id, m.full_name]));
  const topAttenders = topAttenderIds.map(([id, attended]) => ({ id, name: nameMap.get(id) ?? "—", attended }));
  const atRisk = atRiskRaw.map((r) => ({ id: r.member_id, name: nameMap.get(r.member_id) ?? "—", ends_at: r.current_period_end }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tm = new Map((typesR.data ?? []).map((t: any) => [t.id, t]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const im = new Map((instrsR.data ?? []).map((i: any) => [i.id, i]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ciInfo = new Map(cls.map((c: any) => [c.id, c]));
  const wlMemberIds = [...new Set(wl.map((w) => w.member_id).filter(Boolean))];
  const { data: wlMems } = wlMemberIds.length ? await anyFrom(supabase, "members").select("id,full_name").in("id", wlMemberIds) : { data: [] };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wlmm = new Map((wlMems ?? []).map((m: any) => [m.id, m]));

  const conf = new Map((avail ?? []).map((a) => [a.class_instance_id, a.confirmed_count ?? 0]));
  const booked = cls.reduce((s, c) => s + (conf.get(c.id) ?? 0), 0);
  const cap = cls.reduce((s, c) => s + c.capacity, 0);

  let topClass: { name_en: string; pct: number } | null = null;
  for (const c of cls) {
    const pct = c.capacity ? Math.round(((conf.get(c.id) ?? 0) / c.capacity) * 100) : 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!topClass || pct > topClass.pct) topClass = { name_en: (tm.get(c.class_type_id) as any)?.name_en ?? "", pct };
  }

  return {
    bookingsToday: booked,
    fillRate: cap ? Math.round((booked / cap) * 100) : null,
    newMembersWeek: newMembersWeek ?? 0,
    revenueMonth: pays.reduce((s, p) => s + Number(p.amount_sar), 0),
    today: cls.map((c) => {
      const b = conf.get(c.id) ?? 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ct = tm.get(c.class_type_id) as any; const ins = im.get(c.instructor_id) as any;
      return {
        id: c.id,
        starts_at: c.starts_at,
        name_ar: ct?.name_ar ?? "",
        name_en: ct?.name_en ?? "",
        instructor_ar: ins?.name_ar ?? null,
        instructor_en: ins?.name_en ?? null,
        booked: b,
        capacity: c.capacity,
        open: b < c.capacity,
      };
    }),
    waitlist: wl.map((w) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ci = ciInfo.get(w.class_instance_id) as any; const ct = ci ? (tm.get(ci.class_type_id) as any) : null;
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (wlmm.get(w.member_id) as any)?.full_name ?? "—",
        class_ar: ct?.name_ar ?? "",
        class_en: ct?.name_en ?? "",
        starts_at: ci?.starts_at ?? "",
      };
    }),
    topClass,
    newBookingsToday: newBookingsToday ?? 0,
    noShowsToday,
    revenueToday,
    upcomingCount,
    topAttenders,
    atRisk,
  };
}

export interface TrainerRow {
  id: string;
  name_ar: string;
  name_en: string;
  bio_ar: string | null;
  bio_en: string | null;
  classesThisWeek: number;
  /** Whether this instructor has a linked login (trainer-portal access). */
  linked: boolean;
}

export async function getInstructors(): Promise<TrainerRow[]> {
  const supabase = await getServerSupabase();
  const week = nextDaysIso(7);
  const [{ data: trainers }, { data: cls }] = await Promise.all([
    anyFrom(supabase, "instructors").select("id,name_ar,name_en,bio_ar,bio_en,auth_user_id").eq("active", true).order("name_en"),
    supabase.from("class_instances").select("instructor_id").gte("starts_at", week.start).lt("starts_at", week.end).eq("status", "scheduled"),
  ]);
  const counts = new Map<string, number>();
  for (const c of cls ?? []) if (c.instructor_id) counts.set(c.instructor_id, (counts.get(c.instructor_id) ?? 0) + 1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((trainers ?? []) as any[]).map((t) => ({
    id: t.id,
    name_ar: t.name_ar,
    name_en: t.name_en,
    bio_ar: t.bio_ar,
    bio_en: t.bio_en,
    classesThisWeek: counts.get(t.id) ?? 0,
    linked: Boolean(t.auth_user_id),
  }));
}

export interface ScheduleFormOptions {
  classTypes: { id: string; name_ar: string; name_en: string }[];
  instructors: { id: string; name_ar: string; name_en: string }[];
}

export async function getScheduleFormOptions(): Promise<ScheduleFormOptions> {
  const supabase = await getServerSupabase();
  const [{ data: types }, { data: instructors }] = await Promise.all([
    supabase.from("class_types").select("id,name_ar,name_en").order("name_en"),
    supabase.from("instructors").select("id,name_ar,name_en").eq("active", true).order("name_en"),
  ]);
  return { classTypes: types ?? [], instructors: instructors ?? [] };
}

export interface MemberListRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  lead_status: string | null;
  source: string | null;
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
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Default number of member rows per page in the admin directory. */
export const MEMBERS_PAGE_SIZE = 25;

/**
 * Sums the credit_ledger.change column per member for the given member ids and
 * returns a Map<member_id, balance>. Replaces the per-member elan_credit_balance
 * RPC (one query instead of N).
 */
async function creditBalancesByMember(supabase: ServerSupabase, ids: string[]): Promise<Map<string, number>> {
  const balances = new Map<string, number>();
  if (ids.length === 0) return balances;
  const { data } = await anyFrom(supabase, "credit_ledger").select("member_id,change").in("member_id", ids);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    balances.set(r.member_id, (balances.get(r.member_id) ?? 0) + Number(r.change ?? 0));
  }
  return balances;
}

/** Real members directory + KPIs for the admin console (gated by RLS is_admin). */
export async function getMembersOverview(search?: string, status?: string, page = 1, pageSize = MEMBERS_PAGE_SIZE): Promise<MembersOverview> {
  const supabase = await getServerSupabase();
  const now = Date.now();
  const weekAgoIso = new Date(now - 7 * 86400000).toISOString();
  const nowIso = new Date(now).toISOString();
  const soonIso = new Date(now + 7 * 86400000).toISOString();
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || MEMBERS_PAGE_SIZE);
  const from = (safePage - 1) * safeSize;
  // Fetch one extra row to detect whether a next page exists.
  const to = from + safeSize;

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

  // Filtered list (server-side filters + range pagination).
  let q = supabase
    .from("members")
    .select("id,full_name,email,phone,lead_status,source,created_at")
    .order("created_at", { ascending: false });
  if (status && status.trim()) q = q.eq("lead_status", status.trim());
  if (search && search.trim()) {
    const s = search.trim().replace(/[%,()]/g, " ");
    q = q.or(`full_name.ilike.%${s}%,phone.ilike.%${s}%,email.ilike.%${s}%`);
  }
  q = q.range(from, to); // fetch safeSize + 1 to detect a next page
  const { data: members } = await q;
  const fetched = members ?? [];
  const hasMore = fetched.length > safeSize;
  const list = hasMore ? fetched.slice(0, safeSize) : fetched;
  const ids = list.map((m) => m.id);

  const [memberships, lastSeenRows, balanceMap] = await Promise.all([
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
    creditBalancesByMember(supabase, ids),
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

  const rows: MemberListRow[] = list.map((m) => {
    const mm = mmById.get(m.id);
    return {
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      phone: m.phone,
      lead_status: m.lead_status,
      source: m.source,
      credits: balanceMap.get(m.id) ?? 0,
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
    page: safePage,
    pageSize: safeSize,
    hasMore,
  };
}

export interface MemberExportRow {
  full_name: string;
  phone: string | null;
  email: string | null;
  lead_status: string | null;
  source: string | null;
  membership_status: string;
  credits: number;
  created_at: string;
}

export async function getMembersForExport(): Promise<MemberExportRow[]> {
  const supabase = await getServerSupabase();
  const { data: members } = await supabase
    .from("members")
    .select("id,full_name,phone,email,lead_status,source,created_at")
    .order("created_at", { ascending: false });
  const list = members ?? [];
  const ids = list.map((m) => m.id);
  const [memberships, balanceMap] = await Promise.all([
    ids.length
      ? supabase.from("member_memberships").select("member_id,status,current_period_end").in("member_id", ids)
      : Promise.resolve({ data: [] as { member_id: string; status: string; current_period_end: string | null }[] }),
    creditBalancesByMember(supabase, ids),
  ]);
  const now = Date.now();
  const byMember = new Map<string, { active: boolean; any: boolean }>();
  for (const mm of memberships.data ?? []) {
    const cur = byMember.get(mm.member_id) ?? { active: false, any: false };
    cur.any = true;
    if (mm.status === "active" && mm.current_period_end && new Date(mm.current_period_end).getTime() > now) cur.active = true;
    byMember.set(mm.member_id, cur);
  }
  return list.map((m) => {
    const ms = byMember.get(m.id);
    return {
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
      lead_status: m.lead_status,
      source: m.source,
      membership_status: ms?.active ? "active" : ms?.any ? "expired" : "none",
      credits: balanceMap.get(m.id) ?? 0,
      created_at: m.created_at,
    };
  });
}

export interface MemberTask {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  member_id?: string;
  member_name?: string;
}

/** member_tasks is a new table not yet in the generated Database types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tasksTable(supabase: ServerSupabase): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from("member_tasks");
}

export async function getMemberTasks(memberId: string): Promise<MemberTask[]> {
  const supabase = await getServerSupabase();
  const { data } = await tasksTable(supabase)
    .select("id,title,due_date,status")
    .eq("member_id", memberId)
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false });
  return (data ?? []) as MemberTask[];
}

export async function getOverdueTasks(): Promise<MemberTask[]> {
  const supabase = await getServerSupabase();
  const today = todayInRiyadh();
  const { data } = await tasksTable(supabase)
    .select("id,title,due_date,status,member_id,members(full_name)")
    .eq("status", "open")
    .not("due_date", "is", null)
    .lte("due_date", today)
    .order("due_date", { ascending: true })
    .limit(20);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((t) => ({
    id: t.id,
    title: t.title,
    due_date: t.due_date,
    status: t.status,
    member_id: t.member_id,
    member_name: t.members?.full_name ?? "—",
  }));
}
