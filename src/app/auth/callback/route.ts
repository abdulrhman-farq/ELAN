import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

/** Magic-link / OTP callback: exchange the code for a session and persist the
 *  session cookies ON the redirect response, then link the member by email. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const res = NextResponse.redirect(new URL("/", url.origin));
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
  if (error) return NextResponse.redirect(new URL(`/login?error=link`, url.origin));

  // Link this auth user to the admin-created member row (matched by email) so the
  // self booking RPCs (auth_user_id = auth.uid()) resolve her member.
  const { data: auth } = await supabase.auth.getUser();
  if (auth.user?.email) {
    await (supabase.from("members") as unknown as {
      update: (v: Record<string, unknown>) => {
        ilike: (c: string, p: string) => { is: (c: string, v: null) => Promise<unknown> };
      };
    })
      .update({ auth_user_id: auth.user.id })
      .ilike("email", auth.user.email)
      .is("auth_user_id", null);
  }
  return res;
}
