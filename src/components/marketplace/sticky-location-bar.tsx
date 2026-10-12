'use client';

import { MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Compact "cek lokasi" bar that slides in under the site header once the homepage hero
 * (`#{heroId}`) has scrolled away, so visitors never scroll back up to check coverage.
 * Plain GET form, like the hero form, so it also works before JavaScript.
 */
export function StickyLocationBar({ heroId }: { heroId: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const hero = document.getElementById(heroId)?.closest('section');
    if (!hero) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const headerBottom =
        document.querySelector('body > header')?.getBoundingClientRect().bottom ?? 0;
      setTop(Math.max(0, headerBottom));
      setVisible(hero.getBoundingClientRect().bottom < headerBottom + 8);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [heroId]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw = new FormData(e.currentTarget).get('address');
    const address = typeof raw === 'string' ? raw.trim().replace(/\s+/g, ' ').slice(0, 200) : '';
    router.push(address ? `/coverage?address=${encodeURIComponent(address)}` : '/coverage');
  }

  return (
    <div
      role="region"
      aria-label="Cek lokasi cepat"
      // Hidden bars must not be reachable by keyboard or screen readers.
      inert={!visible}
      style={{ top }}
      className={cn(
        'border-line bg-surface/95 fixed inset-x-0 z-20 border-b shadow-[0_8px_24px_rgba(5,18,43,0.08)] backdrop-blur transition-[transform,opacity] duration-300 motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
      )}
    >
      <form
        action="/coverage"
        method="get"
        onSubmit={onSubmit}
        className="container-page flex items-center gap-3 py-2.5"
      >
        <p className="hidden shrink-0 items-center gap-2 text-sm font-semibold md:flex">
          <MapPin className="text-primary size-4" aria-hidden="true" />
          Cek internet di lokasi Anda
        </p>
        <label htmlFor="sticky-address" className="sr-only">
          Alamat pemasangan
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="text-fg-muted pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <input
            id="sticky-address"
            name="address"
            type="text"
            autoComplete="street-address"
            placeholder="Masukkan alamat lengkap Anda"
            className="border-line-strong bg-canvas focus:border-primary focus:bg-surface focus:ring-primary/15 h-10 w-full rounded-md border pr-3 pl-9 text-sm focus:ring-3 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="bg-primary hover:bg-primary-hover h-10 shrink-0 rounded-md px-4 text-sm font-semibold text-white"
        >
          <span className="hidden sm:inline">Cek Ketersediaan</span>
          <span className="sm:hidden">Cek</span>
        </button>
      </form>
    </div>
  );
}
