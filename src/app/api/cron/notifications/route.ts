/**
 * Notification delivery worker (cron-driven).
 *
 * Queued rows in the `notifications` table (status='pending') are drained here
 * and dispatched via the provider-agnostic message provider. Vercel Cron hits
 * this route on a schedule (see vercel.json) using a GET request.
 *
 * SECURITY / TRUST MODEL
 * - The request is authenticated by a shared secret: Vercel Cron sends
 *   `authorization: Bearer <CRON_SECRET>`. We compare against process.env.CRON_SECRET.
 *   Missing secret -> 503 (not configured). Mismatch -> 401 (unauthorized).
 * - Delivery runs under a SERVICE-ROLE Supabase client created here from the
 *   service-role key (server-only; bypasses RLS). The key is read from
 *   process.env and never logged.
 * - The client is intentionally UNTYPED: migration 0021 added the
 *   attempts/last_error/updated_at columns which are not in the generated
 *   Database types yet, so we avoid the Database generic to dodge type errors.
 *
 * REQUIRED ENV VARS
 * - CRON_SECRET               shared secret used to authenticate the cron caller
 * - SUPABASE_SERVICE_ROLE_KEY server-only Supabase service-role key
 * - NEXT_PUBLIC_SUPABASE_URL  (or SUPABASE_URL) project URL
 *
 * ⚠️ PENDING STAGING VALIDATION — requires CRON_SECRET + SUPABASE_SERVICE_ROLE_KEY
 * and migration 0021 (attempts/last_error/updated_at columns). Inert (503)
 * without keys.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMessageProvider } from "@/lib/providers";

// Must run on the Node.js runtime and never cache.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PendingNotification {
  id: string;
  member_id: string | null;
  channel: string | null;
  template: string | null;
  payload: Record<string, unknown> | null;
  attempts: number | null;
}

export async function GET(req: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;

  // Inert without the cron secret: not configured -> 503, process nothing.
  if (!cronSecret) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  // Authenticate the cron caller via the shared bearer secret.
  if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Inert without Supabase keys.
  if (!serviceKey || !url) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  // UNTYPED service-role client (see header: migration 0021 columns absent from types).
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from("notifications")
    .select("id,member_id,channel,template,payload,attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as PendingNotification[];
  const provider = getMessageProvider();

  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const nowIso = new Date().toISOString();

    if (row.channel === "in_app") {
      // In-app notifications need no external send; mark delivered.
      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: nowIso, updated_at: nowIso })
        .eq("id", row.id);
      sent++;
      continue;
    }

    // External channels (whatsapp / sms / …): look up the recipient and send.
    try {
      const { data: member } = await supabase
        .from("members")
        .select("phone,locale")
        .eq("id", row.member_id)
        .maybeSingle();

      const m = member as { phone: string | null; locale: string | null } | null;

      await provider.send({
        to: m?.phone ?? "",
        template: row.template ?? "",
        locale: m?.locale ?? "ar",
        vars: row.payload ?? {},
      });

      await supabase
        .from("notifications")
        .update({ status: "sent", sent_at: nowIso, updated_at: nowIso })
        .eq("id", row.id);
      sent++;
    } catch (err) {
      await supabase
        .from("notifications")
        .update({
          status: "failed",
          last_error: String(err).slice(0, 500),
          attempts: (row.attempts ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, processed: rows.length, sent, failed }, { status: 200 });
}
