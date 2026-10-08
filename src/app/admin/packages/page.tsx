import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { PackageTable } from '@/components/dashboard/package-table';
import { Alert } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/modules/auth/domain/rbac';
import { listAllProvidersForStaff } from '@/modules/packages/application/catalog';

export const metadata: Metadata = { title: 'Manajemen Paket', robots: { index: false } };

export default async function AdminPackagesPage() {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin/packages');
  if (forbidden || !can(session.actor, 'provider.read')) return <Forbidden />;
  const rows = await listAllProvidersForStaff();
  const names = new Map(rows.map((r) => [r.provider.id, r.provider.displayName]));
  const packages = rows.flatMap((r) => r.packages);

  return (
    <>
      <PageTitle
        title="Paket"
        description="Semua paket dari semua provider beserta status siklus hidupnya."
      />
      <Alert tone="info" className="mb-4">
        Antrean review, publikasi, dan penangguhan paket (dengan riwayat harga & audit) aktif di
        STEP 3.
      </Alert>
      <PackageTable packages={packages} providerName={(id) => names.get(id) ?? id} />
    </>
  );
}
