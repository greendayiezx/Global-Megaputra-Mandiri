'use client';

import {
  GitCompareArrows,
  House,
  LayoutGrid,
  ReceiptText,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MAIN_NAV } from './nav-config';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi utama" className="mt-1 hidden lg:block">
      <ul className="-mx-2 flex h-10 [scrollbar-width:none] items-center overflow-x-auto xl:-mx-3">
        {MAIN_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <li key={item.href} className="h-full">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full items-center px-2 text-sm font-medium whitespace-nowrap transition-colors xl:px-3',
                  active ? 'text-primary' : 'text-fg-secondary hover:text-fg',
                  active &&
                    'after:bg-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 xl:after:inset-x-3',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const BOTTOM: { href: string; label: string; icon: LucideIcon; match: string[] }[] = [
  { href: '/', label: 'Beranda', icon: House, match: ['/'] },
  {
    href: '/provider',
    label: 'Provider',
    icon: LayoutGrid,
    match: ['/provider', '/packages', '/coverage'],
  },
  { href: '/compare', label: 'Bandingkan', icon: GitCompareArrows, match: ['/compare'] },
  { href: '/dashboard/orders', label: 'Pesanan', icon: ReceiptText, match: ['/dashboard/orders'] },
  {
    href: '/dashboard',
    label: 'Akun',
    icon: UserRound,
    match: ['/dashboard', '/login', '/register'],
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const activeHref =
    [...BOTTOM]
      .sort((a, b) => b.href.length - a.href.length)
      .find((i) => i.match.some((m) => isActive(pathname, m)))?.href ?? null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="border-line bg-surface fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {BOTTOM.map(({ href, label, icon: Icon }) => {
          const active = activeHref === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium',
                  active ? 'text-primary' : 'text-fg-muted',
                )}
              >
                <Icon className="size-5" aria-hidden="true" strokeWidth={active ? 2.25 : 1.75} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
