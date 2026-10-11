'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Standalone auth screens, without the marketplace header, footer and bars. */
const STANDALONE = ['/login', '/register'];
/** Work portals render their own shell (sidebar + top bar) instead of the marketplace chrome. */
const PORTAL_PREFIXES = ['/admin', '/provider-dashboard'];

export function isOutsideMarketplaceChrome(pathname: string) {
  return (
    STANDALONE.includes(pathname) ||
    PORTAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

/** Renders its (server-rendered) children everywhere except standalone screens and portals. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isOutsideMarketplaceChrome(pathname) ? null : <>{children}</>;
}
