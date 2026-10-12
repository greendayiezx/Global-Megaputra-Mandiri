'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Calls `onEnter` once, the first time the element's top passes `line` (fraction of the
 * viewport height) — including when the visitor jumps straight past it (anchor link, fast
 * fling, restored scroll), which an IntersectionObserver would miss.
 */
export function useScrolledIntoView(
  ref: RefObject<HTMLElement | null>,
  onEnter: () => void,
  { line = 0.92, enabled = true }: { line?: number; enabled?: boolean } = {},
) {
  const cb = useRef(onEnter);
  useEffect(() => {
    cb.current = onEnter;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      if (el.getBoundingClientRect().top < window.innerHeight * line) {
        stop();
        cb.current();
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
    return stop;
  }, [ref, line, enabled]);
}
