"use server";

import { revalidatePath } from "next/cache";
import { getServerSupabase, rpc } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

async function adminClient() {
  const supabase = await getServerSupabase();
  const { data: isAdmin } = await rpc<boolean>(supabase, "is_admin");
  if (!isAdmin) return null;
  return supabase;
}

export async function createMemberAction(input: {
  full_name: string;
  phone?: string;
  email?: string;
  source?: string;
  lead_status?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const full_name = input.full_name?.trim();
  if (!full_name) return { ok: false, error: "name_required" };
  const { data, error } = await supabase
    .from("members")
    .insert({
      full_name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      source: input.source?.trim() || null,
      lead_status: input.lead_status?.trim() || "lead",
      role: "member",
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "insert_failed" };
  revalidatePath("/admin/members");
  return { ok: true, id: data.id };
}

export async function setLeadStatusAction(memberId: string, status: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const { error } = await supabase
    .from("members")
    .update({ lead_status: status || null, modified: new Date().toISOString() })
    .eq("id", memberId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  return { ok: true };
}

export async function addNoteAction(memberId: string, body: string): Promise<ActionResult> {
  const supabase = await adminClient();
  if (!supabase) return { ok: false, error: "forbidden" };
  const text = body?.trim();
  if (!text) return { ok: false, error: "empty" };
  const { data: auth } = await supabase.auth.getUser();
  // member_notes is a new table not yet in the generated Database types.
  const { error } = await (supabase as unknown as {
    from: (t: string) => { insert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }> };
  })
    .from("member_notes")
    .insert({ member_id: memberId, body: text, created_by: auth.user?.id ?? null });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/members/${memberId}`);
  return { ok: true };
}
