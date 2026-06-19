import Link from "next/link";
import { getLocale } from "@/lib/locale-server";
import { adminMock as M } from "@/lib/adminMock";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const ar = (await getLocale()) === "ar";
  const date = new Intl.DateTimeFormat(ar ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-primary-900">{ar ? "لوحة التحكم" : "Dashboard"}</h1>
          <p className="text-[13px] text-status-full">{date}</p>
        </div>
        <button className="rounded-[10px] bg-primary px-5 py-3 text-sm font-semibold text-ink">{ar ? "+ إضافة حصة" : "+ Add class"}</button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label={ar ? "حجوزات اليوم" : "Bookings today"} value={M.overview.bookingsToday} note={M.overview.bookingsDelta} good />
        <Kpi label={ar ? "نسبة الإشغال" : "Fill rate"} value={M.overview.fillRate} note={M.overview.classesToday} />
        <Kpi label={ar ? "عضوات جدد" : "New members"} value={M.overview.newMembers} note={M.overview.newMembersNote} good />
        <div className="card-ink p-5">
          <div className="text-[12px] text-primary-200">{ar ? "إيراد الشهر" : "Revenue (month)"}</div>
          <div className="mt-2 font-display text-3xl">{M.overview.revenueMonth}</div>
          <div className="text-[11px] text-primary-900/70">{ar ? "ريال سعودي" : "SAR"}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-medium text-primary-900">{ar ? "حصص اليوم" : "Today's classes"}</h2>
            <Link href="/admin/schedule" className="text-[12px] text-primary">{ar ? "عرض الجدول الكامل" : "Full schedule"}</Link>
          </div>
          <div className="overflow-x-auto">
           <div className="min-w-[460px] text-[13px]">
            <div className="flex items-center gap-2 border-b border-outline pb-2 text-[11px] text-status-full">
              <span className="w-14 shrink-0">{ar ? "الوقت" : "Time"}</span>
              <span className="flex-1">{ar ? "الحصة" : "Class"}</span>
              <span className="w-16 shrink-0">{ar ? "المدرّبة" : "Coach"}</span>
              <span className="w-14 shrink-0">{ar ? "الحجز" : "Booked"}</span>
              <span className="w-14 shrink-0">{ar ? "الحالة" : "Status"}</span>
            </div>
            {M.todayClasses.map((c, i) => (
              <div key={i} className="flex items-center gap-2 border-b border-outline py-3 last:border-0">
                <span className="w-14 shrink-0 font-display text-[15px] text-primary-900">{c.time}</span>
                <span className="flex-1 text-primary-900">{c.name}</span>
                <span className="w-16 shrink-0 text-status-full">{c.instr}</span>
                <span className="w-14 shrink-0 text-status-full">{c.booked}</span>
                <span className={`w-14 shrink-0 ${c.open ? "text-sage" : "text-primary"}`}>{c.status}</span>
              </div>
            ))}
           </div>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-display text-lg font-medium text-primary-900">{ar ? "قائمة الانتظار" : "Waitlist"}</h2>
          <div className="space-y-4">
            {M.waitlist.map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm text-ink" style={{ background: w.color }}>{w.initial}</div>
                <div className="flex-1"><div className="text-[14px] text-primary-900">{w.name}</div><div className="text-[11px] text-status-full">{w.cls}</div></div>
                <span className="text-[12px] text-sage">{ar ? "إضافة" : "Add"}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-outline pt-4">
            <div className="mb-2 font-display text-base text-primary-900">{ar ? "الأكثر حضورًا" : "Most attended"}</div>
            <div className="flex justify-between text-[13px] text-status-full"><span>{M.topClass.name}</span><span className="text-primary">{M.topClass.pct}</span></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, note, good }: { label: string; value: string; note: string; good?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-[12px] text-status-full">{label}</div>
      <div className="mt-2 font-display text-3xl text-primary-900">{value}</div>
      <div className={`text-[11px] ${good ? "text-sage" : "text-status-full"}`}>{note}</div>
    </div>
  );
}
