'use client';

import { useEffect, useRef, useState } from 'react';
import { useScrolledIntoView } from './use-scrolled-into-view';

/**
 * A real number that counts up from zero when it first scrolls into view.
 * The final value is server-rendered, so it is correct before (or without) JavaScript, and a
 * visitor who jumps past it still ends on the real value — a counter must never stick at 0.
 */
export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);
  const [armed, setArmed] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already visible: keep it
    setShown(0);
    setArmed(true);
    return () => cancelAnimationFrame(frame.current);
  }, [value]);

  useScrolledIntoView(
    ref,
    () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        setShown(Math.round(value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    },
    { enabled: armed },
  );

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toLocaleString('id-ID')}
    </span>
  );
}
