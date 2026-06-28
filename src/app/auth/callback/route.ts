import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Magic-link / OTP callback: exchange the code for a session and persist the
 *  session cookies ON the redirect response. The member row is linked to the
 *  auth user by the SECURITY DEFINER handle_new_user trigger (by verified email)
 *  at signup — no email-based linking happens here. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const base = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const code = url.searchParams.get("code");
  const res = NextResponse.redirect(new URL("/", base));
  if (!code) return res;

  const cookieStore = await cookies();
  const supabase = createServerClient<unknown>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      // Write the refreshed session cookies onto the redirect response so the
      // session actually persists (a bare NextResponse.redirect would drop them).
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL(`/login?error=link`, base));
  return res;
}
