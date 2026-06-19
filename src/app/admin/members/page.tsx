import { getLocale } from "@/lib/locale-server";
import { adminMock as M } from "@/lib/adminMock";

export const dynamic = "force-dynamic";

const toneColor: Record<string, string> = { ok: "#A9B39B", warn: "#C78B73", trial: "#8DA8B8" };

export default async function AdminMembers() {
  const ar = (await getLocale()) === "ar";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "الأعضاء" : "Members"}</h1>
          <p className="text-[13px] text-status-full">{ar ? M.members.note : "348 active members · 7 new this week"}</p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-[10px] border border-outline px-4 py-3 text-sm text-status-full">⌕ {ar ? "بحث عن عضوة" : "Search member"}</div>
          <button className="rounded-[10px] bg-primary px-4 py-3 text-sm font-semibold text-ink">{ar ? "+ عضوة جديدة" : "+ New member"}</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Kpi label={ar ? "إجمالي العضوات" : "Total members"} value={M.members.active} />
        <Kpi label={ar ? "باقات تنتهي قريبًا" : "Expiring soon"} value={M.members.expiring} />
        <Kpi label={ar ? "عضوات تجريبية" : "Trials"} value={M.members.trials} />
      </div>

      <div className="card overflow-hidden p-6">
        <div className="flex items-center gap-3 border-b border-outline pb-3 text-[11px] text-status-full">
          <span className="flex-1">{ar ? "العضوة" : "Member"}</span>
          <span className="w-24 shrink-0">{ar ? "العضوية" : "Plan"}</span>
          <span className="w-24 shrink-0">{ar ? "الحصص المتبقية" : "Credits"}</span>
          <span className="w-20 shrink-0">{ar ? "آخر حضور" : "Last seen"}</span>
          <span className="w-20 shrink-0">{ar ? "الحالة" : "Status"}</span>
        </div>
        {M.members.list.map((m, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-outline py-3.5 text-[13px] last:border-0">
            <div className="flex flex-1 items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-variant font-display text-sm text-primary">{m.initial}</div>
              <div className="min-w-0"><div className="truncate text-primary-900">{m.name}</div><div className="truncate text-[11px] text-status-full">{m.email}</div></div>
            </div>
            <span className="w-24 shrink-0 text-status-full">{m.plan}</span>
            <span className="w-24 shrink-0 text-status-full">{m.left}</span>
            <span className="w-20 shrink-0 text-status-full">{m.last}</span>
            <span className="w-20 shrink-0" style={{ color: toneColor[m.tone] }}>{m.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="font-display text-3xl text-primary-900">{value}</div>
      <div className="text-[12px] text-status-full">{label}</div>
    </div>
  );
}
