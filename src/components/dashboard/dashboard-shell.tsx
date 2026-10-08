import { Construction, ShieldX, type LucideIcon } from 'lucide-react';
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
}: {
  area: string;
  subtitle?: string;
  nav: DashboardNavItem[];
  children: ReactNode;
}) {
  return (
    <div className="container-page py-6 md:py-8">
      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <aside className="lg:col-span-3 xl:col-span-2">
          <div className="lg:sticky lg:top-40">
            <p className="text-fg-muted text-xs font-semibold tracking-wide uppercase">{area}</p>
            {subtitle && <p className="mt-0.5 truncate text-sm font-medium">{subtitle}</p>}
            <DashboardNav
              items={nav.map(({ href, label, icon: Icon }) => ({
                href,
                label,
                icon: <Icon className="size-4 shrink-0" aria-hidden="true" />,
              }))}
            />
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
