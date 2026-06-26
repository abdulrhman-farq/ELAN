import "server-only";
import { getServerSupabase, rpc } from "./supabase/server";
import { dayBoundsUtc, todayInRiyadh } from "./format";

type ServerSupabase = Awaited<ReturnType<typeof getServerSupabase>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyFrom(supabase: ServerSupabase, name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as unknown as { from: (t: string) => any }).from(name);
}

/** ISO bounds from the start of today (Riyadh) for the next N days. */
function nextDaysIso(days: number) {
  const { start } = dayBoundsUtc(todayInRiyadh());
  const end = new Date(new Date(start).getTime() + days * 86400000).toISOString();
  return { start, end };
}

export interface TrainerContext {
  instructorId: string | null;
  isAdmin: boolean;
  name_ar: string | null;
  name_en: string | null;
}

/** Resolve the signed-in trainer's instructor identity (by auth_user_id, never email). */
export async function getTrainerContext(): Promise<TrainerContext> {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { instructorId: null, isAdmin: false, name_ar: null, name_en: null };
  const [{ data: instructorId }, { data: isAdmin }] = await Promise.all([
    rpc<string>(supabase, "current_instructor_id"),
    rpc<boolean>(supabase, "is_admin"),
  ]);
  let name_ar: string | null = null;
  let name_en: string | null = null;
  if (instructorId) {
    const { data } = await anyFrom(supabase, "instructors").select("name_ar,name_en").eq("id", instructorId).maybeSingle();
    name_ar = data?.name_ar ?? null;
    name_en = data?.name_en ?? null;
  }
  return { instructorId: instructorId ?? null, isAdmin: Boolean(isAdmin), name_ar, name_en };
}

export interface TrainerClassRow {
  id: string;
  starts_at: string;
  ends_at: string;
  name_ar: string;
  name_en: string;
  capacity: number;
  status: "scheduled" | "cancelled";
  confirmed: number;
  waitlist: number;
}

/** The trainer's own upcoming classes for the next `days`, with live occupancy. */
export async function getTrainerSchedule(instructorId: string, days = 14): Promise<TrainerClassRow[]> {
  const supabase = await getServerSupabase();
  const { start, end } = nextDaysIso(days);
  const { data: classes, error } = await anyFrom(supabase, "class_instances")
    .select("id,starts_at,ends_at,capacity,status,class_type_id")
    .eq("instructor_id", instructorId)
    .gte("starts_at", start)
    .lt("starts_at", end)
    .order("starts_at", { ascending: true });
  if (error) { console.error("[trainer] schedule error", error.message ?? error); return []; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list = (classes ?? []) as any[];
  if (list.length === 0) return [];

  const ids = list.map((c) => c.id);
  const typeIds = [...new Set(list.map((c) => c.class_type_id).filter(Boolean))];
  const [availR, typesR] = await Promise.all([
    anyFrom(supabase, "class_instance_availability").select("class_instance_id,confirmed_count,waitlist_count").in("class_instance_id", ids),
    typeIds.length ? anyFrom(supabase, "class_types").select("id,name_ar,name_en").in("id", typeIds) : Promise.resolve({ data: [] }),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const am = new Map((availR.data ?? []).map((a: any) => [a.class_instance_id, a]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tm = new Map((typesR.data ?? []).map((t: any) => [t.id, t]));

  return list.map((c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = am.get(c.id) as any; const ct = tm.get(c.class_type_id) as any;
    return {
      id: c.id,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      name_ar: ct?.name_ar ?? "",
      name_en: ct?.name_en ?? "",
      capacity: c.capacity,
      status: c.status,
      confirmed: a?.confirmed_count ?? 0,
      waitlist: a?.waitlist_count ?? 0,
    };
  });
}

/** Does this class belong to the given instructor? (used to gate the roster page) */
export async function classBelongsToInstructor(classId: string, instructorId: string): Promise<boolean> {
  const supabase = await getServerSupabase();
  const { data } = await anyFrom(supabase, "class_instances").select("instructor_id").eq("id", classId).maybeSingle();
  return data?.instructor_id === instructorId;
}
