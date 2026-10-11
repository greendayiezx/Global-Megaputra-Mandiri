'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TimelineEntry {
  title: string;
  description: string;
  /** Short marker shown above the title, e.g. "Langkah 01" or a year. */
  date: string;
  image: string;
  imageAlt?: string;
  /** Rendered icon element, e.g. `<FileCheck2 />` (elements, unlike components, can cross from server to client). */
  icon?: ReactNode;
}

/**
 * Zig-zag timeline: copy and a compact illustration sit side by side, swapping sides each
 * step, on both sides of a central rail (left rail on mobile). As the visitor scrolls, the
 * rail fills in brand blue with a dot riding its tip, and each step's dot lights up once
 * the fill reaches it. Adapted from a 21st.dev block to GMM tokens.
 */
export default function Timeline({
  items,
  className,
}: {
  items: readonly TimelineEntry[];
  className?: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  // Fill length in px along the rail, and how many step dots it has passed.
  const [fill, setFill] = useState(0);
  const [reached, setReached] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const rail = railRef.current;
      if (!rail) return;
      const rect = rail.getBoundingClientRect();
      // The fill tip follows a reading line slightly above the middle of the viewport.
      const tip = Math.min(rect.height, Math.max(0, window.innerHeight * 0.55 - rect.top));
      setFill(tip);
      setReached(
        dotRefs.current.filter((d) => d && d.getBoundingClientRect().top - rect.top <= tip).length,
      );
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
  }, [items]);

  return (
    <div className={cn('relative px-6 py-12 md:px-10 md:py-16 lg:px-16', className)}>
      {/* Rail: grey track, blue scroll-driven fill, and a dot riding the fill's tip. */}
      <div
        ref={railRef}
        aria-hidden="true"
        className="bg-line absolute top-12 bottom-12 left-[39px] w-0.5 rounded-full md:top-16 md:bottom-16 md:left-1/2 md:-translate-x-1/2"
      >
        <div
          className="bg-primary absolute inset-x-0 top-0 rounded-full"
          style={{ height: fill }}
        />
        <span
          className="bg-primary ring-primary/20 absolute left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_6px_rgba(37,99,235,0.12)] ring-4"
          style={{ top: fill }}
        />
      </div>

      <ol className="relative space-y-16 md:space-y-24">
        {items.map((item, i) => {
          const imageFirst = i % 2 === 1;
          const isReached = i < reached;
          return (
            <li
              key={item.title}
              className="relative grid items-center gap-6 pl-12 md:grid-cols-2 md:gap-24 md:pl-0"
            >
              {/* Step dot on the rail; lights up once the fill passes it. */}
              <span
                ref={(el) => {
                  dotRefs.current[i] = el;
                }}
                aria-hidden="true"
                className={cn(
                  'absolute top-2 left-[15px] grid size-8 -translate-x-1/2 place-items-center rounded-full border-2 transition-colors duration-300 md:top-1/2 md:left-1/2 md:-translate-y-1/2 [&_svg]:size-4',
                  isReached
                    ? 'border-primary bg-primary text-white'
                    : 'border-line-strong bg-surface text-fg-muted',
                )}
              >
                {item.icon}
              </span>

              {/* Copy */}
              <div className={cn(imageFirst ? 'md:order-2' : 'md:order-1')}>
                <span
                  className={cn(
                    'text-sm font-semibold tracking-wide uppercase transition-colors duration-300',
                    isReached ? 'text-primary' : 'text-fg-muted',
                  )}
                >
                  {item.date}
                </span>
                <h3 className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">
                  {item.title}
                </h3>
                <p className="text-fg-muted mt-2 text-base leading-relaxed">{item.description}</p>
              </div>

              {/* Illustration — compact, on the opposite side of the copy. */}
              <div
                className={cn(
                  'w-full max-w-sm',
                  imageFirst ? 'md:order-1 md:justify-self-end' : 'md:order-2',
                )}
              >
                <div
                  className={cn(
                    'bg-subtle ring-line aspect-[4/3] overflow-hidden rounded-xl ring-1 transition-all duration-500',
                    isReached ? 'opacity-100 shadow-[0_8px_24px_rgba(15,23,42,0.1)]' : 'opacity-70',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote stock photo */}
                  <img
                    src={item.image}
                    alt={item.imageAlt ?? ''}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    className="size-full object-cover"
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
