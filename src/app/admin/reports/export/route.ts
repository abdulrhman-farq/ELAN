import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase, rpc } from "@/lib/supabase/server";
import { getReports } from "@/lib/admin";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const sar = (h: number) => (h / 100).toFixed(2);

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

  const sp = req.nextUrl.searchParams;
  const from = sp.get("from") ?? undefined;
  const to = sp.get("to") ?? undefined;
  const days = Number.parseInt(sp.get("days") ?? "30", 10) || 30;
  const r = await (from || to ? getReports({ from, to }) : getReports({ days }));

  const lines: string[][] = [];
  lines.push(["ELAN report", `${r.rangeStart.slice(0, 10)} → ${r.rangeEnd.slice(0, 10)}`]);
  lines.push([]);
  lines.push(["Totals (SAR)"]);
  lines.push(["Gross (incl VAT)", sar(r.grossHalalas)]);
  lines.push(["Net", sar(r.netHalalas)]);
  lines.push(["VAT", sar(r.vatHalalas)]);
  lines.push(["Discounts", sar(r.discountsHalalas)]);
  lines.push(["Payments count", String(r.paymentsCount)]);
  lines.push([]);
  lines.push(["Revenue by type", "SAR"]);
  for (const [k, v] of Object.entries(r.revenueByType)) lines.push([k, sar(v)]);
  lines.push([]);
  lines.push(["Bookings by status", "count"]);
  for (const [k, v] of Object.entries(r.bookingsByStatus)) lines.push([k, String(v)]);
  lines.push([]);
  lines.push(["By trainer", "bookings", "attended", "value SAR"]);
  for (const t of r.byTrainer) lines.push([t.name_en || t.name_ar, String(t.bookings), String(t.attended), sar(t.valueHalalas)]);
  lines.push([]);
  lines.push(["By class type", "bookings", "attended", "value SAR"]);
  for (const t of r.byClassType) lines.push([t.name_en || t.name_ar, String(t.bookings), String(t.attended), sar(t.valueHalalas)]);

  const csv = "﻿" + lines.map((line) => line.map(cell).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elan-report-${r.rangeStart.slice(0, 10)}_${r.rangeEnd.slice(0, 10)}.csv"`,
    },
  });
}
