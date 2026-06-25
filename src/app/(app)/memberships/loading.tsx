import { Skeleton } from "@/components/Skeleton";

/** Memberships loading — title, the dark current-plan card, and the plans /
 *  packs lists. */
export default function MembershipsLoading() {
  return (
    <section className="space-y-6 p-6">
      <Skeleton className="h-8 w-44" />

      {/* Current plan — dark "brand moment" card */}
      <div className="card-ink space-y-2 p-6">
        <Skeleton className="h-6 w-1/2 bg-ink/15" />
        <Skeleton className="h-4 w-1/3 bg-ink/15" />
      </div>

      {/* Plans / packs list */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-28" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card flex items-center justify-between gap-3 p-5">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-11 w-24 shrink-0 rounded-pill" />
          </div>
        ))}
      </div>
    </section>
  );
}
