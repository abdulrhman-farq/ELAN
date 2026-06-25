import { Skeleton } from "@/components/Skeleton";

/** Root-level loading state — a centered, brand-quiet placeholder shown while a
 *  top-level segment streams in. RTL-safe (no directional layout). */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="mx-auto h-8 w-40" />
        <Skeleton className="h-44 w-full rounded-card" />
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      </div>
    </div>
  );
}
