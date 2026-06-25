import { getServerSupabase } from "@/lib/supabase/server";

/** A single pricing_audit row (admin-only via RLS: pricing_audit_admin_all). */
export interface AuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  reason: string | null;
  created_at: string;
}

/**
 * Recent pricing_audit rows, most recent first. RLS already restricts the table
 * to admins, so this is safe to call from a Server Component without an extra
 * is_admin() gate (non-admins simply receive an empty list).
 */
export async function getRecentAudit(limit = 100): Promise<AuditRow[]> {
  const supabase = await getServerSupabase();
  const { data } = await (supabase as unknown as {
    from: (t: string) => {
      select: (c: string) => {
        order: (c: string, o: { ascending: boolean }) => {
          limit: (n: number) => Promise<{ data: AuditRow[] | null }>;
        };
      };
    };
  })
    .from("pricing_audit")
    .select("id, actor_id, action, entity_type, entity_id, field, old_value, new_value, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
