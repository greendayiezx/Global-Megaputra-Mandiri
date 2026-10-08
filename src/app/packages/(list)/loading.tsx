import { PackageCardSkeleton } from '@/components/marketplace/package-card';
import { Skeleton } from '@/components/ui/primitives';

export default function Loading() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-label="Memuat paket">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-9 w-56" />
      <div className="mt-8 grid gap-8 lg:grid-cols-12">
        <Skeleton className="hidden h-[480px] lg:col-span-3 lg:block" />
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-9 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PackageCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
