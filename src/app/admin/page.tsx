import Image from "next/image";
import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { getDashboard, getOverdueTasks } from "@/lib/admin";
import { fmtTime } from "@/lib/format";
import { classImage } from "@/lib/classColor";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const locale = await getLocale();
  const ar = locale === "ar";
  const date = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
  const [d, overdue] = await Promise.all([getDashboard(), getOverdueTasks()]);
  const dueFmt = (iso: string | null) => (iso ? new Intl.DateTimeFormat(ar ? "ar-SA" : "en-GB", { day: "numeric", month: "short" }).format(new Date(iso)) : "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "لوحة التحكم" : "Dashboard"}</h1>
          <p className="font-number text-meta text-status-full">{date}</p>
        </div>
        <Link href="/admin/members" className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 text-sm font-semibold text-ink">{ar ? "إدارة العميلات" : "Manage clients"}</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "حجوزات اليوم" : "Bookings today"} value={String(d.bookingsToday)} note={ar ? `${d.today.length} حصص اليوم` : `${d.today.length} classes today`} />
        <Kpi label={ar ? "نسبة الإشغال" : "Fill rate"} value={d.fillRate === null ? "—" : `${d.fillRate}٪`} note={ar ? "اليوم" : "today"} />
        <Kpi label={ar ? "عضوات جدد" : "New members"} value={String(d.newMembersWeek)} note={ar ? "هذا الأسبوع" : "this week"} good />
        <div className="card-ink p-5">
          <div className="text-caption text-primary-200">{ar ? "إيراد الشهر" : "Revenue (month)"}</div>
          <div className="mt-2 font-number text-3xl">{d.revenueMonth.toLocaleString(ar ? "ar-SA" : "en-US")}</div>
          <div className="text-caption text-ink/70">{ar ? "ريال سعودي" : "SAR"}</div>
        </div>
      </div>

      {(() => {
        const full = d.today.filter((c) => c.booked >= c.capacity);
        const almost = d.today.filter((c) => c.capacity - c.booked === 1);
        if (full.length === 0 && almost.length === 0 && d.newBookingsToday === 0) return null;
        return (
          <section className="card border-s-4 border-s-accent p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lead font-medium text-primary-900">{ar ? "تنبيهات الحصص" : "Class alerts"}</h2>
              <span className="font-number rounded-pill bg-sage/15 px-2.5 py-0.5 text-caption text-sage">
                {ar ? `${d.newBookingsToday} حجز جديد اليوم` : `${d.newBookingsToday} new today`}
              </span>
            </div>
            <ul className="space-y-2">
              {full.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-body">
                  <span className="text-primary-900">{c.name_en} · <span className="font-number">{fmtTime(c.starts_at, locale)}</span></span>
                  <span className="rounded-pill bg-danger/10 px-2.5 py-0.5 text-caption text-danger">{ar ? "اكتملت" : "Full"}</span>
                </li>
              ))}
              {almost.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-body">
                  <span className="text-primary-900">{c.name_en} · <span className="font-number">{fmtTime(c.starts_at, locale)}</span></span>
                  <span className="rounded-pill bg-status-waitlist/15 px-2.5 py-0.5 text-caption text-primary-700">{ar ? "باقي مقعد واحد" : "1 seat left"}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      {overdue.length > 0 ? (
        <section className="card border-s-4 border-s-danger p-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lead font-medium text-primary-900">{ar ? "مهام متابعة مستحقة" : "Due follow-up tasks"}</h2>
            <span className="font-number rounded-pill bg-danger/10 px-2.5 py-0.5 text-caption text-danger">{overdue.length}</span>
          </div>
          <ul className="divide-y divide-outline">
            {overdue.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-body text-primary-900">{t.title}</p>
                  <Link href={`/admin/members/${t.member_id}`} className="text-caption text-primary-700">{t.member_name}</Link>
                </div>
                <span className="font-number shrink-0 text-caption text-danger">{dueFmt(t.due_date)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lead font-medium text-primary-900">{ar ? "حصص اليوم" : "Today's classes"}</h2>
            <Link href="/admin/schedule" className="text-meta text-primary-700">{ar ? "الجدول الكامل" : "Full schedule"}</Link>
          </div>
          {d.today.length === 0 ? (
            <p className="py-8 text-center text-body text-status-full">{ar ? "لا توجد حصص مجدولة اليوم." : "No classes scheduled today."}</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[460px] text-body">
                <div className="flex items-center gap-2 border-b border-outline pb-2 text-caption text-status-full">
                  <span className="w-16 shrink-0">{ar ? "الوقت" : "Time"}</span>
                  <span className="flex-1">{ar ? "الحصة" : "Class"}</span>
                  <span className="w-16 shrink-0">{ar ? "المدرّبة" : "Coach"}</span>
                  <span className="w-14 shrink-0">{ar ? "الحجز" : "Booked"}</span>
                  <span className="w-16 shrink-0">{ar ? "الحالة" : "Status"}</span>
                </div>
                {d.today.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 border-b border-outline py-3 last:border-0">
                    <span className="w-16 shrink-0 font-number text-primary-900">{fmtTime(c.starts_at, locale)}</span>
                    <span className="flex flex-1 items-center gap-2 text-primary-900">
                      <Image src={classImage(c.name_en)} alt="" width={32} height={32} className="h-8 w-8 rounded-md object-cover" />
                      {c.name_en}
                    </span>
                    <span className="w-16 shrink-0 text-status-full">{(ar ? c.instructor_ar : c.instructor_en) ?? "—"}</span>
                    <span className="w-14 shrink-0 font-number text-status-full">{c.booked} / {c.capacity}</span>
                    <span className={`w-16 shrink-0 ${!c.open ? "text-danger" : c.capacity - c.booked === 1 ? "text-primary-700" : "text-sage"}`}>
                      {!c.open ? (ar ? "مكتملة" : "Full") : c.capacity - c.booked === 1 ? (ar ? "باقي مقعد" : "1 left") : ar ? "مفتوحة" : "Open"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-display text-lead font-medium text-primary-900">{ar ? "قائمة الانتظار" : "Waitlist"}</h2>
          {d.waitlist.length === 0 ? (
            <p className="py-2 text-body text-status-full">{ar ? "لا أحد في قائمة الانتظار اليوم." : "No one on the waitlist today."}</p>
          ) : (
            <div className="space-y-4">
              {d.waitlist.map((w, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-variant font-display text-sm text-primary-700">{(w.name.trim()[0] ?? "·").toUpperCase()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-body text-primary-900">{w.name}</div>
                    <div className="truncate text-caption text-status-full">{(ar ? w.class_ar : w.class_en)}{w.starts_at ? ` · ${fmtTime(w.starts_at, locale)}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-5 border-t border-outline pt-4">
            <div className="mb-2 font-display text-body text-primary-900">{ar ? "الأعلى إشغالًا اليوم" : "Top fill today"}</div>
            {d.topClass ? (
              <div className="flex justify-between text-body text-status-full"><span>{d.topClass.name_en}</span><span className="font-number text-primary-700">{d.topClass.pct}٪</span></div>
            ) : (
              <p className="text-meta text-status-full">—</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, good }: { label: string; value: string; note: string; good?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-caption text-status-full">{label}</div>
      <div className="mt-2 font-number text-3xl text-primary-900">{value}</div>
      <div className={`text-caption ${good ? "text-sage" : "text-status-full"}`}>{note}</div>
    </div>
  );
}
