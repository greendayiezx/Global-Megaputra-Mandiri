'use client';

import Image from 'next/image';
import { useEffect, useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

export interface HeroSlide {
  /** Path under /public, URL-encoded. */
  image: string;
  title: string;
  subtitle: string;
  /** Light photos get dark text and a dark-text header; dark photos the navy treatment. */
  tone: 'dark' | 'light';
  /**
   * Desktop: start the photo below the floating header (for photos whose subject sits at the
   * very top). Otherwise the photo runs behind the header.
   */
  belowHeader?: boolean;
}

/* The backdrop, headline and indicators are separate islands inside the server-rendered hero
   (the address form between them must not re-render), so they share the index here. */
let current = 0;
const listeners = new Set<() => void>();
const setSlide = (i: number) => {
  current = i;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const useSlide = () =>
  useSyncExternalStore(
    subscribe,
    () => current,
    () => 0,
  );

const FADE = 'transition-opacity duration-[1200ms] ease-in-out motion-reduce:duration-0';

/** Stacked photos that crossfade; the active one gets the slow zoom. Slide 0 may carry a video. */
export function HeroBackdrop({ slides, video }: { slides: readonly HeroSlide[]; video?: string }) {
  const active = useSlide();

  // Lets the header and hero text follow the photo (see the `herolight` CSS variant).
  useEffect(() => {
    const root = document.documentElement;
    if (slides[active]?.tone === 'light') root.dataset.heroTone = 'light';
    else delete root.dataset.heroTone;
  }, [active, slides]);
  useEffect(() => () => void delete document.documentElement.dataset.heroTone, []);

  return (
    <>
      {slides.map((s, i) => (
        <div
          key={s.image}
          className={cn(
            'absolute inset-0',
            FADE,
            i === active ? 'opacity-100' : 'opacity-0',
            s.belowHeader &&
              'lg:top-[calc(var(--site-header-h)+1.5rem)] lg:[mask-image:linear-gradient(to_bottom,transparent,#000_120px)]',
          )}
        >
          {/* Re-adding the class restarts the zoom each time the slide comes back. */}
          <div className={cn('absolute inset-0', i === active && 'hero-zoom')}>
            <Image
              src={s.image}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                'object-cover',
                s.belowHeader ? 'object-[70%_center] lg:object-top' : 'object-[75%_center]',
              )}
            />
            {i === 0 && video && (
              <video
                className="absolute inset-0 size-full object-cover motion-reduce:hidden"
                src={video}
                poster={s.image}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            )}
          </div>
        </div>
      ))}
    </>
  );
}

/**
 * Title and subtitle of every slide stacked in one grid cell, so the block keeps the height of
 * the longest one and nothing below it moves while they crossfade.
 */
export function HeroHeadline({ slides }: { slides: readonly HeroSlide[] }) {
  const active = useSlide();
  return (
    <>
      <h1
        id="hero-title"
        className="hero-rise herolight:text-navy mt-4 grid text-[36px] leading-[1.05] font-bold tracking-tight text-white transition-colors duration-[1200ms] [animation-delay:100ms] sm:text-[48px] lg:text-[60px]"
      >
        {slides.map((s, i) => (
          <span
            key={s.title}
            aria-hidden={i !== active || undefined}
            className={cn('[grid-area:1/1]', FADE, i === active ? 'opacity-100' : 'opacity-0')}
          >
            {s.title}
          </span>
        ))}
      </h1>
      <p className="hero-rise herolight:text-fg-secondary mt-4 grid max-w-[520px] text-[15px] leading-relaxed text-blue-100/90 transition-colors duration-[1200ms] [animation-delay:200ms] md:text-lg">
        {slides.map((s, i) => (
          <span
            key={s.subtitle}
            aria-hidden={i !== active || undefined}
            className={cn('[grid-area:1/1]', FADE, i === active ? 'opacity-100' : 'opacity-0')}
          >
            {s.subtitle}
          </span>
        ))}
      </p>
    </>
  );
}

/**
 * Slide indicators + autoplay. Keeps rotating (a manual pick restarts the 7 s count); off only
 * for visitors who prefer reduced motion, who can still switch by hand.
 */
export function HeroDots({
  count,
  labels,
  interval = 7000,
}: {
  count: number;
  labels: readonly string[];
  interval?: number;
}) {
  const active = useSlide();

  useEffect(() => {
    if (count < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setSlide((current + 1) % count), interval);
    return () => window.clearInterval(timer);
  }, [count, interval, active]);

  if (count < 2) return null;
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Pilih tampilan banner">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setSlide(i)}
          aria-label={labels[i]}
          aria-pressed={i === active}
          className="group/dot grid h-6 place-items-center"
        >
          <span
            className={cn(
              'block h-1 rounded-full transition-all duration-500',
              i === active
                ? 'herolight:bg-primary w-8 bg-white'
                : 'herolight:bg-navy/25 herolight:group-hover/dot:bg-navy/45 w-4 bg-white/35 group-hover/dot:bg-white/60',
            )}
          />
        </button>
      ))}
    </div>
  );
}
