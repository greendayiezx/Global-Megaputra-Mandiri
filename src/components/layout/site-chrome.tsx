'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { isPortalPath } from '@/lib/portal-paths';

/** Standalone auth screens, without the marketplace header, footer and bars. */
const STANDALONE = ['/login', '/register'];

export function isOutsideMarketplaceChrome(pathname: string) {
  return STANDALONE.includes(pathname) || isPortalPath(pathname);
}

/** Renders its (server-rendered) children everywhere except standalone screens and portals. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return isOutsideMarketplaceChrome(pathname) ? null : <>{children}</>;
}
