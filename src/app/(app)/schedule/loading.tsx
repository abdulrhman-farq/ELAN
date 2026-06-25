import { Skeleton } from "@/components/Skeleton";

/** Schedule loading — title, the horizontal date strip, and a stack of
 *  class-card placeholders. */
export default function ScheduleLoading() {
  return (
    <section className="space-y-6 p-6">
      <Skeleton className="h-8 w-40" />

      {/* Date strip */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-12 shrink-0 rounded-lg" />
        ))}
      </div>

      {/* Class cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-4 p-5">
            <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-11 w-24 shrink-0 rounded-pill" />
          </div>
        ))}
      </div>
    </section>
  );
}
