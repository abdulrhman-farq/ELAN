import { Skeleton } from "@/components/Skeleton";

/** Admin reports loading — header, two KPI rows, and the two report panels
 *  (revenue by type + bookings by status). */
export default function AdminReportsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Two KPI rows */}
      {Array.from({ length: 2 }).map((_, row) => (
        <div key={row} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card space-y-2 p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-20" />
            </div>
          ))}
        </div>
      ))}

      {/* Two report panels */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="card space-y-4 p-6">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full rounded-pill" />
            </div>
          ))}
        </section>
        <section className="card space-y-3 p-6">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-outline pb-2 last:border-0">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
