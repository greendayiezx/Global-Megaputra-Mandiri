import { LifeBuoy, LogOut, Menu, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { CompareHeaderLink } from '@/components/compare/compare-controls';
import type { Session } from '@/lib/auth/session';
import { logoutAction } from '@/modules/auth/api/actions';
import { isPlatformStaff, isProviderMember } from '@/modules/auth/domain/rbac';
import { MAIN_NAV } from './nav-config';
import { DesktopNav } from './nav-links';

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

export function SiteHeader({ session }: { session: Session | null }) {
  const home = session ? homeFor(session) : null;

  return (
    <header className="bg-surface sticky top-0 z-30">
      {/* Utility bar */}
      <div className="bg-navy hidden text-[13px] text-white/80 md:block">
        <div className="container-page flex h-9 items-center justify-between">
          <p>Selamat datang di Global Megaputra Mandiri</p>
          <ul className="flex items-center divide-x divide-white/20">
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
            {session ? (
              <>
                <li className="px-3">
                  <Link href={home!.href} className="font-medium text-white hover:underline">
                    {session.user.fullName}
                  </Link>
                </li>
                <li className="pl-3">
                  <form action={logoutAction}>
                    <button type="submit" className="hover:text-white">
                      Keluar
                    </button>
                  </form>
                </li>
              </>
            ) : (
              <>
                <li className="px-3">
                  <Link href="/login" className="hover:text-white">
                    Masuk
                  </Link>
                </li>
                <li className="pl-3">
                  <Link href="/register" className="font-medium text-white hover:underline">
                    Daftar
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-line border-b lg:border-b-0">
        <div className="container-page flex h-16 items-center gap-4 lg:h-[72px] lg:gap-8">
          <Link href="/" aria-label="GMM — Beranda" className="shrink-0">
            <Logo />
          </Link>
          <SearchForm id="header-search" className="hidden flex-1 md:block lg:max-w-2xl" />

          <div className="ml-auto flex items-center gap-1">
            <CompareHeaderLink />
            <Link
              href={home?.href ?? '/login'}
              className="text-fg-secondary hover:bg-subtle hover:text-fg hidden flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 sm:flex"
            >
              <UserRound className="size-5" aria-hidden="true" />
              <span className="text-[11px] font-medium">{session ? 'Akun' : 'Masuk'}</span>
            </Link>

            {/* Mobile / tablet menu (no-JS) */}
            <details className="group relative lg:hidden">
              <summary
                className="text-fg-secondary hover:bg-subtle flex cursor-pointer list-none flex-col items-center gap-0.5 rounded-md px-2.5 py-1.5 [&::-webkit-details-marker]:hidden"
                aria-label="Menu"
              >
                <Menu className="size-5" aria-hidden="true" />
                <span className="text-[11px] font-medium">Menu</span>
              </summary>
              <div className="border-line bg-surface shadow-pop absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-lg border p-3">
                <SearchForm id="mobile-search" className="mb-3 md:hidden" />
                <ul className="space-y-0.5">
                  {MAIN_NAV.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="hover:bg-subtle block rounded-md px-3 py-2.5 text-[15px] font-medium"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="border-line mt-2 border-t pt-2">
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
      </div>

      <DesktopNav />
      <div className="border-line hidden border-b lg:block" />
    </header>
  );
}
