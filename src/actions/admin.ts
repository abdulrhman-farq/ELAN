"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, rpc } from "@/lib/supabase/server";

type Result = { ok: true } | { error: string };

/** Ensure there is a signed-in user. Authorization (admin OR the owning
 *  instructor) is enforced INSIDE the SECURITY DEFINER RPCs, so the action only
 *  needs to confirm a session exists. */
async function ensureAuthed() {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  return { supabase, ok: Boolean(auth.user) };
}

function revalidateRoster(classInstanceId: string) {
  revalidatePath(`/admin/class/${classInstanceId}`);
  revalidatePath(`/trainer/class/${classInstanceId}`);
}

/** Mark a confirmed booking as a no-show. RPC authorizes admin or owning instructor. */
export async function markNoShowAction(bookingId: string, classInstanceId: string): Promise<Result> {
  const { supabase, ok } = await ensureAuthed();
  if (!ok) return { error: "غير مصرّح" };
  const { error } = await rpc(supabase, "mark_no_show", { p_booking_id: bookingId });
  revalidateRoster(classInstanceId);
  return error ? { error: error.message } : { ok: true };
}

/** Mark a booking as attended. RPC authorizes admin or owning instructor. */
export async function markAttendedAction(bookingId: string, classInstanceId: string): Promise<Result> {
  const { supabase, ok } = await ensureAuthed();
  if (!ok) return { error: "غير مصرّح" };
  const { error } = await rpc(supabase, "mark_attended", { p_booking_id: bookingId });
  revalidateRoster(classInstanceId);
  return error ? { error: error.message } : { ok: true };
}

/** Quick check-in by the member's personal code. Returns her name on success. */
export async function checkinByCodeAction(
  classInstanceId: string,
  code: string,
): Promise<{ ok: true; name: string } | { error: string }> {
  const { supabase, ok } = await ensureAuthed();
  if (!ok) return { error: "unauthorized" };
  if (!code?.trim()) return { error: "empty" };
  const { data, error } = await rpc<string>(supabase, "checkin_by_code", {
    p_class_instance_id: classInstanceId,
    p_code: code.trim(),
  });
  if (error) {
    const m = error.message || "";
    const code2 = /BAD_CODE/.test(m) ? "bad_code" : /NO_BOOKING/.test(m) ? "no_booking" : /NOT_CONFIRMED/.test(m) ? "not_confirmed" : /FORBIDDEN/.test(m) ? "forbidden" : "failed";
    return { error: code2 };
  }
  revalidateRoster(classInstanceId);
  return { ok: true, name: data ?? "" };
}
