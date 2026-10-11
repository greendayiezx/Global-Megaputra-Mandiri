'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Phase = 'idle' | 'loading' | 'done';

/** Delay before showing the bar, so instant (prefetched) navigations don't flash it. */
const SHOW_DELAY_MS = 120;
/** Safety net: never leave the bar running if a navigation is cancelled. */
const GIVE_UP_MS = 15_000;

/** Same-tab, same-origin link to a different page — the clicks that start a client navigation. */
function navigationTarget(e: MouseEvent): URL | null {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const a = (e.target as Element | null)?.closest?.('a[href]');
  if (!(a instanceof HTMLAnchorElement)) return null;
  if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return null;
  if (url.pathname === location.pathname && url.search === location.search) return null;
  return url;
}

/**
 * Thin brand-blue bar at the top of the viewport while a page change is in flight, so the
 * visitor sees the click registered (e.g. when moving between the public site and a portal,
 * which waits on the server). Finishes when the URL changes.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!navigationTarget(e)) return;
      clearTimers();
      timers.current.push(
        window.setTimeout(() => setPhase('loading'), SHOW_DELAY_MS),
        window.setTimeout(() => setPhase('idle'), GIVE_UP_MS),
      );
    };
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      clearTimers();
    };
  }, []);

  // URL changed: the navigation committed. Complete the bar, then hide it.
  useEffect(() => {
    clearTimers();
    setPhase((p) => (p === 'loading' ? 'done' : 'idle'));
    timers.current.push(window.setTimeout(() => setPhase('idle'), 450));
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5"
      data-phase={phase}
    >
      <div
        className="bg-primary h-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"
        style={{
          width: phase === 'idle' ? '0%' : phase === 'loading' ? '85%' : '100%',
          opacity: phase === 'loading' ? 1 : 0,
          transition:
            phase === 'loading'
              ? 'width 8s cubic-bezier(0.1, 0.7, 0.2, 1), opacity 150ms'
              : phase === 'done'
                ? 'width 200ms ease-out, opacity 200ms ease-out 200ms'
                : 'none',
        }}
      />
    </div>
  );
}
