'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

/** Pages that open with a full-bleed photo: the header floats over it until you scroll. */
const OVERLAY_ROUTES = ['/', '/about', '/mitra', '/coverage', '/konsultasi'];

/**
 * The site header's outer element. On photo-led pages it starts transparent with white
 * text over the photo and turns solid white once the page scrolls (or a menu opens — see
 * `.site-header` in globals.css). It also publishes its height as `--site-header-h` so the
 * photo heroes can sit underneath it.
 */
export function HeaderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overlayRoute = OVERLAY_ROUTES.includes(pathname);
  const ref = useRef<HTMLElement>(null);
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const publish = () =>
      document.documentElement.style.setProperty('--site-header-h', `${el.offsetHeight}px`);
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header
      ref={ref}
      data-overlay={overlayRoute && atTop ? '' : undefined}
      className={overlayRoute ? 'site-header site-header--float' : 'site-header'}
    >
      {children}
    </header>
  );
}
