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
