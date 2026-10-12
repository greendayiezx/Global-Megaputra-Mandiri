import { Construction, LayoutGrid, ShieldX, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ButtonLink } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/primitives';
import { DashboardNav } from './dashboard-nav';

export interface DashboardNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function DashboardShell({
  area,
  subtitle,
  nav,
  children,
  variant = 'plain',
  areaIcon: AreaIcon = LayoutGrid,
}: {
  area: string;
  subtitle?: string;
  nav: DashboardNavItem[];
  children: ReactNode;
  /** "card": framed sidebar with a blue header bar (provider & admin portals). */
  variant?: 'plain' | 'card';
  areaIcon?: LucideIcon;
}) {
  const items = nav.map(({ href, label, icon: Icon }) => ({
    href,
    label,
    icon: <Icon className="size-4.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />,
  }));

  if (variant === 'card') {
    return (
      <div className="container-page py-6 md:py-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
          <aside className="min-w-0 lg:col-span-3 xl:col-span-3 2xl:col-span-2">
            <div className="border-line bg-surface shadow-card overflow-hidden rounded-xl border lg:sticky lg:top-40">
              <div className="bg-primary flex items-center gap-3 px-4 py-3.5 text-white">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/15">
                  <AreaIcon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{area}</span>
                  {subtitle && (
                    <span className="block truncate text-xs text-blue-100">{subtitle}</span>
                  )}
                </span>
              </div>
              <DashboardNav items={items} variant="card" />
            </div>
          </aside>
          <div className="min-w-0 lg:col-span-9 xl:col-span-9 2xl:col-span-10">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-6 md:py-8">
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <aside className="min-w-0 lg:col-span-3 xl:col-span-2">
          <div className="lg:sticky lg:top-40">
            <p className="text-fg-muted text-xs font-semibold tracking-wide uppercase">{area}</p>
            {subtitle && <p className="mt-0.5 truncate text-sm font-medium">{subtitle}</p>}
            <DashboardNav items={items} />
          </div>
        </aside>
        <div className="min-w-0 lg:col-span-9 xl:col-span-10">{children}</div>
      </div>
    </div>
  );
}

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold md:text-[28px]">{title}</h1>
        {description && <p className="text-fg-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Forbidden() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={ShieldX}
        title="Anda tidak memiliki akses ke halaman ini"
        description="Halaman ini hanya untuk peran tertentu. Hubungi administrator jika Anda merasa ini keliru."
        action={<ButtonLink href="/">Kembali ke beranda</ButtonLink>}
      />
    </div>
  );
}

/** Honest placeholder for portal sections whose module is scheduled for a later step. */
export function ModulePending({
  title,
  step,
  description,
}: {
  title: string;
  step: string;
  description: string;
}) {
  return (
    <>
      <PageTitle title={title} />
      <EmptyState
        icon={Construction}
        title="Modul ini belum aktif"
        description={`${description} Dijadwalkan pada ${step}.`}
      />
    </>
  );
}
