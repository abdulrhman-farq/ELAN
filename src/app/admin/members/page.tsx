import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getMembersDirectory } from "@/lib/admin";
import { levelLabel } from "@/lib/format";
import { MemberSearch } from "@/components/admin/MemberSearch";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const locale = await getLocale();
  const ar = locale === "ar";
  const q = (await searchParams).q ?? "";
  const members = await getMembersDirectory(q);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-primary-800">{ar ? "الأعضاء" : "Members"}</h2>
        <span className="text-sm text-status-full">{members.length}{ar ? " نتيجة" : " results"}</span>
      </div>

      <MemberSearch initial={q} placeholder={ar ? "ابحثي بالاسم أو الجوال أو البريد" : "Search name, phone or email"} />

      <div className="card divide-y divide-outline">
        {members.length === 0 ? (
          <p className="p-10 text-center text-status-full">{ar ? "لا يوجد أعضاء." : "No members found."}</p>
        ) : (
          members.map((m) => (
            <Link key={m.id} href={`/admin/members/${m.id}`} className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-primary-900">{m.full_name}</p>
                <p className="truncate text-xs text-status-full">
                  {m.phone ?? m.email ?? ""} · {levelLabel(m.level, locale)}
                </p>
              </div>
              <span className="chevron text-status-full">›</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
