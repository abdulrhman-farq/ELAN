import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getTrainerContext, getTrainerSchedule, type TrainerClassRow } from "@/lib/trainer";
import { fmtTime, fmtDayHeading } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TrainerHome() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const ctx = await getTrainerContext();

  if (!ctx.instructorId) {
    // Admin (not linked as an instructor) landed here, or an unlinked account.
    return (
      <div className="card p-10 text-center text-body text-status-full">
        {ar
          ? "هذا الحساب غير مرتبط بملف مدرّبة. تواصلي مع الإدارة لربط حسابك."
          : "This account isn't linked to a trainer profile. Ask an admin to link it."}
        {ctx.isAdmin ? (
          <div className="mt-4"><Link href="/admin/trainers" className="text-primary-700 underline">{ar ? "إدارة المدرّبات" : "Manage trainers"}</Link></div>
        ) : null}
      </div>
    );
  }

  const rows = await getTrainerSchedule(ctx.instructorId, 14);
  const name = (ar ? ctx.name_ar : ctx.name_en) ?? "";

  const groups = new Map<string, TrainerClassRow[]>();
  for (const r of rows) {
    const key = r.starts_at.slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? `مرحبًا ${name}` : `Hi ${name}`}</h1>
        <p className="text-meta text-status-full">{ar ? "حصصك القادمة" : "Your upcoming classes"}</p>
      </div>

      {rows.length === 0 ? (
        <div className="card p-10 text-center text-body text-status-full">
          {ar ? "لا توجد حصص مجدولة لك." : "You have no scheduled classes."}
        </div>
      ) : (
        [...groups.entries()].map(([day, list]) => (
          <section key={day} className="space-y-3">
            <h2 className="font-display text-lead font-medium text-primary-900">{fmtDayHeading(list[0].starts_at, locale)}</h2>
            <div className="space-y-3">
              {list.map((c) => {
                const full = c.confirmed >= c.capacity;
                const cancelled = c.status === "cancelled";
                return (
                  <Link
                    key={c.id}
                    href={`/trainer/class/${c.id}`}
                    className="card flex items-center justify-between gap-3 p-5 hover:bg-surface-variant/40"
                  >
                    <div className="min-w-0">
                      <p className="font-display text-lead text-primary-900">{ar ? c.name_ar : c.name_en}</p>
                      <p className="font-number text-meta text-status-full">
                        {fmtTime(c.starts_at, locale)}
                        {cancelled ? ` · ${ar ? "ملغاة" : "Cancelled"}` : ""}
                        {c.waitlist > 0 ? ` · ${c.waitlist} ${ar ? "بالانتظار" : "waiting"}` : ""}
                      </p>
                    </div>
                    <div className="text-end">
                      <div className={`font-number text-body ${full ? "text-danger" : "text-primary-900"}`}>{c.confirmed} / {c.capacity}</div>
                      <div className="text-caption text-primary-700">{ar ? "كشف الحضور ›" : "Roster ›"}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
