import "server-only";
import { redirect } from "next/navigation";
import { getServerSupabase, rpc } from "@/lib/supabase/server";

/** Guard for admin-only pages (finances, promo, settings, audit, roles, health).
 *  Managers reach the console but must not open these — bounce them to the
 *  dashboard. Returns the server client for convenience. */
export async function requireAdmin() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) redirect("/admin");
  return supabase;
}

/** Non-redirecting check — for hiding finance UI from managers. */
export async function getIsAdmin(): Promise<boolean> {
  const supabase = await getServerSupabase();
  const { data } = await rpc<boolean>(supabase, "is_admin");
  return Boolean(data);
}
