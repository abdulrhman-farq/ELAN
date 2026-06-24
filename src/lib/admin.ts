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
  recommendedClass: string | null;
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
  const { data: member } = await anyFrom(supabase, "members")
    .select("id,full_name,phone,email,level,locale,created_at,lead_status,source,recommended_class")
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
    recommendedClass: (member as { recommended_class: string | null }).recommended_class ?? null,
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
  // Cash sales (from payments, last 30 days) — halalas
  grossHalalas: number;
  netHalalas: number;
  vatHalalas: number;
  discountsHalalas: number;
  paymentsCount: number;
  revenueByType: Record<string, number>; // gross halalas per payment type
  // Booking-derived value (last 30 days, by list value) — halalas
  compValueHalalas: number;
  packageUtilHalalas: number;
  unlimitedUtilHalalas: number;
  noShowLostHalalas: number;
  cancellationValueHalalas: number;
  bookingsByStatus: Record<string, number>;
}

export async function getReports(): Promise<AdminReports> {
  const supabase = await getServerSupabase();
  const { start } = lastDaysIso(30);

  const [{ data: pays }, { data: books }] = await Promise.all([
    anyFrom(supabase, "payments")
      .select("type,amount_sar,gross_halalas,net_halalas,vat_amount_halalas,discount_amount_halalas")
      .eq("status", "paid")
      .gte("created_at", start),
    anyFrom(supabase, "bookings").select("status,pricing_source,list_value_halalas").gte("created_at", start),
  ]);

  let grossHalalas = 0,
    netHalalas = 0,
    vatHalalas = 0,
    discountsHalalas = 0;
  const revenueByType: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const p of (pays ?? []) as any[]) {
    const g = p.gross_halalas ?? Math.round(Number(p.amount_sar || 0) * 100);
    grossHalalas += g;
    netHalalas += p.net_halalas ?? 0;
    vatHalalas += p.vat_amount_halalas ?? 0;
    discountsHalalas += p.discount_amount_halalas ?? 0;
    revenueByType[p.type] = (revenueByType[p.type] ?? 0) + g;
  }

  let compValueHalalas = 0,
    packageUtilHalalas = 0,
    unlimitedUtilHalalas = 0,
    noShowLostHalalas = 0,
    cancellationValueHalalas = 0;
  const bookingsByStatus: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const b of (books ?? []) as any[]) {
    const lv = b.list_value_halalas ?? 0;
    bookingsByStatus[b.status] = (bookingsByStatus[b.status] ?? 0) + 1;
    if (b.pricing_source === "complimentary") compValueHalalas += lv;
    if (b.pricing_source === "package_credit") packageUtilHalalas += lv;
    if (b.pricing_source === "unlimited_membership") unlimitedUtilHalalas += lv;
    if (b.status === "no_show") noShowLostHalalas += lv;
    if (b.status === "cancelled" || b.status === "late_cancelled") cancellationValueHalalas += lv;
  }

  return {
    grossHalalas,
    netHalalas,
    vatHalalas,
    discountsHalalas,
    paymentsCount: (pays ?? []).length,
    revenueByType,
    compValueHalalas,
    packageUtilHalalas,
    unlimitedUtilHalalas,
    noShowLostHalalas,
    cancellationValueHalalas,
    bookingsByStatus,
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
}

export async function getDashboard(): Promise<DashboardData> {
  const supabase = await getServerSupabase();
  const today = dayBoundsUtc(todayInRiyadh());
  const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();
  const d = new Date();
  const monthStartIso = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();

  const { data: classes } = await supabase
    .from("class_instances")
    .select("id,starts_at,capacity,class_types(name_ar,name_en),instructors(name_ar,name_en)")
    .gte("starts_at", today.start)
    .lt("starts_at", today.end)
    .eq("status", "scheduled")
    .order("starts_at", { ascending: true });
  const cls = classes ?? [];
  const ids = cls.map((c) => c.id);

  const [{ data: avail }, { data: wl }, { count: newMembersWeek }, { data: pays }, { count: newBookingsToday }] = await Promise.all([
    ids.length
      ? supabase.from("class_instance_availability").select("class_instance_id,confirmed_count").in("class_instance_id", ids)
      : Promise.resolve({ data: [] as { class_instance_id: string; confirmed_count: number | null }[] }),
    ids.length
      ? supabase
          .from("bookings")
          .select("id,members(full_name),class_instances(starts_at,class_types(name_ar,name_en))")
          .eq("status", "waitlisted")
          .in("class_instance_id", ids)
      : Promise.resolve({ data: [] as { members: { full_name: string } | null; class_instances: { starts_at: string; class_types: { name_ar: string; name_en: string } | null } | null }[] }),
    supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", weekAgoIso),
    supabase.from("payments").select("amount_sar").eq("status", "paid").gte("created_at", monthStartIso),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("created_at", today.start)
      .lt("created_at", today.end),
  ]);

  const conf = new Map((avail ?? []).map((a) => [a.class_instance_id, a.confirmed_count ?? 0]));
  const booked = cls.reduce((s, c) => s + (conf.get(c.id) ?? 0), 0);
  const cap = cls.reduce((s, c) => s + c.capacity, 0);

  let topClass: { name_en: string; pct: number } | null = null;
  for (const c of cls) {
    const pct = c.capacity ? Math.round(((conf.get(c.id) ?? 0) / c.capacity) * 100) : 0;
    if (!topClass || pct > topClass.pct) topClass = { name_en: c.class_types?.name_en ?? "", pct };
  }

  return {
    bookingsToday: booked,
    fillRate: cap ? Math.round((booked / cap) * 100) : null,
    newMembersWeek: newMembersWeek ?? 0,
    revenueMonth: (pays ?? []).reduce((s, p) => s + Number(p.amount_sar), 0),
    today: cls.map((c) => {
      const b = conf.get(c.id) ?? 0;
      return {
        id: c.id,
        starts_at: c.starts_at,
        name_ar: c.class_types?.name_ar ?? "",
        name_en: c.class_types?.name_en ?? "",
        instructor_ar: c.instructors?.name_ar ?? null,
        instructor_en: c.instructors?.name_en ?? null,
        booked: b,
        capacity: c.capacity,
        open: b < c.capacity,
      };
    }),
    waitlist: (wl ?? []).map((w) => ({
      name: w.members?.full_name ?? "—",
      class_ar: w.class_instances?.class_types?.name_ar ?? "",
      class_en: w.class_instances?.class_types?.name_en ?? "",
      starts_at: w.class_instances?.starts_at ?? "",
    })),
    topClass,
    newBookingsToday: newBookingsToday ?? 0,
  };
}

export interface TrainerRow {
  id: string;
  name_ar: string;
  name_en: string;
  bio_ar: string | null;
  bio_en: string | null;
  classesThisWeek: number;
}

export async function getInstructors(): Promise<TrainerRow[]> {
  const supabase = await getServerSupabase();
  const week = nextDaysIso(7);
  const [{ data: trainers }, { data: cls }] = await Promise.all([
    supabase.from("instructors").select("id,name_ar,name_en,bio_ar,bio_en").eq("active", true).order("name_en"),
    supabase.from("class_instances").select("instructor_id").gte("starts_at", week.start).lt("starts_at", week.end).eq("status", "scheduled"),
  ]);
  const counts = new Map<string, number>();
  for (const c of cls ?? []) if (c.instructor_id) counts.set(c.instructor_id, (counts.get(c.instructor_id) ?? 0) + 1);
  return (trainers ?? []).map((t) => ({
    id: t.id,
    name_ar: t.name_ar,
    name_en: t.name_en,
    bio_ar: t.bio_ar,
    bio_en: t.bio_en,
    classesThisWeek: counts.get(t.id) ?? 0,
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
    .select("id,full_name,email,phone,lead_status,source,created_at")
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
      source: m.source,
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
  const [memberships, balances] = await Promise.all([
    ids.length
      ? supabase.from("member_memberships").select("member_id,status,current_period_end").in("member_id", ids)
      : Promise.resolve({ data: [] as { member_id: string; status: string; current_period_end: string | null }[] }),
    Promise.all(list.map((m) => rpc<number>(supabase, "elan_credit_balance", { p_member: m.id }).then((r) => r.data ?? 0))),
  ]);
  const now = Date.now();
  const byMember = new Map<string, { active: boolean; any: boolean }>();
  for (const mm of memberships.data ?? []) {
    const cur = byMember.get(mm.member_id) ?? { active: false, any: false };
    cur.any = true;
    if (mm.status === "active" && mm.current_period_end && new Date(mm.current_period_end).getTime() > now) cur.active = true;
    byMember.set(mm.member_id, cur);
  }
  return list.map((m, i) => {
    const ms = byMember.get(m.id);
    return {
      full_name: m.full_name,
      phone: m.phone,
      email: m.email,
      lead_status: m.lead_status,
      source: m.source,
      membership_status: ms?.active ? "active" : ms?.any ? "expired" : "none",
      credits: balances[i] ?? 0,
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
