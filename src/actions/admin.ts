"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, rpc } from "@/lib/supabase/server";

type Result = { ok: true } | { error: string };

async function ensureAdmin() {
  const supabase = await getServerSupabase();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { supabase, ok: false as const };
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  return { supabase, ok: Boolean(isAdmin) };
}

/** Mark a confirmed booking as a no-show (SECURITY DEFINER RPC, admin-gated server-side). */
export async function markNoShowAction(bookingId: string, classInstanceId: string): Promise<Result> {
  const { supabase, ok } = await ensureAdmin();
  if (!ok) return { error: "غير مصرّح" };
  const { error } = await rpc(supabase, "mark_no_show", { p_booking_id: bookingId });
  revalidatePath(`/admin/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}

/** Mark a confirmed booking as attended. Falls back to a direct update; RLS governs access. */
export async function markAttendedAction(bookingId: string, classInstanceId: string): Promise<Result> {
  const { supabase, ok } = await ensureAdmin();
  if (!ok) return { error: "غير مصرّح" };
  const { error } = await supabase.from("bookings").update({ status: "attended" }).eq("id", bookingId);
  revalidatePath(`/admin/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}
