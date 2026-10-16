import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { PackageTable } from '@/components/dashboard/package-table';
import { ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/modules/auth/domain/rbac';
import { listPackagesForProvider } from '@/modules/packages/application/catalog';

export const metadata: Metadata = { title: 'Paket Provider', robots: { index: false } };

export default async function ProviderPackagesPage() {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard/packages',
  );
  const providerId = session.actor.providerId;
  if (forbidden || !providerId) return <Forbidden />;
  const packages = (await listPackagesForProvider(providerId)).filter(
    (p) => p.status !== 'ARCHIVED',
  );
  const canManage = can(session.actor, 'package.manage', { providerId });
  const sentBack = packages.filter((p) => p.status === 'DRAFT').length;

  return (
    <>
      <PageTitle
        title="Paket"
        description="Paket tampil di marketplace setelah diajukan dan diterbitkan tim GMM."
        action={
          canManage ? (
            <ButtonLink href="/provider-dashboard/packages/new">
              <Plus aria-hidden="true" /> Tambah paket
            </ButtonLink>
          ) : undefined
        }
      />
      {sentBack > 0 && (
        <Alert tone="info" className="mb-4">
          {sentBack} paket masih draf. Buka paketnya, lengkapi, lalu klik &ldquo;Ajukan ke
          GMM&rdquo;.
        </Alert>
      )}
      <PackageTable
        packages={packages}
        reviewHref={canManage ? (id) => `/provider-dashboard/packages/${id}` : undefined}
      />
    </>
  );
}
