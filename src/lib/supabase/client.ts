import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/** Browser Supabase client (used by client components, e.g. login). */
export function getBrowserSupabase() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
