import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { PackageFacts } from '@/components/dashboard/package-facts';
import { PriceHistory } from '@/components/dashboard/price-history';
import { StatusChangeForm } from '@/components/dashboard/status-change-form';
import { packageMoveOptions } from '@/components/dashboard/status-options';
import { PackageStatusBadge, ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { Alert, Card, DemoBadge } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { changePackageStatusAction } from '@/modules/packages/api/actions';
import { getPackageForReview } from '@/modules/packages/application/package-review';
import { packageStateMachine } from '@/modules/packages/domain/package-rules';

export const metadata: Metadata = { title: 'Tinjau Paket', robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

const PUBLISH_MOVES = ['PUBLISHED', 'SUSPENDED', 'EXPIRED'];

export default async function AdminPackageDetailPage({ params }: Props) {
  const { id } = await params;
  const { forbidden, session } = await requirePermission(
    'dashboard.platform',
    `/admin/packages/${id}`,
  );
  if (forbidden || !can(session.actor, 'provider.read')) return <Forbidden />;
  const data = await getPackageForReview(await getReadyDb(), session.actor, id);
  if (!data) notFound();
  const { pkg, provider, prices, issues, allowedNext, reviewNote } = data;

  const options = packageMoveOptions(
    allowedNext.filter((to) =>
      can(session.actor, PUBLISH_MOVES.includes(to) ? 'package.publish' : 'package.manage'),
    ),
    (to) => packageStateMachine.requiresReason(pkg.status, to),
  );
  const providerVerified = provider.verificationStatus === 'VERIFIED';

  return (
    <>
      <Link
        href="/admin/packages"
        className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua paket
      </Link>
      <PageTitle title={pkg.name} description={pkg.description || undefined} />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <PackageStatusBadge status={pkg.status} validUntil={pkg.validUntil} />
        {pkg.isDemo && <DemoBadge />}
        <span className="text-fg-muted">
          Provider:{' '}
          <Link href={`/admin/providers/${provider.id}`} className="text-primary hover:underline">
            {provider.displayName}
          </Link>
        </span>
        <ProviderStatusBadge status={provider.verificationStatus} />
      </div>
      {reviewNote && (
        <Alert tone="warning" title="Catatan review terakhir" className="mb-4">
          {reviewNote}
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <PackageFacts pkg={pkg} />
          <PriceHistory prices={prices} />
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Pemeriksaan</h2>
            <ul className="space-y-2 text-sm">
              <li>
                {providerVerified ? '✓' : '✗'} Provider terverifikasi
                {!providerVerified && (
                  <span className="text-fg-muted block text-[13px]">
                    Paket tidak bisa terbit sebelum providernya diverifikasi.
                  </span>
                )}
              </li>
              <li>
                {issues.length === 0 ? '✓' : '✗'} Semua informasi wajib terisi
                {issues.length > 0 && (
                  <ul className="text-fg-muted mt-1 list-disc pl-5 text-[13px]">
                    {issues.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                )}
              </li>
            </ul>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Keputusan</h2>
            <StatusChangeForm id={pkg.id} options={options} action={changePackageStatusAction} />
          </Card>
        </aside>
      </div>
    </>
  );
}
