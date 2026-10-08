'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * One filter form, two presentations: a sticky sidebar on desktop and a bottom sheet on
 * mobile/tablet. Rendering the form once keeps ids unique and state consistent.
 */
export function FilterPanel({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.querySelector<HTMLElement>('input, select, button')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(buttonVariants({ variant: 'secondary' }), 'lg:hidden')}
        aria-haspopup="dialog"
      >
        <SlidersHorizontal aria-hidden="true" />
        Filter{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      {open && (
        <div
          className="bg-navy/40 fixed inset-0 z-50 lg:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        ref={sheetRef}
        role={open ? 'dialog' : undefined}
        aria-modal={open || undefined}
        aria-label="Filter"
        className={cn(
          'lg:sticky lg:top-40 lg:block lg:self-start',
          open
            ? 'bg-surface shadow-pop fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] lg:static lg:max-h-none lg:rounded-none lg:p-0 lg:shadow-none'
            : 'hidden',
        )}
      >
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <span className="bg-line-strong mx-auto h-1 w-10 rounded-full" aria-hidden="true" />
        </div>
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <p className="text-base font-semibold">Filter</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
            aria-label="Tutup filter"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
