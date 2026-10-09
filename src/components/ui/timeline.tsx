'use client';

/*
 * Pinned horizontal-scroll timeline. Adapted from a Hyperiux Vault component
 * (https://vault.hyperiux.com): the section pins while its track slides sideways,
 * the axis draws itself, and each step grows its stem and reveals its copy line by line.
 */

import { useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { cn } from '@/lib/utils';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

export interface TimelineItem {
  id: string;
  /** Small label above the title, e.g. "Langkah 01". */
  label: string;
  title: string;
  body: string;
}

export interface TimelineProps {
  items: readonly TimelineItem[];
  title: string;
  /** Caption under the axis, left of the first step. */
  caption?: string;
  imageUrl: string;
  imageAlt: string;
  className?: string;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function Timeline({ items, title, caption, imageUrl, imageAlt, className }: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const splits: SplitText[] = [];
    const ctx = gsap.context(() => {
      // The track slides by exactly its overflow, so the last step ends in view.
      const slide = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });

      gsap.fromTo(
        '[data-tl-axis]',
        { scaleX: reducedMotion ? 1 : 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: reducedMotion
            ? undefined
            : { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
        },
      );

      if (reducedMotion) return;

      gsap.utils.toArray<HTMLElement>('[data-tl-item]').forEach((item) => {
        const stem = item.querySelector('[data-tl-stem]');
        const dot = item.querySelector('[data-tl-dot]');
        const lines = [...item.querySelectorAll<HTMLElement>('[data-tl-text]')].flatMap((el) => {
          const split = new SplitText(el, { type: 'lines', mask: 'lines' });
          splits.push(split);
          return split.lines;
        });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: item,
              containerAnimation: slide,
              start: 'left 90%',
              end: 'left 55%',
              scrub: true,
            },
          })
          .fromTo(stem, { scaleY: 0 }, { scaleY: 1, duration: 0.4 })
          .fromTo(dot, { scale: 0 }, { scale: 1, duration: 0.4 }, '<')
          .fromTo(
            lines,
            { yPercent: 110 },
            { yPercent: 0, duration: 1, stagger: 0.08, ease: 'power2.out' },
            '-=0.2',
          );
      });
    }, section);

    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      splits.forEach((s) => s.revert());
      ctx.revert();
    };
  }, [items, reducedMotion]);

  return (
    <section
      ref={sectionRef}
      className={cn('bg-navy relative h-[320vh] text-white sm:h-[260vh]', className)}
    >
      {/* Sticky viewport, padded to clear the sticky site header. */}
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden pt-16 md:pt-32">
        <div
          ref={trackRef}
          className="flex h-[min(72vh,560px)] w-max items-center gap-[6vw] pr-[24vw] pl-[6vw] will-change-transform sm:h-[min(60vh,520px)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote stock photo, sized by CSS */}
          <img
            src={imageUrl}
            alt={imageAlt}
            draggable={false}
            className="h-[55%] w-[78vw] shrink-0 rounded-2xl object-cover ring-1 ring-white/10 sm:h-full sm:w-[34vw]"
          />

          <div className="relative flex h-full shrink-0">
            {/* Axis */}
            <div className="absolute top-1/2 right-0 left-0 flex -translate-y-1/2 items-center">
              <span className="bg-primary size-2.5 shrink-0 rounded-full" />
              <span data-tl-axis className="bg-primary/70 h-px flex-1 origin-left" />
              <span className="bg-primary size-2.5 shrink-0 rounded-full" />
            </div>

            {/* Heading column */}
            <div className="flex w-[62vw] shrink-0 flex-col justify-between py-2 pr-[4vw] sm:w-[22vw]">
              <h2 className="text-[32px] leading-[1.05] font-bold tracking-tight text-white lg:text-[44px]">
                {title}
              </h2>
              {caption && <p className="text-sm text-slate-400 lg:text-base">{caption}</p>}
            </div>

            {items.map((item, i) => {
              const top = i % 2 === 0;
              return (
                <div
                  key={item.id}
                  data-tl-item
                  className="relative flex h-full w-[70vw] shrink-0 flex-col sm:w-[26vw]"
                >
                  <div
                    className={cn(
                      'relative flex h-1/2 flex-col pl-6',
                      top ? 'justify-start' : 'order-2 justify-end',
                    )}
                  >
                    {/* Stem from the axis to the dot */}
                    <span
                      aria-hidden="true"
                      data-tl-stem
                      className={cn(
                        'bg-primary/70 absolute left-0 w-px',
                        top ? 'top-2 bottom-0 origin-bottom' : 'top-0 bottom-2 origin-top',
                      )}
                    />
                    <span
                      aria-hidden="true"
                      data-tl-dot
                      className={cn(
                        'bg-primary ring-navy absolute left-0 size-3.5 -translate-x-1/2 rounded-full ring-4',
                        top ? 'top-0' : 'bottom-0',
                      )}
                    />
                    <div className={cn('max-w-[30ch] space-y-2', top ? '-mt-1' : '-mb-1')}>
                      <p
                        data-tl-text
                        className="text-[13px] font-semibold tracking-wide text-blue-300 uppercase"
                      >
                        {item.label}
                      </p>
                      <h3
                        data-tl-text
                        className="text-2xl leading-tight font-bold text-white lg:text-[28px]"
                      >
                        {item.title}
                      </h3>
                      <p
                        data-tl-text
                        className="text-[15px] leading-relaxed text-slate-300 lg:text-base"
                      >
                        {item.body}
                      </p>
                    </div>
                  </div>
                  <div className={cn('h-1/2', top ? 'order-2' : 'order-1')} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
