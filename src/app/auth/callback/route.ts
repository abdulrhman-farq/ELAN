import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Magic-link / OTP callback: exchange the code for a session cookie, then home. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await getServerSupabase();
    await supabase.auth.exchangeCodeForSession(code);
    // Link this auth user to the admin-created member row (matched by email) so
    // the self booking RPCs (auth_user_id = auth.uid()) resolve her member.
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
  }
  return NextResponse.redirect(new URL("/", url.origin));
}
