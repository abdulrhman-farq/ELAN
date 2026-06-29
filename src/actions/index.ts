"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";
import { DEMO } from "@/lib/demo";

/** True when a real subscriber (auth_user_id linked) is signed in. */
async function isRealMember(supabase: Awaited<ReturnType<typeof getServerSupabase>>): Promise<boolean> {
  const { data } = await rpc<string>(supabase, "current_member_id");
  return Boolean(data);
}

export async function bookAction(classInstanceId: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/bookings");
    return { ok: true as const, bookingId: "mock-bk-new" };
  }
  const { data, error } = await rpc<{ id: string }>(supabase, "book_class_self", { p_class_instance_id: classInstanceId, p_source: "web" });
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath(`/class/${classInstanceId}`);
  revalidatePath("/bookings");
  if (error) {
    const code = /SUSPENDED/i.test(error.message) ? "suspended" : error.message;
    return { error: code };
  }
  return { ok: true as const, bookingId: data?.id ?? null };
}

/** Bring a guest to a class. The host pays 1 credit; guests take a real seat
 *  and are never covered by a membership (#guest-passes). */
export async function bookGuestAction(classInstanceId: string, guestName: string, guestPhone?: string) {
  const name = guestName?.trim();
  if (!name) return { error: "GUEST_NAME_REQUIRED" };
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath(`/class/${classInstanceId}`); revalidatePath("/bookings");
    return { ok: true as const, bookingId: "mock-guest-new" };
  }
  const { data, error } = await rpc<{ id: string }>(supabase, "book_guest_self", {
    p_class_instance_id: classInstanceId, p_guest_name: name, p_guest_phone: guestPhone?.trim() || null, p_source: "web",
  });
  revalidatePath(`/class/${classInstanceId}`);
  revalidatePath("/schedule");
  revalidatePath("/bookings");
  return error ? { error: error.message } : { ok: true as const, bookingId: data?.id ?? null };
}

/** Register the current member for a workshop (الورش). Reserves a seat; payment
 *  is settled at the desk. */
export async function registerWorkshopAction(workshopId: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/workshops");
    return { ok: true as const };
  }
  const { error } = await rpc(supabase, "register_workshop", { p_workshop: workshopId });
  revalidatePath("/workshops");
  return error ? { error: error.message } : { ok: true as const };
}

/** Cancel the current member's workshop registration. */
export async function cancelWorkshopRegistrationAction(registrationId: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/workshops");
    return { ok: true as const };
  }
  const { error } = await rpc(supabase, "cancel_workshop_registration", { p_registration: registrationId });
  revalidatePath("/workshops");
  return error ? { error: error.message } : { ok: true as const };
}

/** Mark the member's in-app notifications as read (clears the unread badge). */
export async function markNotificationsReadAction() {
  const supabase = await getServerSupabase();
  const { error } = await rpc(supabase, "mark_my_notifications_read");
  revalidatePath("/profile");
  revalidatePath("/");
  return error ? { error: error.message } : { ok: true as const };
}

/** Watch a full class to be notified when a seat opens (#19). */
export async function watchClassAction(classInstanceId: string) {
  const supabase = await getServerSupabase();
  const { error } = await rpc(supabase, "watch_class_self", { p_class_instance_id: classInstanceId });
  revalidatePath(`/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true as const };
}

export async function unwatchClassAction(classInstanceId: string) {
  const supabase = await getServerSupabase();
  const { error } = await rpc(supabase, "unwatch_class_self", { p_class_instance_id: classInstanceId });
  revalidatePath(`/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true as const };
}

export async function cancelAction(bookingId: string, classInstanceId?: string) {
  const supabase = await getServerSupabase();
  if (DEMO && !(await isRealMember(supabase))) {
    revalidatePath("/"); revalidatePath("/schedule"); revalidatePath("/bookings");
    if (classInstanceId) revalidatePath(`/class/${classInstanceId}`);
    return { ok: true };
  }
  const { error } = await rpc(supabase, "cancel_booking_self", { p_booking_id: bookingId });
  revalidatePath("/");
  revalidatePath("/schedule");
  revalidatePath("/bookings");
  if (classInstanceId) revalidatePath(`/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}

export async function purchaseAction(type: "membership" | "credit_pack", refId: string) {
  if (DEMO) {
    revalidatePath("/memberships"); revalidatePath("/profile");
    return { ok: true as const, pending: true as const };
  }
  const supabase = await getServerSupabase();
  // Create a PENDING payment only. Credits / membership are NEVER granted at
  // purchase time — they are applied exclusively after the payment is confirmed
  // (by an admin, or a signed payment-gateway webhook) via confirm_payment.
  const { error } = await rpc(supabase, "create_pending_purchase", { p_type: type, p_ref_id: refId });
  revalidatePath("/memberships");
  revalidatePath("/profile");
  return error ? { error: error.message } : { ok: true as const, pending: true as const };
}

export async function setLocaleAction(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function signOutAction() {
  if (DEMO) redirect("/login");
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
