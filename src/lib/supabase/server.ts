import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

type RpcResult<T> = { data: T | null; error: { message: string } | null };

/**
 * Calls a Postgres RPC. The SSR client's rpc arg typing is over-narrow for our
 * SECURITY DEFINER wrappers; argument types are enforced by Postgres itself, so
 * we cast at this single boundary rather than scattering casts through the app.
 */
type ServerClient = Awaited<ReturnType<typeof getServerSupabase>>;

export async function rpc<T = unknown>(
  supabase: ServerClient,
  fn: string,
  args?: Record<string, unknown>,
): Promise<RpcResult<T>> {
  const call = supabase.rpc as unknown as (
    f: string,
    a?: Record<string, unknown>,
  ) => PromiseLike<unknown>;
  return (await call(fn, args)) as RpcResult<T>;
}

/** Cookie-bound Supabase client for Server Components and Server Actions. */
export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component (read-only cookies) — safe to ignore.
          }
        },
      },
    },
  );
}
