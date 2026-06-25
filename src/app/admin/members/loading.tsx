import { Skeleton } from "@/components/Skeleton";

/** Admin members loading — header + search, KPI grid, filter chips, and the
 *  members table placeholder. */
export default function AdminMembersLoading() {
  return (
    <div className="space-y-6">
      {/* Header + tools */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-11 w-44 rounded-lg md:w-56" />
          <Skeleton className="h-11 w-28 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-2 p-5 text-center">
            <Skeleton className="mx-auto h-8 w-12" />
            <Skeleton className="mx-auto h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-20 rounded-pill" />
        ))}
      </div>

      {/* Members table */}
      <div className="card p-6">
        <div className="space-y-3.5">
          <Skeleton className="h-4 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-outline pb-3.5 last:border-0">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
              <Skeleton className="hidden h-4 w-24 shrink-0 md:block" />
              <Skeleton className="hidden h-4 w-16 shrink-0 md:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
