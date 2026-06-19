/**
 * Supabase connection config. Reads from env when provided; otherwise falls
 * back to the public ELAN demo project so the app works online with zero
 * configuration. The anon key is public and safe to ship — Row Level Security
 * enforces all access. Swap the env vars to point at your own project.
 */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://knldyssbwygrkxamttez.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGR5c3Nid3lncmt4YW10dGV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTg4MjIsImV4cCI6MjA5NzQzNDgyMn0.0Ol4bTSVAevhFNGmII13bAKKtdztnO_F4wd62ZzOnK8";
