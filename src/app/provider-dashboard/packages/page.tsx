import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { PackageTable } from '@/components/dashboard/package-table';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { listPackagesForProvider } from '@/modules/packages/application/catalog';
import { can } from '@/modules/auth/domain/rbac';

export const metadata: Metadata = { title: 'Paket Provider', robots: { index: false } };

export default async function ProviderPackagesPage() {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard/packages',
  );
  const providerId = session.actor.providerId;
  if (forbidden || !providerId) return <Forbidden />;
  const packages = await listPackagesForProvider(providerId);
  const canManage = can(session.actor, 'package.manage', { providerId });

  return (
    <>
      <PageTitle
        title="Paket"
        description="Paket hanya tampil di marketplace setelah disetujui tim GMM."
        action={
          canManage ? (
            <Button disabled title="Tersedia di STEP 3">
              <Plus aria-hidden="true" /> Tambah paket
            </Button>
          ) : undefined
        }
      />
      <Alert tone="info" className="mb-4">
        Pembuatan dan pengubahan paket (dengan review GMM dan riwayat harga) aktif di STEP 3. Data
        di bawah adalah paket demo milik provider Anda.
      </Alert>
      <PackageTable packages={packages} />
    </>
  );
}
