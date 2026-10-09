'use client';

import { ArrowRight, ChevronDown, Handshake, LayoutGrid, MapPin } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { ProviderAvatar } from '@/components/marketplace/provider-avatar';
import { NEEDS } from '@/content/needs';
import { formatRupiah } from '@/lib/money';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';
import { cn } from '@/lib/utils';
import {
  MAIN_NAV,
  MORE_GROUPS,
  PROVIDER_TECH_LINKS,
  SPEED_LINKS,
  TECHNOLOGY_ILLUSTRATION,
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
 * open dropdowns. Menus open on click only and close on Escape, outside click, a second
 * click, or following a link.
 */
export function DesktopNav({ data }: { data: NavData }) {
  const pathname = usePathname();
  const [open, setOpen] = useState<NavMenu | null>(null);
  const navRef = useRef<HTMLElement>(null);

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
              // Not positioned: every panel anchors to the header and spans its full width.
              className="h-full"
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
                className="border-line bg-surface shadow-pop absolute inset-x-0 top-full z-40 border-t"
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

function SideLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-fg-secondary hover:bg-subtle hover:text-primary flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
    >
      {children}
    </Link>
  );
}

function ProvidersMenu({ data }: { data: NavData }) {
  const featured = data.providers.slice(0, 4);
  return (
    <div className="container-header grid grid-cols-[220px_1fr] gap-8 py-6">
      <div className="border-line space-y-6 border-r pr-6">
        <div>
          <MenuHeading>Teknologi</MenuHeading>
          <ul className="space-y-0.5">
            {PROVIDER_TECH_LINKS.map((l) => (
              <li key={l.href}>
                <SideLink href={l.href}>{l.label}</SideLink>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <MenuHeading>Jelajahi</MenuHeading>
          <ul className="space-y-0.5">
            <li>
              <SideLink href="/coverage">
                <MapPin className="size-4" aria-hidden="true" /> Provider di lokasi Anda
              </SideLink>
            </li>
            <li>
              <SideLink href="/provider">
                <LayoutGrid className="size-4" aria-hidden="true" /> Semua provider
              </SideLink>
            </li>
            <li>
              <SideLink href="/mitra">
                <Handshake className="size-4" aria-hidden="true" /> Jadi Mitra Provider
              </SideLink>
            </li>
          </ul>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <MenuHeading>Provider terverifikasi</MenuHeading>
          <Link
            href="/provider"
            className="text-primary flex items-center gap-1 text-sm font-semibold hover:underline"
          >
            Lihat semua provider <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {featured.length === 0 ? (
          <p className="border-line text-fg-muted mt-1 rounded-lg border border-dashed px-4 py-10 text-center text-sm">
            Belum ada provider terverifikasi.
          </p>
        ) : (
          <ul className="mt-1 grid grid-cols-4 gap-5">
            {featured.map((p) => {
              // Tolerate a stale server payload during dev hot reloads.
              const technologies = p.technologies ?? [];
              const serviceAreas = p.serviceAreas ?? [];
              return (
                <li key={p.slug}>
                  <Link href={`/provider/${p.slug}`} className="group block">
                    <span className="bg-subtle relative block aspect-[16/10] overflow-hidden rounded-lg">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote stock photo */}
                      <img
                        src={TECHNOLOGY_ILLUSTRATION[technologies[0] ?? 'FIBER']}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute bottom-2 left-2 rounded-md bg-white/95 shadow-sm">
                        <ProviderAvatar name={p.name} size="sm" />
                      </span>
                    </span>
                    <span className="group-hover:text-primary mt-3 block font-semibold">
                      {p.name}
                    </span>
                    <span className="text-fg-muted mt-0.5 block text-sm">
                      {p.packageCount} paket
                      {p.startingPrice !== null && (
                        <>
                          {' · mulai '}
                          <strong className="text-fg font-semibold">
                            {formatRupiah(p.startingPrice)}
                          </strong>
                        </>
                      )}
                    </span>
                    <span className="text-fg-muted mt-1 block text-[13px] leading-snug">
                      {technologies.map((t) => TECHNOLOGY_LABEL[t]).join(', ')}
                      {serviceAreas.length > 0 && ` · ${serviceAreas.join(', ')}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-fg-muted mt-4 text-xs">
          Foto ilustrasi teknologi jaringan, bukan milik provider. Hanya provider yang dokumennya
          sudah diverifikasi tim GMM yang tampil.
        </p>
      </div>
    </div>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  return (
    <div className="container-header grid grid-cols-[1fr_1fr_1fr_300px] gap-8 py-6">
      {MORE_GROUPS.map((g) => (
        <div key={g.title}>
          <MenuHeading>{g.title}</MenuHeading>
          <ul className="space-y-1">
            {g.links.map(({ href, label, body, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={pathname === href ? 'page' : undefined}
                  className="group hover:bg-subtle flex items-start gap-3 rounded-lg p-2"
                >
                  <span className="border-primary-border bg-primary-soft text-primary grid size-10 shrink-0 place-items-center rounded-md border">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="group-hover:text-primary group-aria-[current=page]:text-primary block text-sm font-semibold">
                      {label}
                    </span>
                    <span className="text-fg-muted block text-xs leading-snug">{body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Highlight card: decorative SVG only, no photography. */}
      <div className="bg-navy relative overflow-hidden rounded-xl p-5 text-white">
        <svg
          aria-hidden="true"
          viewBox="0 0 200 200"
          className="text-primary absolute -right-10 -bottom-10 size-48 opacity-40"
        >
          <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="55" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="100" cy="100" r="8" fill="currentColor" />
        </svg>
        <span className="bg-primary grid size-10 place-items-center rounded-md">
          <MapPin className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-[17px] leading-snug font-semibold">
          Provider mana yang menjangkau rumah Anda?
        </p>
        <p className="mt-1 text-sm text-slate-300">Cek gratis dalam hitungan detik.</p>
        <Link
          href="/coverage"
          className="bg-primary hover:bg-primary-hover relative mt-4 inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold"
        >
          Cek Ketersediaan <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
