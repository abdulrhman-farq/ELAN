import { NextResponse } from "next/server";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { getMembersForExport } from "@/lib/admin";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

  const rows = await getMembersForExport();
  const header = ["Name", "Phone", "Email", "Status", "Source", "Membership", "Credits", "Created"];
  const body = rows.map((r) => [
    r.full_name,
    r.phone ?? "",
    r.email ?? "",
    r.lead_status ?? "",
    r.source ?? "",
    r.membership_status,
    String(r.credits),
    r.created_at.slice(0, 10),
  ]);
  // Prepend BOM so Excel reads UTF-8 (Arabic) correctly.
  const csv = "﻿" + [header, ...body].map((line) => line.map(cell).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="elan-members.csv"',
    },
  });
}
