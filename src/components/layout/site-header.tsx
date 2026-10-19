import {
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  Handshake,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { CompareHeaderLink } from '@/components/compare/compare-controls';
import type { Session } from '@/lib/auth/session';
import { isPortalPath, PORTAL_ENTER } from '@/lib/portal-paths';
import { logoutAction } from '@/modules/auth/api/actions';
import { isPlatformStaff, isProviderMember } from '@/modules/auth/domain/rbac';
import { NEEDS } from '@/content/needs';
import { DesktopNav } from './desktop-nav';
import { DismissMenus } from './dismiss-menus';
import { HeaderShell } from './header-shell';
import { MAIN_NAV, MORE_LINKS, type NavMenu } from './nav-config';
import { getNavData } from './nav-data';

function homeFor(session: Session) {
  if (isPlatformStaff(session.actor)) return { href: '/admin', label: 'Portal Admin' };
  if (isProviderMember(session.actor))
    return { href: '/provider-dashboard', label: 'Portal Provider' };
  return { href: '/dashboard', label: 'Dashboard' };
}

function SearchForm({ id, className }: { id: string; className?: string }) {
  return (
    <form action="/packages" method="get" role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Cari provider, paket, atau lokasi
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="text-fg-muted pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2"
        />
        <input
          id={id}
          name="q"
          type="search"
          placeholder="Cari provider, paket, atau lokasi..."
          className="border-line-strong bg-canvas placeholder:text-fg-muted/90 focus:border-primary focus:bg-surface focus:ring-primary/15 h-11 w-full rounded-md border pr-24 pl-10 text-[15px] focus:ring-3 focus:outline-none"
        />
        <button
          type="submit"
          className="bg-primary hover:bg-primary-hover absolute top-1 right-1 bottom-1 rounded-sm px-4 text-sm font-semibold text-white"
        >
          Cari
        </button>
      </div>
    </form>
  );
}

/** Second-level links shown under each dropdown item in the mobile menu. */
const MOBILE_SUBLINKS: Record<NavMenu, readonly { href: string; label: string }[]> = {
  packages: [
    ...NEEDS.map((n) => ({ href: n.href, label: n.title })),
    { href: '/packages', label: 'Semua paket' },
  ],
  providers: [
    { href: '/provider', label: 'Semua provider' },
    { href: '/mitra', label: 'Jadi Mitra Provider' },
  ],
  more: MORE_LINKS,
};

export async function SiteHeader({ session }: { session: Session | null }) {
  const home = session ? homeFor(session) : null;
  const navData = await getNavData();

  return (
    <HeaderShell>
      <DismissMenus scope=".site-header" />
      {/* Main bar */}
      <div>
        <div className="container-header flex h-16 items-center gap-4 lg:h-auto lg:gap-6 lg:py-2 xl:gap-8">
          <Link href="/" aria-label="GMM — Beranda" className="shrink-0">
            <Logo inHeader />
          </Link>
          {/* Search with the main navigation directly beneath it */}
          <div className="hidden min-w-0 flex-1 md:block lg:max-w-3xl">
            <SearchForm id="header-search" className="lg:max-w-2xl" />
            <DesktopNav data={navData} />
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* Language & currency (only Indonesian / IDR for now) */}
            <details className="group relative hidden md:block lg:hidden xl:block">
              <summary
                className="group/lang text-fg-secondary hover:bg-subtle hover:text-fg overlay:text-white overlay:hover:bg-white/10 overlay:hover:text-white flex cursor-pointer list-none flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 transition-colors [&::-webkit-details-marker]:hidden"
                aria-label="Bahasa dan mata uang"
              >
                <Globe
                  className="size-5 motion-safe:transition-transform motion-safe:duration-500 group-hover/lang:motion-safe:rotate-[20deg]"
                  aria-hidden="true"
                />
                <span className="flex items-center gap-0.5 text-[11px] font-medium">
                  ID | IDR
                  <ChevronDown
                    className="size-3 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </span>
              </summary>
              <ul className="border-line bg-surface/95 text-fg animate-select-in absolute right-0 z-40 mt-2 w-56 origin-top-right rounded-xl border p-1.5 text-sm shadow-[0_12px_32px_-4px_rgba(15,23,42,0.16),0_2px_6px_rgba(15,23,42,0.06)] backdrop-blur-md">
                <li className="bg-primary-soft/60 text-primary flex items-center justify-between rounded-lg px-3 py-2.5 font-semibold">
                  Bahasa Indonesia · IDR
                  <span className="bg-primary grid size-5 place-items-center rounded-full text-white">
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                </li>
                <li className="text-fg-muted flex items-center justify-between px-3 py-2.5">
                  English <span className="text-[11px]">Segera hadir</span>
                </li>
              </ul>
            </details>
            <CompareHeaderLink />
            {session ? (
              <details className="group relative hidden sm:block">
                <summary className="group/acct text-fg-secondary hover:bg-subtle hover:text-fg overlay:text-white overlay:hover:bg-white/10 overlay:hover:text-white flex cursor-pointer list-none flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 [&::-webkit-details-marker]:hidden">
                  <UserRound
                    className="group-hover/acct:motion-safe:animate-nav-wave size-5"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-medium">Akun</span>
                </summary>
                <div className="border-line bg-surface/95 animate-select-in absolute right-0 z-40 mt-2 w-60 origin-top-right rounded-xl border p-1.5 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.16),0_2px_6px_rgba(15,23,42,0.06)] backdrop-blur-md">
                  <p className="border-line text-fg-muted mb-1 truncate border-b px-3 pt-1.5 pb-2.5 text-xs">
                    {session.user.fullName}
                  </p>
                  <Link
                    href={home!.href}
                    transitionTypes={isPortalPath(home!.href) ? PORTAL_ENTER : undefined}
                    className="hover:bg-primary-soft/70 hover:text-primary block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                  >
                    {home!.label}
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="hover:bg-danger-soft hover:text-danger-fg flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors"
                    >
                      <LogOut className="size-4" aria-hidden="true" /> Keluar
                    </button>
                  </form>
                </div>
              </details>
            ) : (
              <Link
                href="/login"
                className="group/acct text-fg-secondary hover:bg-subtle hover:text-fg overlay:text-white overlay:hover:bg-white/10 overlay:hover:text-white hidden flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 sm:flex"
              >
                <UserRound
                  className="group-hover/acct:motion-safe:animate-nav-wave size-5"
                  aria-hidden="true"
                />
                <span className="text-[11px] font-medium">Masuk</span>
              </Link>
            )}

            {/* Jadi Mitra: same icon-over-label shape as the controls beside it, set apart by a
                soft blue fill (a quiet white tint over dark photos). */}
            <Link
              href="/mitra"
              aria-label="Jadi Mitra — untuk provider internet"
              className="group/mitra bg-primary-soft text-primary hover:bg-primary overlay:bg-white/10 overlay:text-white overlay:hover:bg-white/20 ml-1 hidden flex-col items-center gap-0.5 rounded-md px-3 py-1.5 transition-colors duration-200 hover:text-white sm:flex"
            >
              <Handshake
                className="size-5 group-hover/mitra:motion-safe:animate-[handshake_600ms_ease-in-out]"
                aria-hidden="true"
              />
              <span className="text-[11px] font-semibold whitespace-nowrap">Jadi Mitra</span>
            </Link>

            {/* Mobile / tablet menu (no-JS). Not `relative`: the panel hangs from the sticky header,
                edge to edge. */}
            <details className="group lg:hidden">
              <summary
                className="text-fg-secondary hover:bg-subtle hover:text-fg overlay:text-white overlay:hover:bg-white/10 overlay:hover:text-white flex cursor-pointer list-none flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 [&::-webkit-details-marker]:hidden"
                aria-label="Menu"
              >
                <span className="relative size-5">
                  <Menu
                    className="absolute inset-0 size-5 transition-[opacity,rotate] duration-200 group-open:rotate-90 group-open:opacity-0"
                    aria-hidden="true"
                  />
                  <X
                    className="absolute inset-0 size-5 -rotate-90 opacity-0 transition-[opacity,rotate] duration-200 group-open:rotate-0 group-open:opacity-100"
                    aria-hidden="true"
                  />
                </span>
                <span className="text-[11px] font-medium">Menu</span>
              </summary>
              <div className="menu-panel border-line bg-surface absolute inset-x-0 top-full max-h-[calc(100dvh-var(--site-header-h))] overflow-y-auto overscroll-contain border-t pt-3 pb-4 shadow-[0_16px_32px_-12px_rgb(15_23_42/0.25)]">
                <div className="container-header">
                  <SearchForm id="mobile-search" className="mb-3 md:hidden" />
                  <ul className="space-y-0.5">
                    {MAIN_NAV.map((item) => (
                      <li key={item.href}>
                        {item.menu ? (
                          <details className="group/sub">
                            <summary className="hover:bg-subtle flex cursor-pointer list-none items-center justify-between rounded-md px-3 py-2.5 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
                              {item.label}
                              <ChevronDown
                                className="text-fg-muted size-4 transition-transform group-open/sub:rotate-180"
                                aria-hidden="true"
                              />
                            </summary>
                            <ul className="menu-sub border-line mb-1 ml-3 border-l pl-2">
                              {MOBILE_SUBLINKS[item.menu].map((sub) => (
                                <li key={sub.href}>
                                  <Link
                                    href={sub.href}
                                    className="text-fg-secondary hover:bg-subtle block rounded-md px-3 py-2 text-sm"
                                  >
                                    {sub.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : (
                          <Link
                            href={item.href}
                            className="hover:bg-subtle block rounded-md px-3 py-2.5 text-[15px] font-medium"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                  <div className="border-line mt-2 border-t pt-2">
                    <Link
                      href="/mitra"
                      className="bg-primary-soft text-primary hover:bg-primary-soft/70 mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5"
                    >
                      <Handshake className="size-5" aria-hidden="true" />
                      <span className="flex-1 leading-tight">
                        <span className="block text-sm font-semibold">Jadi Mitra</span>
                        <span className="text-fg-muted block text-xs">Untuk provider internet</span>
                      </span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                    {session ? (
                      <form action={logoutAction}>
                        <button
                          type="submit"
                          className="hover:bg-subtle flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm"
                        >
                          <LogOut className="size-4" aria-hidden="true" /> Keluar
                        </button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 px-1 pt-2">
                        <Link
                          href="/login"
                          className="border-line-strong rounded-md border py-2 text-center text-sm font-semibold"
                        >
                          Masuk
                        </Link>
                        <Link
                          href="/register"
                          className="bg-primary rounded-md py-2 text-center text-sm font-semibold text-white"
                        >
                          Daftar
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}
