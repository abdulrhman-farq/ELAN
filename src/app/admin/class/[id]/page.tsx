import { notFound } from "next/navigation";
import { getLocale } from "@/lib/locale-server";
import { getClassRoster, type RosterEntry } from "@/lib/admin";
import { fmtLongDateTime, levelLabel } from "@/lib/format";
import { AttendanceButtons } from "@/components/admin/AttendanceButtons";

export const dynamic = "force-dynamic";

const statusLabel = (s: string, ar: boolean): string => {
  const m: Record<string, [string, string]> = {
    confirmed: ["مؤكد", "Confirmed"],
    attended: ["تم الحضور", "Attended"],
    no_show: ["لم تحضر", "No-show"],
    waitlisted: ["قائمة الانتظار", "Waitlisted"],
  };
  return (m[s]?.[ar ? 0 : 1]) ?? s;
};

export default async function AdminClassRosterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const ar = locale === "ar";
  const roster = await getClassRoster(id);
  if (!roster) notFound();

  return (
    <div className="space-y-5">
      <section className="card space-y-1 p-5">
        <h2 className="text-lg font-bold text-primary-900">
          {ar ? roster.name_ar : roster.name_en}
          {roster.status === "cancelled" ? ` · ${ar ? "ملغاة" : "Cancelled"}` : ""}
        </h2>
        <p className="text-sm text-status-full">{fmtLongDateTime(roster.starts_at, roster.ends_at, locale)}</p>
        <p className="text-sm text-status-full">
          {levelLabel(roster.level, locale)}
          {(ar ? roster.instructor_ar : roster.instructor_en) ? ` · ${ar ? roster.instructor_ar : roster.instructor_en}` : ""}
          {` · ${roster.confirmed.length}/${roster.capacity}`}
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-primary-800">
          {ar ? "المسجّلات" : "Booked"} ({roster.confirmed.length}/{roster.capacity})
        </h3>
        <div className="card divide-y divide-outline">
          {roster.confirmed.length === 0 ? (
            <p className="p-6 text-center text-status-full">{ar ? "لا توجد حجوزات." : "No bookings."}</p>
          ) : (
            roster.confirmed.map((e) => (
              <Row key={e.booking_id} e={e} ar={ar} locale={locale} classInstanceId={id} actionable={e.status === "confirmed"} />
            ))
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-semibold text-primary-800">
          {ar ? "قائمة الانتظار" : "Waitlist"} ({roster.waitlisted.length})
        </h3>
        <div className="card divide-y divide-outline">
          {roster.waitlisted.length === 0 ? (
            <p className="p-6 text-center text-status-full">{ar ? "لا أحد في الانتظار." : "Nobody waitlisted."}</p>
          ) : (
            roster.waitlisted.map((e) => (
              <div key={e.booking_id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-primary-900">
                    {e.waitlist_position ? `${e.waitlist_position}. ` : ""}{e.full_name}
                  </p>
                  <p className="text-xs text-status-full">{e.phone ?? ""} · {levelLabel(e.level, locale)}</p>
                </div>
                <span className="chip bg-status-waitlist/10 text-status-waitlist">{statusLabel("waitlisted", ar)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Row({
  e, ar, locale, classInstanceId, actionable,
}: {
  e: RosterEntry;
  ar: boolean;
  locale: "ar" | "en";
  classInstanceId: string;
  actionable: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate font-medium text-primary-900">{e.full_name}</p>
        <p className="truncate text-xs text-status-full">{e.phone ?? ""} · {levelLabel(e.level, locale)}</p>
      </div>
      {actionable ? (
        <AttendanceButtons
          bookingId={e.booking_id}
          classInstanceId={classInstanceId}
          attendedLabel={ar ? "حضرت" : "Attended"}
          noShowLabel={ar ? "لم تحضر" : "No-show"}
        />
      ) : (
        <span className={`chip ${e.status === "attended" ? "bg-primary-100 text-primary-700" : "bg-status-full/15 text-status-full"}`}>
          {statusLabel(e.status, ar)}
        </span>
      )}
    </div>
  );
}
