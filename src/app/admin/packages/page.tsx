import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { PackageTable } from '@/components/dashboard/package-table';
import { Alert } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { cn } from '@/lib/utils';
import { can } from '@/modules/auth/domain/rbac';
import { listAllProvidersForStaff } from '@/modules/packages/application/catalog';

export const metadata: Metadata = { title: 'Manajemen Paket', robots: { index: false } };

const TABS = [
  { key: 'review', label: 'Menunggu review', statuses: ['PENDING_REVIEW'] },
  { key: 'published', label: 'Terbit', statuses: ['PUBLISHED'] },
  {
    key: 'other',
    label: 'Draf & lainnya',
    statuses: ['DRAFT', 'SUSPENDED', 'EXPIRED', 'ARCHIVED'],
  },
  { key: 'all', label: 'Semua', statuses: null },
] as const;

type Props = { searchParams: Promise<{ tab?: string }> };

export default async function AdminPackagesPage({ searchParams }: Props) {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin/packages');
  if (forbidden || !can(session.actor, 'provider.read')) return <Forbidden />;
  const rows = await listAllProvidersForStaff();
  const names = new Map(rows.map((r) => [r.provider.id, r.provider.displayName]));
  const all = rows.flatMap((r) => r.packages);
  const waiting = all.filter((p) => p.status === 'PENDING_REVIEW').length;

  const requested = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === requested) ?? (waiting > 0 ? TABS[0] : TABS[3]);
  const packages = tab.statuses
    ? all.filter((p) => (tab.statuses as readonly string[]).includes(p.status))
    : all;

  return (
    <>
      <PageTitle
        title="Paket"
        description="Paket hanya tampil di marketplace setelah diterbitkan tim GMM."
      />
      {waiting > 0 && (
        <Alert tone="info" className="mb-4">
          {waiting} paket menunggu review.
        </Alert>
      )}
      <nav aria-label="Filter status" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/packages?tab=${t.key}`}
            aria-current={t.key === tab.key ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              t.key === tab.key ? 'bg-primary text-white' : 'text-fg-secondary hover:bg-subtle',
            )}
          >
            {t.label}
            {t.key === 'review' && waiting > 0 ? ` (${waiting})` : ''}
          </Link>
        ))}
      </nav>
      <PackageTable
        packages={packages}
        providerName={(id) => names.get(id) ?? id}
        reviewHref={(id) => `/admin/packages/${id}`}
      />
    </>
  );
}
