'use client';

import { Check, GitCompareArrows, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MAX_COMPARE, useCompareIds, writeCompareIds } from './compare-store';

export function CompareToggle({
  packageId,
  name,
  className,
}: {
  packageId: string;
  name: string;
  className?: string;
}) {
  const ids = useCompareIds();
  const selected = ids.includes(packageId);
  const full = !selected && ids.length >= MAX_COMPARE;

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={full}
      title={full ? `Maksimal ${MAX_COMPARE} paket` : undefined}
      onClick={() =>
        writeCompareIds(selected ? ids.filter((id) => id !== packageId) : [...ids, packageId])
      }
      className={cn(
        buttonVariants({ variant: selected ? 'outline' : 'secondary', size: 'md' }),
        selected && 'bg-primary-soft',
        className,
      )}
    >
      {selected ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
      <span className="sr-only">{name}: </span>
      {selected ? 'Dibandingkan' : full ? `Maks. ${MAX_COMPARE}` : 'Bandingkan'}
    </button>
  );
}

/** Header shortcut — the comparison list is GMM's equivalent of a basket. */
export function CompareHeaderLink() {
  const ids = useCompareIds();
  return (
    <Link
      href={ids.length ? `/compare?ids=${encodeURIComponent(ids.join(','))}` : '/compare'}
      className="group/cmp text-fg-secondary hover:bg-subtle hover:text-fg relative flex flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5"
    >
      {/* Half-turn with a slight overshoot on hover: the two arrows swap places. */}
      <GitCompareArrows
        className="size-5 motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/cmp:motion-safe:rotate-180"
        aria-hidden="true"
      />
      <span className="text-[11px] font-medium">Bandingkan</span>
      {ids.length > 0 && (
        <span className="bg-primary absolute top-0.5 right-2 grid min-w-4.5 place-items-center rounded-full px-1 text-[10px] leading-4.5 font-bold text-white">
          {ids.length}
          <span className="sr-only"> paket dipilih</span>
        </span>
      )}
    </Link>
  );
}

export function CompareBar() {
  const ids = useCompareIds();
  if (ids.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Paket yang dibandingkan"
      className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] z-40 px-4 lg:bottom-6"
    >
      <div className="border-navy bg-navy shadow-pop mx-auto flex max-w-md items-center justify-between gap-3 rounded-lg border py-2 pr-2 pl-4 text-white">
        <p className="text-sm">
          <strong>{ids.length}</strong>/{MAX_COMPARE} paket dipilih
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => writeCompareIds([])}
            className={cn(
              buttonVariants({ size: 'sm', variant: 'ghost' }),
              'text-white/80 hover:bg-white/10 hover:text-white',
            )}
          >
            <X aria-hidden="true" /> Hapus
          </button>
          <Link
            href={`/compare?ids=${encodeURIComponent(ids.join(','))}`}
            className={buttonVariants({ size: 'sm' })}
          >
            Bandingkan
          </Link>
        </div>
      </div>
    </div>
  );
}
