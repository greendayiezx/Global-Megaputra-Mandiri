'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function DashboardNav({
  items,
}: {
  items: { href: string; label: string; icon: ReactNode }[];
}) {
  const pathname = usePathname();
  const root = items[0]?.href;
  return (
    <nav
      aria-label="Navigasi dashboard"
      className="-mx-4 mt-3 overflow-x-auto px-4 lg:mx-0 lg:px-0"
    >
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon }) => {
          const active =
            href === root
              ? pathname === href
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'bg-primary-soft text-primary-hover'
                    : 'text-fg-secondary hover:bg-subtle hover:text-fg',
                )}
              >
                {icon}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
