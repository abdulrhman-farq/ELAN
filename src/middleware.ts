import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";

/**
 * Edge middleware: refreshes the Supabase session cookie on every request and
 * provides defense-in-depth route gating. RLS remains the real authorization
 * backstop — this only avoids serving protected shells to anonymous users and
 * keeps the session token fresh so Server Components don't see an expired token.
 *
 * Demo mode (NEXT_PUBLIC_ELAN_DEMO, dev/test only) skips the auth redirect so
 * the showcase remains browsable; it is force-disabled in production by design.
 */
const PROTECTED_PREFIXES = ["/bookings", "/memberships", "/profile", "/confirmation", "/class", "/schedule", "/admin", "/trainer"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (toSet) => toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
    },
  });

  // Refreshes the session and writes rotated cookies onto `res`.
  const { data: { user } } = await supabase.auth.getUser();

  const demo = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_ELAN_DEMO === "true";
  if (!user && !demo && isProtected(req.nextUrl.pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

/** Run on app routes only — skip static assets, image optimizer, and API routes
 *  (the payment webhook must receive its raw body untouched). */
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
