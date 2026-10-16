import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { EMPTY_PACKAGE, PackageForm } from '@/components/provider/package-form';
import { requirePermission } from '@/lib/auth/session';
import { can } from '@/modules/auth/domain/rbac';

export const metadata: Metadata = { title: 'Tambah Paket', robots: { index: false } };

export default async function NewPackagePage() {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard/packages/new',
  );
  const providerId = session.actor.providerId;
  if (forbidden || !providerId || !can(session.actor, 'package.manage', { providerId })) {
    return <Forbidden />;
  }
  return (
    <>
      <Link
        href="/provider-dashboard/packages"
        className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua paket
      </Link>
      <PageTitle
        title="Tambah paket"
        description="Disimpan sebagai draf. Ajukan ke GMM setelah semua informasi benar."
      />
      <PackageForm values={EMPTY_PACKAGE} />
    </>
  );
}
