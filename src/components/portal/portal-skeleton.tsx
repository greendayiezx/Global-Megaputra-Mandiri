import { Skeleton } from '@/components/ui/primitives';

/**
 * Route-level placeholder for portal pages while their data loads. It mirrors the common
 * portal layout (header block, KPI row, main panel) so content drops in without a jump.
 * The sidebar and top bar stay visible because loading.tsx renders inside the layout.
 */
export function PortalSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label={label} role="status">
      <span className="sr-only">{label}</span>
      <div className="border-line bg-surface shadow-card rounded-2xl border p-6 md:p-8">
        <Skeleton className="h-7 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-96 max-w-full" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        <Skeleton className="mt-6 h-10 w-44" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="border-line bg-surface shadow-card flex items-start gap-4 rounded-xl border p-5"
          >
            <Skeleton className="size-11 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-2 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {[0, 1].map((panel) => (
          <div key={panel} className="border-line bg-surface shadow-card rounded-xl border p-5">
            <Skeleton className="h-5 w-40" />
            <div className="mt-5 space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
