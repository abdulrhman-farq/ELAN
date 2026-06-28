import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase, rpc } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function anyFrom(supabase: any, name: string) {
  return supabase.from(name);
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const head = cols.join(",");
  const body = rows.map((r) => cols.map((c) => cell(r[c])).join(",")).join("\n");
  return `${head}\n${body}`;
}

// Datasets an admin can export. Each maps to a table + the columns to include.
const DATASETS: Record<string, { table: string; cols: string }> = {
  members: { table: "members", cols: "id,full_name,phone,email,level,role,lead_status,source,created_at" },
  bookings: { table: "bookings", cols: "id,member_id,class_instance_id,status,credits_used,list_value_halalas,created_at,cancelled_at" },
  payments: { table: "payments", cols: "id,member_id,type,status,amount_sar,gross_halalas,net_halalas,vat_amount_halalas,discount_amount_halalas,method,created_at" },
  classes: { table: "class_instances", cols: "id,class_type_id,instructor_id,starts_at,ends_at,capacity,level,status" },
};

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return new NextResponse("Forbidden", { status: 403 });

  const type = req.nextUrl.searchParams.get("type") ?? "members";
  const ds = DATASETS[type];
  if (!ds) return new NextResponse("Unknown dataset", { status: 400 });

  const { data, error } = await anyFrom(supabase, ds.table).select(ds.cols).order("created_at", { ascending: false });
  if (error) return new NextResponse(error.message, { status: 500 });

  const rows = (data ?? []) as Record<string, unknown>[];
  const csv = toCsv(rows);

  // O1 — record who exported which PII dataset and how many rows. Audit must
  // never block the export, so failures are swallowed.
  try {
    const { data: auth } = await supabase.auth.getUser();
    await anyFrom(supabase, "pricing_audit").insert({
      actor_id: auth.user?.id ?? null,
      action: "export",
      entity_type: ds.table,
      field: "rows",
      new_value: String(rows.length),
      reason: `CSV export: ${type}`,
    });
  } catch {
    /* best-effort audit */
  }

  const stamp = req.nextUrl.searchParams.get("stamp") || "export";
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="elan-${type}-${stamp}.csv"`,
    },
  });
}
