import { Skeleton } from "@/components/Skeleton";

/** Admin schedule loading — header, the generator bar, and day-grouped class
 *  card grid placeholders. */
export default function AdminScheduleLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-36 rounded-pill" />
      </div>

      {Array.from({ length: 2 }).map((_, d) => (
        <div key={d} className="space-y-3">
          <Skeleton className="h-5 w-28" />
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <Skeleton className="h-24 w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
