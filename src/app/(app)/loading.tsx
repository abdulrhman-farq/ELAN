import { Skeleton } from "@/components/Skeleton";

/** Member app shell loading — mirrors the home page: hero, next-class card,
 *  two stat tiles, and the "discover" grid. Renders inside the (app) layout
 *  container so there's no layout shift when the page resolves. */
export default function AppLoading() {
  return (
    <section className="pb-6">
      {/* Hero */}
      <Skeleton className="h-[300px] w-full rounded-b-xl md:mt-4 md:rounded-xl" />

      <div className="space-y-5 px-6">
        {/* Next-class card (pulled up over the hero) */}
        <div className="card relative -mt-16 flex items-center gap-3 p-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-28 rounded-pill" />
          </div>
          <Skeleton className="h-12 w-12 shrink-0 self-start rounded-full" />
        </div>

        {/* Two stat tiles */}
        <div className="flex gap-3">
          <div className="card flex-1 space-y-2 p-5 text-center">
            <Skeleton className="mx-auto h-8 w-12" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
          <div className="card flex-1 space-y-2 p-5 text-center">
            <Skeleton className="mx-auto h-8 w-12" />
            <Skeleton className="mx-auto h-3 w-16" />
          </div>
        </div>

        {/* Discover grid */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-36 w-full rounded-lg" />
            <Skeleton className="h-36 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
