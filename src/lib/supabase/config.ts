/**
 * Supabase connection config.
 *
 * Production MUST be explicitly configured: if the env vars are missing in a
 * production build the module throws at load time (fail-fast) so a misconfigured
 * deploy never silently falls back to the shared demo project. In development /
 * test we fall back to the public ELAN demo project so the app runs with zero
 * configuration. The anon key is public and safe to ship — Row Level Security
 * enforces all access.
 */
const DEMO_URL = "https://knldyssbwygrkxamttez.supabase.co";
const DEMO_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGR5c3Nid3lncmt4YW10dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTg4MjIsImV4cCI6MjA5NzQzNDgyMn0.0Ol4bTSVAevhFNGmII13bAKKtdztnO_F4wd62ZzOnK8";

const isProd = process.env.NODE_ENV === "production";
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (isProd && (!envUrl || !envKey)) {
  throw new Error(
    "[config] Production requires NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY. Refusing to fall back to the demo project.",
  );
}

// `|| ` (not `??`) so an empty-string env also falls back in dev/test.
export const SUPABASE_URL = envUrl || DEMO_URL;
export const SUPABASE_ANON_KEY = envKey || DEMO_ANON_KEY;
