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

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
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
