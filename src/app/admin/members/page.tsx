import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getMembersOverview, type MemberListRow } from "@/lib/admin";
import { NewMemberDialog } from "@/components/admin/NewMemberDialog";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "", ar: "الكل", en: "All" },
  { key: "lead", ar: "مهتمة", en: "Leads" },
  { key: "trial", ar: "تجريبية", en: "Trials" },
  { key: "active", ar: "نشطة", en: "Active" },
  { key: "lapsed", ar: "منقطعة", en: "Lapsed" },
];

const STATUS_LABEL: Record<string, [string, string]> = {
  lead: ["مهتمة", "Lead"],
  trial: ["تجريبية", "Trial"],
  active: ["نشطة", "Active"],
  lapsed: ["منقطعة", "Lapsed"],
};
const STATUS_TONE: Record<string, string> = { lead: "#8DA8B8", trial: "#C78B73", active: "#8A9272", lapsed: "#B9544A" };

function effectiveStatus(m: MemberListRow): string {
  if (m.lead_status && STATUS_LABEL[m.lead_status]) return m.lead_status;
  return m.period_end || m.credits > 0 ? "active" : "lead";
}

function fmtDate(iso: string | null, ar: boolean): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso));
}

function isExpiringSoon(iso: string | null): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return t >= Date.now() && t <= Date.now() + 7 * 86400000;
}

function expiryLabel(iso: string | null, ar: boolean): string {
  if (!iso) return ar ? "بلا اشتراك" : "No plan";
  const t = new Date(iso).getTime();
  const days = Math.ceil((t - Date.now()) / 86400000);
  if (days < 0) return ar ? "منتهٍ" : "Expired";
  const d = fmtDate(iso, ar);
  return ar ? `${d} · باقي ${days} يوم` : `${d} · ${days}d left`;
}

export default async function AdminMembers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const ar = (await getLocale()) === "ar";
  const { kpis, rows } = await getMembersOverview(sp.q, sp.status);
  const q = sp.q ?? "";
  const active = sp.status ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "العميلات" : "Members"}</h1>
          <p className="text-meta text-status-full">
            {ar
              ? `${kpis.total} عميلة · ${kpis.newWeek} جديدة هذا الأسبوع`
              : `${kpis.total} clients · ${kpis.newWeek} new this week`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form className="flex">
            {active ? <input type="hidden" name="status" value={active} /> : null}
            <input
              name="q"
              defaultValue={q}
              placeholder={ar ? "بحث بالاسم أو الجوال أو البريد" : "Search name / phone / email"}
              className="min-h-[44px] w-44 rounded-lg border border-outline bg-surface-container px-4 text-sm text-primary-900 outline-none focus:border-accent md:w-56"
            />
          </form>
          <a
            href="/admin/members/export"
            className="inline-flex min-h-[44px] items-center rounded-lg border border-outline px-4 text-sm text-primary-700"
          >
            {ar ? "تصدير CSV" : "Export CSV"}
          </a>
          <NewMemberDialog ar={ar} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "إجمالي العميلات" : "Total clients"} value={kpis.total} />
        <Kpi label={ar ? "عضويات نشطة" : "Active"} value={kpis.active} />
        <Kpi label={ar ? "تنتهي قريبًا" : "Expiring soon"} value={kpis.expiring} tone="#C78B73" />
        <Kpi label={ar ? "تجريبية" : "Trials"} value={kpis.trials} tone="#8DA8B8" />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const href = `/admin/members?${new URLSearchParams({ ...(f.key ? { status: f.key } : {}), ...(q ? { q } : {}) }).toString()}`;
          const on = active === f.key;
          return (
            <Link
              key={f.key || "all"}
              href={href}
              className={`chip min-h-[44px] items-center ${on ? "bg-primary text-ink" : "border border-outline text-primary-700"}`}
            >
              {ar ? f.ar : f.en}
            </Link>
          );
        })}
      </div>

      <div className="card p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="flex items-center gap-3 border-b border-outline pb-3 text-meta text-status-full">
              <span className="flex-1">{ar ? "العميلة" : "Client"}</span>
              <span className="w-28 shrink-0">{ar ? "العضوية" : "Plan"}</span>
              <span className="w-24 shrink-0">{ar ? "الحصص المتبقية" : "Remaining"}</span>
              <span className="w-36 shrink-0">{ar ? "ينتهي الاشتراك" : "Expires"}</span>
              <span className="w-28 shrink-0">{ar ? "الحالة" : "Status"}</span>
            </div>

            {rows.length === 0 ? (
              <p className="py-10 text-center text-body text-status-full">
                {ar ? "لا توجد عميلات مطابقة. سجّلي عميلة جديدة للبدء." : "No matching clients. Register one to begin."}
              </p>
            ) : (
              rows.map((m) => {
                const st = effectiveStatus(m);
                const initial = (m.full_name.trim()[0] ?? "·").toUpperCase();
                return (
                  <Link
                    key={m.id}
                    href={`/admin/members/${m.id}`}
                    className="flex items-center gap-3 border-b border-outline py-3.5 text-body last:border-0 hover:bg-surface-variant/40"
                  >
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-variant font-display text-sm text-primary-700">{initial}</div>
                      <div className="min-w-0">
                        <div className="truncate text-primary-900">{m.full_name}</div>
                        <div className="truncate text-caption text-status-full">{m.email ?? m.phone ?? "—"}</div>
                      </div>
                    </div>
                    <span className="w-28 shrink-0 truncate text-status-full">{(ar ? m.plan_ar : m.plan_en) ?? "—"}</span>
                    <span className="w-24 shrink-0 text-primary-900"><span className="font-number">{m.credits}</span>{ar ? " حصة" : ""}</span>
                    <span className={`w-36 shrink-0 font-number ${isExpiringSoon(m.period_end) ? "text-danger" : "text-status-full"}`}>{expiryLabel(m.period_end, ar)}</span>
                    <span className="flex w-28 shrink-0 items-center gap-1.5">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_TONE[st] }} />
                      <span className="truncate text-primary-900">{STATUS_LABEL[st]?.[ar ? 0 : 1]}</span>
                      {isExpiringSoon(m.period_end) ? (
                        <span className="rounded-pill bg-status-waitlist/15 px-1.5 text-caption text-primary-700">{ar ? "تنتهي قريبًا" : "soon"}</span>
                      ) : null}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="card p-5 text-center">
      <div className="font-number text-3xl" style={tone ? { color: tone } : { color: "#3A332F" }}>{value}</div>
      <div className="text-caption text-status-full">{label}</div>
    </div>
  );
}
