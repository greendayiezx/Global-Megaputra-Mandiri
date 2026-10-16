'use client';

import { Bell, ChevronDown, ExternalLink, LogOut, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/modules/auth/api/actions';
import { PORTAL_EXIT } from '@/lib/portal-paths';

export interface PortalNavItem {
  href: string;
  label: string;
  /** Rendered icon element (elements can cross from server to client; components can't). */
  icon: ReactNode;
}

function useActive(items: readonly PortalNavItem[]) {
  const pathname = usePathname();
  const root = items[0]?.href;
  return (href: string) =>
    href === root ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/** Sidebar menu list (desktop sidebar and mobile drawer). */
export function PortalNav({
  items,
  onNavigate,
}: {
  items: readonly PortalNavItem[];
  onNavigate?: () => void;
}) {
  const isActive = useActive(items);
  return (
    <nav aria-label="Menu portal">
      <ul className="space-y-1">
        {items.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors [&_svg]:size-[18px] [&_svg]:shrink-0',
                  active
                    ? 'bg-primary-soft text-primary'
                    : 'text-fg-secondary hover:bg-subtle hover:text-fg',
                )}
              >
                <span className={active ? 'text-primary' : 'text-fg-muted'}>{icon}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Hamburger + slide-in drawer holding the sidebar on small screens. */
export function PortalMobileMenu({
  items,
  header,
}: {
  items: readonly PortalNavItem[];
  header: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        className="text-fg-secondary hover:bg-subtle grid size-10 place-items-center rounded-lg"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>
      {/* Portaled to <body> so the overlay is never trapped by the header's stacking context. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="bg-navy/40 absolute inset-0" onClick={() => setOpen(false)} />
            <div className="bg-surface absolute inset-y-0 left-0 flex w-72 flex-col p-4 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                {header}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup menu"
                  className="text-fg-muted hover:bg-subtle grid size-9 place-items-center rounded-lg"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <PortalNav items={items} onNavigate={() => setOpen(false)} />
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

/** Quick jump: type part of a menu name and press Enter. */
export function PortalSearch({ items }: { items: readonly PortalNavItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [miss, setMiss] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim().toLowerCase();
    const hit = items.find((i) => i.label.toLowerCase().includes(term));
    if (term && hit) {
      setQ('');
      router.push(hit.href);
    } else setMiss(Boolean(term));
  };
  return (
    <form onSubmit={submit} role="search" className="relative hidden w-full max-w-md md:block">
      <label htmlFor="portal-search" className="sr-only">
        Cari menu
      </label>
      <Search
        aria-hidden="true"
        className="text-fg-muted pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
      />
      <input
        id="portal-search"
        list="portal-search-menu"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setMiss(false);
        }}
        placeholder="Cari menu, mis. Pesanan…"
        className={cn(
          'border-line bg-canvas focus:border-primary focus:bg-surface focus:ring-primary/15 h-10 w-full rounded-lg border pr-3 pl-10 text-sm focus:ring-3 focus:outline-none',
          miss && 'border-danger',
        )}
      />
      <datalist id="portal-search-menu">
        {items.map((i) => (
          <option key={i.href} value={i.label} />
        ))}
      </datalist>
    </form>
  );
}

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

/** Notification bell. The notifications module is Phase 2, so it says so honestly. */
export function PortalNotifications() {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Notifikasi"
        className="text-fg-secondary hover:bg-subtle grid size-10 place-items-center rounded-lg"
      >
        <Bell className="size-5" aria-hidden="true" />
      </button>
      {open && (
        <div className="border-line bg-surface shadow-pop animate-select-in absolute right-0 z-40 mt-2 w-72 rounded-xl border p-4">
          <p className="text-sm font-semibold">Notifikasi</p>
          <p className="text-fg-muted mt-2 text-sm">Belum ada notifikasi.</p>
          <p className="text-fg-muted mt-1 text-xs">Modul notifikasi aktif di Fase 2.</p>
        </div>
      )}
    </div>
  );
}

/** Account chip with a small menu (view site, sign out). */
export function PortalUserMenu({ name, role }: { name: string; role: string }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="hover:bg-subtle flex items-center gap-2.5 rounded-lg py-1.5 pr-2 pl-1.5"
      >
        <span className="bg-primary-soft text-primary grid size-9 place-items-center rounded-full text-sm font-semibold">
          {initials}
        </span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-40 truncate text-sm font-semibold">{name}</span>
          <span className="text-fg-muted block text-xs">{role}</span>
        </span>
        <ChevronDown className="text-fg-muted size-4" aria-hidden="true" />
      </button>
      {open && (
        <div className="border-line bg-surface shadow-pop animate-select-in absolute right-0 z-40 mt-2 w-56 rounded-xl border p-1.5">
          <Link
            href="/"
            transitionTypes={PORTAL_EXIT}
            className="hover:bg-subtle flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
          >
            <ExternalLink className="size-4" aria-hidden="true" /> Lihat website
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="hover:bg-subtle text-danger-fg flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm"
            >
              <LogOut className="size-4" aria-hidden="true" /> Keluar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
