import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { Alert, Card, DemoBadge } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { can } from '@/modules/auth/domain/rbac';
import { listAllProvidersForStaff } from '@/modules/packages/application/catalog';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';

export const metadata: Metadata = { title: 'Manajemen Provider', robots: { index: false } };

export default async function AdminProvidersPage() {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin/providers');
  if (forbidden || !can(session.actor, 'provider.read')) return <Forbidden />;
  const rows = await listAllProvidersForStaff();

  return (
    <>
      <PageTitle
        title="Provider"
        description="Semua provider, termasuk yang belum tampil publik."
      />
      <Alert tone="info" className="mb-4">
        Persetujuan/penolakan verifikasi dengan pemeriksaan dokumen dan audit log aktif di STEP 3.
      </Alert>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-line bg-canvas text-fg-muted border-b text-left text-xs">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Provider
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Teknologi
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Paket
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Diverifikasi
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Publik
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {rows.map(({ provider: p, packages }) => (
              <tr key={p.id} className="hover:bg-canvas">
                <td className="px-4 py-3">
                  <p className="flex items-center gap-2 font-medium">
                    {p.displayName} {p.isDemo && <DemoBadge />}
                  </p>
                  <p className="text-fg-muted text-xs">{p.legalName}</p>
                </td>
                <td className="px-4 py-3">
                  {p.technologies.map((t) => TECHNOLOGY_LABEL[t]).join(', ')}
                </td>
                <td className="px-4 py-3 tabular-nums">{packages.length}</td>
                <td className="px-4 py-3">
                  <ProviderStatusBadge status={p.verificationStatus} />
                </td>
                <td className="text-fg-muted px-4 py-3">
                  {p.verifiedAt ? formatDate(p.verifiedAt) : '—'}
                </td>
                <td className="px-4 py-3">
                  {p.verificationStatus === 'VERIFIED' ? (
                    <Link href={`/provider/${p.slug}`} className="text-primary hover:underline">
                      Lihat
                    </Link>
                  ) : (
                    <span className="text-fg-muted">Tidak tampil</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
