'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/** Routes rendered as standalone screens, without the marketplace header, footer and bars. */
const STANDALONE = ['/login', '/register'];

/** Renders its (server-rendered) children everywhere except on standalone auth screens. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return STANDALONE.includes(pathname) ? null : <>{children}</>;
}
