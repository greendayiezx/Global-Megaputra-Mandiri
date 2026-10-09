import {
  Check,
  ChevronDown,
  Globe,
  LifeBuoy,
  LogOut,
  Menu,
  Search,
  TicketPercent,
  UserRound,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { CompareHeaderLink } from '@/components/compare/compare-controls';
import type { Session } from '@/lib/auth/session';
import { logoutAction } from '@/modules/auth/api/actions';
import { isPlatformStaff, isProviderMember } from '@/modules/auth/domain/rbac';
import { NEEDS } from '@/content/needs';
import { DesktopNav } from './desktop-nav';
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
    <header className="bg-surface sticky top-0 z-30">
      {/* Utility bar */}
      <div className="bg-navy hidden text-[13px] text-white/80 md:block">
        <div className="container-header flex h-9 items-center justify-end">
          <ul className="flex items-center divide-x divide-white/20">
            <li className="px-3">
              <Link href="/promo" className="flex items-center gap-1.5 hover:text-white">
                <TicketPercent className="size-4" aria-hidden="true" /> Promo
              </Link>
            </li>
            <li className="px-3">
              <Link href="/faq" className="hover:text-white">
                Bantuan
              </Link>
            </li>
            <li className="px-3">
              <Link href="/mitra" className="hover:text-white">
                Jadi Mitra
              </Link>
            </li>
            <li className="pl-3">
              <details className="group relative">
                <summary className="flex cursor-pointer list-none items-center gap-1 hover:text-white [&::-webkit-details-marker]:hidden">
                  <Globe className="size-4" aria-hidden="true" />
                  <span>ID | IDR</span>
                  <ChevronDown
                    className="size-3.5 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <ul className="border-line bg-surface text-fg shadow-pop absolute right-0 z-40 mt-2 w-48 rounded-md border p-1 text-sm">
                  <li className="flex items-center justify-between rounded-sm px-3 py-2 font-medium">
                    Bahasa Indonesia
                    <Check className="text-primary size-4" aria-hidden="true" />
                  </li>
                  <li className="text-fg-muted flex items-center justify-between px-3 py-2">
                    English <span className="text-[11px]">Segera hadir</span>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-line border-b">
        <div className="container-header">
          <div className="flex h-16 items-center gap-4 lg:h-[72px] lg:gap-6 xl:gap-8">
            <Link href="/" aria-label="GMM — Beranda" className="shrink-0">
              <Logo />
            </Link>
            <SearchForm
              id="header-search"
              className="hidden min-w-0 flex-1 md:block lg:max-w-2xl"
            />

            <div className="ml-auto flex items-center gap-1">
              <CompareHeaderLink />
              {session ? (
                <details className="group relative hidden sm:block">
                  <summary className="group/acct text-fg-secondary hover:bg-subtle hover:text-fg flex cursor-pointer list-none flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 [&::-webkit-details-marker]:hidden">
                    <UserRound
                      className="group-hover/acct:motion-safe:animate-nav-wave size-5"
                      aria-hidden="true"
                    />
                    <span className="text-[11px] font-medium">Akun</span>
                  </summary>
                  <div className="border-line bg-surface shadow-pop absolute right-0 z-40 mt-2 w-56 rounded-lg border p-1.5">
                    <p className="text-fg-muted truncate px-3 py-2 text-xs">
                      {session.user.fullName}
                    </p>
                    <Link
                      href={home!.href}
                      className="hover:bg-subtle block rounded-md px-3 py-2 text-sm font-medium"
                    >
                      {home!.label}
                    </Link>
                    <form action={logoutAction}>
                      <button
                        type="submit"
                        className="hover:bg-subtle flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm"
                      >
                        <LogOut className="size-4" aria-hidden="true" /> Keluar
                      </button>
                    </form>
                  </div>
                </details>
              ) : (
                <Link
                  href="/login"
                  className="group/acct text-fg-secondary hover:bg-subtle hover:text-fg hidden flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 sm:flex"
                >
                  <UserRound
                    className="group-hover/acct:motion-safe:animate-nav-wave size-5"
                    aria-hidden="true"
                  />
                  <span className="text-[11px] font-medium">Masuk</span>
                </Link>
              )}

              {/* Mobile / tablet menu (no-JS) */}
              <details className="group relative lg:hidden">
                <summary
                  className="text-fg-secondary hover:bg-subtle flex cursor-pointer list-none flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 [&::-webkit-details-marker]:hidden"
                  aria-label="Menu"
                >
                  <Menu className="size-5" aria-hidden="true" />
                  <span className="text-[11px] font-medium">Menu</span>
                </summary>
                <div className="border-line bg-surface shadow-pop absolute right-0 mt-2 max-h-[calc(100dvh-6rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border p-3">
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
                            <ul className="border-line mb-1 ml-3 border-l pl-2">
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
                      href="/promo"
                      className="hover:bg-subtle flex items-center gap-2 rounded-md px-3 py-2.5 text-sm"
                    >
                      <TicketPercent className="size-4" aria-hidden="true" /> Promo
                    </Link>
                    <Link
                      href="/faq"
                      className="hover:bg-subtle flex items-center gap-2 rounded-md px-3 py-2.5 text-sm"
                    >
                      <LifeBuoy className="size-4" aria-hidden="true" /> Bantuan
                    </Link>
                    <Link
                      href="/mitra"
                      className="hover:bg-subtle block rounded-md px-3 py-2.5 text-sm"
                    >
                      Jadi Mitra
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
              </details>
            </div>
          </div>
          {/* Main navigation, right-aligned on its own row */}
          <div className="hidden justify-end lg:flex">
            <DesktopNav data={navData} />
          </div>
        </div>
      </div>
    </header>
  );
}
