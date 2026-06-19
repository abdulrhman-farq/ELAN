"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

export async function bookAction(classInstanceId: string) {
  const supabase = await getServerSupabase();
  const { error } = await rpc(supabase, "book_class_self", { p_class_instance_id: classInstanceId, p_source: "web" });
  revalidatePath("/");
  revalidatePath(`/class/${classInstanceId}`);
  revalidatePath("/bookings");
  return error ? { error: error.message } : { ok: true };
}

export async function cancelAction(bookingId: string, classInstanceId?: string) {
  const supabase = await getServerSupabase();
  const { error } = await rpc(supabase, "cancel_booking_self", { p_booking_id: bookingId });
  revalidatePath("/");
  revalidatePath("/bookings");
  if (classInstanceId) revalidatePath(`/class/${classInstanceId}`);
  return error ? { error: error.message } : { ok: true };
}

export async function purchaseAction(type: "membership" | "credit_pack", refId: string) {
  const supabase = await getServerSupabase();
  // Mock checkout: the PaymentProvider would redirect to Moyasar in production;
  // here we fulfill instantly via the sandbox RPC.
  const { error } = await rpc(supabase, "simulate_purchase", { p_type: type, p_ref_id: refId });
  revalidatePath("/memberships");
  revalidatePath("/profile");
  return error ? { error: error.message } : { ok: true };
}

export async function setLocaleAction(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function signOutAction() {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
