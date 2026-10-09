'use client';

import { ArrowRight, ChevronDown, Handshake } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ProviderAvatar } from '@/components/marketplace/provider-avatar';
import { NEEDS } from '@/content/needs';
import { formatRupiah } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  MAIN_NAV,
  MORE_LINKS,
  SPEED_LINKS,
  TECHNOLOGY_LINKS,
  type NavItem,
  type NavMenu,
} from './nav-config';
import type { NavData } from './nav-data';

function isActive(pathname: string, item: NavItem) {
  if (item.href === '/') return pathname === '/';
  return [item.href, ...(item.match ?? [])].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const itemClass = (active: boolean) =>
  cn(
    'relative flex h-full items-center gap-1 px-2 text-sm font-medium whitespace-nowrap transition-colors xl:px-3',
    active ? 'text-primary' : 'text-fg-secondary hover:text-fg',
    active &&
      'after:bg-primary after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 xl:after:inset-x-3',
  );

/**
 * Desktop main navigation. "Paket" opens a full-width mega menu, "Provider" and "Lainnya"
 * open small dropdowns. Menus open on hover (pointer) or click, close on Escape, outside
 * click, leaving, or following a link.
 */
export function DesktopNav({ data }: { data: NavData }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<NavMenu | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => setOpen(null), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      navRef.current?.querySelector<HTMLElement>(`[data-menu-button="${open}"]`)?.focus();
      setOpen(null);
    };
    const onPointer = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  const hoverOpen = (menu: NavMenu) => {
    clearTimeout(closeTimer.current);
    setOpen(menu);
  };
  const hoverClose = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 150);
  };
  // Following any link inside a panel closes it (also covers same-page links).
  const closeOnLink = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest('a')) setOpen(null);
  };

  return (
    <nav ref={navRef} aria-label="Navigasi utama" className="mt-1 hidden lg:block">
      <ul className="-mx-2 flex h-10 items-center xl:-mx-3">
        {MAIN_NAV.map((item) => {
          const active = isActive(pathname, item);
          if (!item.menu) {
            return (
              <li key={item.href} className="h-full">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={itemClass(active)}
                >
                  {item.label}
                </Link>
              </li>
            );
          }

          const menu = item.menu;
          const isOpen = open === menu;
          const panelId = `nav-menu-${menu}`;
          return (
            <li
              key={item.href}
              // The mega menu anchors to the header (full width); small menus to their item.
              className={cn('h-full', menu !== 'packages' && 'relative')}
              onPointerEnter={(e) => e.pointerType === 'mouse' && hoverOpen(menu)}
              onPointerLeave={(e) => e.pointerType === 'mouse' && hoverClose()}
            >
              <button
                type="button"
                data-menu-button={menu}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : menu)}
                className={cn(
                  itemClass(active),
                  'focus-visible:ring-primary/40 cursor-pointer rounded-sm outline-none focus-visible:ring-2',
                  isOpen && 'text-fg',
                )}
              >
                {item.label}
                <ChevronDown
                  aria-hidden="true"
                  className={cn('size-4 transition-transform', isOpen && 'rotate-180')}
                />
              </button>

              <div
                id={panelId}
                hidden={!isOpen}
                onClick={closeOnLink}
                className={cn(
                  'z-40',
                  menu === 'packages'
                    ? 'border-line bg-surface shadow-pop absolute inset-x-0 top-full border-t'
                    : 'border-line bg-surface shadow-pop absolute top-full left-0 mt-1 rounded-lg border',
                )}
              >
                {menu === 'packages' && <PackagesMenu data={data} />}
                {menu === 'providers' && <ProvidersMenu data={data} />}
                {menu === 'more' && <MoreMenu pathname={pathname} />}
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MenuHeading({ children }: { children: string }) {
  return (
    <p className="text-fg-muted mb-2 text-xs font-semibold tracking-wide uppercase">{children}</p>
  );
}

function PackagesMenu({ data }: { data: NavData }) {
  return (
    <div className="container-header grid grid-cols-[220px_1fr] gap-8 py-6">
      <div className="border-line space-y-6 border-r pr-6">
        <div>
          <MenuHeading>Kecepatan</MenuHeading>
          <ul className="space-y-0.5">
            {SPEED_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-fg-secondary hover:bg-subtle hover:text-primary block rounded-md px-2 py-1.5 text-sm"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <MenuHeading>Teknologi</MenuHeading>
          <ul className="space-y-0.5">
            {TECHNOLOGY_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-fg-secondary hover:bg-subtle hover:text-primary block rounded-md px-2 py-1.5 text-sm"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <MenuHeading>Berdasarkan kebutuhan</MenuHeading>
          <Link
            href="/packages"
            className="text-primary flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Lihat semua paket <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <ul className="mt-1 grid grid-cols-4 gap-5">
          {NEEDS.map((n) => {
            const price = data.needPrices[n.key] ?? null;
            return (
              <li key={n.key}>
                <Link href={n.href} className="group block">
                  <span className="bg-subtle block aspect-[16/10] overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element -- remote stock photo */}
                    <img
                      src={n.image}
                      alt={n.imageAlt}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span className="group-hover:text-primary mt-3 block font-semibold">
                    {n.title}
                  </span>
                  <span className="text-fg-muted mt-0.5 block text-sm">
                    {price === null ? (
                      'Belum ada paket'
                    ) : (
                      <>
                        Mulai dari{' '}
                        <strong className="text-fg font-semibold">{formatRupiah(price)}</strong> /
                        bulan
                      </>
                    )}
                  </span>
                  <span className="text-fg-muted mt-1 block text-[13px] leading-snug">
                    {n.body}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ProvidersMenu({ data }: { data: NavData }) {
  return (
    <div className="w-80 p-2">
      <MenuHeading>Provider terverifikasi</MenuHeading>
      {data.providers.length === 0 ? (
        <p className="text-fg-muted px-2 py-3 text-sm">Belum ada provider terverifikasi.</p>
      ) : (
        <ul className="max-h-80 overflow-y-auto">
          {data.providers.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/provider/${p.slug}`}
                className="hover:bg-subtle flex items-center gap-3 rounded-md px-2 py-2"
              >
                <ProviderAvatar name={p.name} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">{p.name}</span>
                  <span className="text-fg-muted block text-xs">
                    {p.packageCount} paket
                    {p.startingPrice !== null && ` · mulai ${formatRupiah(p.startingPrice)}`}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="border-line mt-2 space-y-0.5 border-t pt-2">
        <Link
          href="/provider"
          className="text-primary hover:bg-subtle flex items-center justify-between rounded-md px-2 py-2 text-sm font-semibold"
        >
          Semua provider <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
        <Link
          href="/mitra"
          className="text-fg-secondary hover:bg-subtle flex items-center gap-2 rounded-md px-2 py-2 text-sm"
        >
          <Handshake className="size-4" aria-hidden="true" /> Jadi Mitra Provider
        </Link>
      </div>
    </div>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  return (
    <ul className="w-72 p-2">
      {MORE_LINKS.map((l) => (
        <li key={l.href}>
          <Link
            href={l.href}
            aria-current={pathname === l.href ? 'page' : undefined}
            className="hover:bg-subtle aria-[current=page]:text-primary block rounded-md px-3 py-2"
          >
            <span className="block text-sm font-semibold">{l.label}</span>
            <span className="text-fg-muted block text-xs">{l.body}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
