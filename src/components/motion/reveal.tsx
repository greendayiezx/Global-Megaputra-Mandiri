'use client';

import { useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useScrolledIntoView } from './use-scrolled-into-view';

/**
 * Fades and lifts its content in the first time it scrolls into view.
 *
 * The content is server-rendered visible; only elements still below the fold at mount are
 * hidden (and then revealed), so nothing flashes, nothing stays hidden without JavaScript,
 * and visitors who prefer reduced motion simply see the content.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Milliseconds; use small steps (e.g. 80 × index) to stagger a row of cards. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return; // already in view
    el.dataset.reveal = 'hidden';
    setArmed(true);
  }, []);

  useScrolledIntoView(
    ref,
    () => {
      if (ref.current) ref.current.dataset.reveal = 'shown';
    },
    { enabled: armed },
  );

  return (
    <Tag
      ref={ref}
      className={cn('reveal', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
