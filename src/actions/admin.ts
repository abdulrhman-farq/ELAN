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
