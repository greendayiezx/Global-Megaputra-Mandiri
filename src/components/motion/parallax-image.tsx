'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Full-bleed background photo that drifts slower than the page while its section scrolls
 * past (a gentle parallax). Static for visitors who prefer reduced motion.
 */
export function ParallaxImage({
  src,
  alt = '',
  strength = 0.12,
  className,
  imageClassName,
  priority,
}: {
  src: string;
  alt?: string;
  /** Fraction of the section height the photo travels across the whole pass. */
  strength?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const w = wrap.current;
    const i = inner.current;
    if (!w || !i || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = w.getBoundingClientRect();
      // -1 when the section enters at the bottom, +1 when it leaves at the top.
      const progress = ((window.innerHeight - r.top) / (window.innerHeight + r.height)) * 2 - 1;
      const clamped = Math.max(-1, Math.min(1, progress));
      i.style.transform = `translate3d(0, ${(clamped * strength * r.height) / 2}px, 0) scale(${1 + strength})`;
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
  }, [strength]);

  return (
    <div
      ref={wrap}
      aria-hidden={alt ? undefined : true}
      className={cn('absolute inset-0 -z-20 overflow-hidden', className)}
    >
      <div ref={inner} className="absolute inset-0 will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className={cn('object-cover', imageClassName)}
        />
      </div>
    </div>
  );
}
