import { Skeleton } from "@/components/Skeleton";

/** Bookings loading — title, the upcoming/past tab chips, and a list of
 *  booking-card placeholders. */
export default function BookingsLoading() {
  return (
    <section className="space-y-6 p-6">
      <Skeleton className="h-8 w-32" />

      {/* Tab chips */}
      <div className="flex gap-2">
        <Skeleton className="h-11 w-24 rounded-pill" />
        <Skeleton className="h-11 w-24 rounded-pill" />
      </div>

      {/* Booking cards */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-2 p-5">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-6 w-20 rounded-pill" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </section>
  );
}
