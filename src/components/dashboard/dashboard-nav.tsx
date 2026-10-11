'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function DashboardNav({
  items,
  variant = 'plain',
}: {
  items: { href: string; label: string; icon: ReactNode }[];
  variant?: 'plain' | 'card';
}) {
  const pathname = usePathname();
  const root = items[0]?.href;
  const isActive = (href: string) =>
    href === root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  if (variant === 'card') {
    return (
      <nav aria-label="Navigasi dashboard" className="overflow-x-auto p-2">
        <ul className="flex gap-1 lg:flex-col lg:gap-0.5">
          {items.map(({ href, label, icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                    active
                      ? 'bg-primary-soft text-primary lg:before:bg-primary lg:before:absolute lg:before:inset-y-2 lg:before:-left-2 lg:before:w-1 lg:before:rounded-r-full'
                      : 'text-fg-secondary hover:bg-subtle hover:text-fg',
                  )}
                >
                  <span className={cn(active ? 'text-primary' : 'text-fg-muted')}>{icon}</span>
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Navigasi dashboard"
      className="-mx-4 mt-3 overflow-x-auto px-4 lg:mx-0 lg:px-0"
    >
      <ul className="flex gap-1 lg:flex-col">
        {items.map(({ href, label, icon }) => {
          const active = isActive(href);
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
