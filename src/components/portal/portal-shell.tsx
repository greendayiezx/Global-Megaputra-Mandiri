import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/brand/logo';
import {
  PortalMobileMenu,
  PortalNav,
  PortalNotifications,
  PortalSearch,
  PortalUserMenu,
  type PortalNavItem,
} from './portal-nav';

export interface PortalMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

function Brand({ area }: { area: string }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="GMM — Beranda">
      <LogoMark className="size-10 rounded-none bg-transparent mix-blend-multiply" />
      <span className="leading-tight">
        <span className="text-navy block text-[17px] font-bold">GMM</span>
        <span className="text-fg-muted block text-[11px] font-medium">{area}</span>
      </span>
    </Link>
  );
}

/**
 * Work-portal layout for providers and platform staff: its own sidebar and top bar, no
 * marketplace header/footer (those are hidden for portal routes by SiteChrome).
 */
export function PortalShell({
  area,
  user,
  nav,
  children,
}: {
  area: string;
  user: { name: string; role: string };
  nav: readonly PortalMenuItem[];
  children: ReactNode;
}) {
  const items: PortalNavItem[] = nav.map(({ href, label, icon: Icon }) => ({
    href,
    label,
    icon: <Icon aria-hidden="true" strokeWidth={1.75} />,
  }));
  return (
    <div className="bg-canvas min-h-dvh lg:grid lg:grid-cols-[256px_minmax(0,1fr)]">
      <aside className="border-line bg-surface sticky top-0 hidden h-dvh flex-col border-r px-4 py-5 lg:flex">
        <Brand area={area} />
        <div className="mt-8 flex-1 overflow-y-auto">
          <PortalNav items={items} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="border-line bg-surface/95 sticky top-0 z-30 border-b backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <PortalMobileMenu items={items} header={<Brand area={area} />} />
            <div className="lg:hidden">
              <Brand area={area} />
            </div>
            <PortalSearch items={items} />
            <div className="ml-auto flex items-center gap-1">
              <PortalNotifications />
              <PortalUserMenu name={user.name} role={user.role} />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
