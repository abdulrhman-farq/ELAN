import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Liveness probe for uptime monitors. Reports config presence WITHOUT leaking
// secret values (booleans only). Always 200 so the process is observed as up.
export async function GET() {
  return NextResponse.json({
    status: "ok",
    time: new Date().toISOString(),
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    sentryConfigured: Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
    cronConfigured: Boolean(process.env.CRON_SECRET),
  });
}
