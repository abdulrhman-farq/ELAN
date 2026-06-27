import { getLocale } from "@/lib/locale-server";
import { getInstructors } from "@/lib/admin";
import { getIsAdmin } from "@/lib/admin-guard";
import { TrainerAccessControl } from "@/components/admin/TrainerAccessControl";

export const dynamic = "force-dynamic";

export default async function AdminTrainers() {
  const ar = (await getLocale()) === "ar";
  const [trainers, isAdmin] = await Promise.all([getInstructors(), getIsAdmin()]);
  const totalClasses = trainers.reduce((s, t) => s + t.classesThisWeek, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-page-title font-medium text-primary-900">{ar ? "المدرّبات" : "Trainers"}</h1>
        <p className="text-meta text-status-full">
          {ar ? `${trainers.length} مدرّبات · ${totalClasses} حصة هذا الأسبوع` : `${trainers.length} trainers · ${totalClasses} classes this week`}
        </p>
      </div>

      {trainers.length === 0 ? (
        <div className="card p-10 text-center text-body text-status-full">{ar ? "لا توجد مدرّبات." : "No trainers yet."}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trainers.map((tr) => {
            const name = ar ? tr.name_ar : tr.name_en;
            const bio = ar ? tr.bio_ar : tr.bio_en;
            return (
              <div key={tr.id} className="card flex items-center gap-4 p-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-surface-variant font-display text-2xl text-primary-700">
                  {(name?.trim()[0] ?? "·").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lead text-primary-900">{name}</h3>
                  {bio ? <p className="mt-0.5 truncate text-meta text-status-full">{bio}</p> : null}
                  <p className="mt-2 text-meta text-primary-700">
                    {ar ? `${tr.classesThisWeek} حصة هذا الأسبوع` : `${tr.classesThisWeek} classes this week`}
                  </p>
                  {isAdmin ? (
                    <div className="mt-3">
                      <TrainerAccessControl instructorId={tr.id} linked={tr.linked} ar={ar} />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
