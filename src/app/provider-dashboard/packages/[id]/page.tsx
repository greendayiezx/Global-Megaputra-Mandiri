import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { PriceHistory } from '@/components/dashboard/price-history';
import { PackageStatusBadge } from '@/components/dashboard/status-badges';
import { PackageForm } from '@/components/provider/package-form';
import { PackageSteps } from '@/components/provider/package-steps';
import { Alert, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { priceHistoryOf } from '@/modules/packages/application/package-review';
import { getOwnPackage } from '@/modules/packages/application/package-self-service';

export const metadata: Metadata = { title: 'Ubah Paket', robots: { index: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> };

const STATUS_COPY = {
  DRAFT: 'Draf: belum terlihat GMM maupun pelanggan.',
  PENDING_REVIEW: 'Menunggu review tim GMM.',
  PUBLISHED: 'Tampil di marketplace.',
  SUSPENDED: 'Ditangguhkan GMM; tidak tampil. Hubungi tim GMM.',
  EXPIRED: 'Kedaluwarsa; perbarui lalu ajukan ulang.',
  ARCHIVED: 'Diarsipkan.',
} as const;

export default async function OwnPackagePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    `/provider-dashboard/packages/${id}`,
  );
  const providerId = session.actor.providerId;
  if (forbidden || !providerId || !can(session.actor, 'package.manage', { providerId })) {
    return <Forbidden />;
  }
  const db = await getReadyDb();
  const data = await getOwnPackage(db, session.actor, id);
  if (!data) notFound();
  const { pkg, reviewNote, provider, editable, canSubmit, canArchive } = data;
  const prices = await priceHistoryOf(db, pkg.id);
  const created = (await searchParams).created === '1' && pkg.status === 'DRAFT';

  return (
    <>
      <Link
        href="/provider-dashboard/packages"
        className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua paket
      </Link>
      <PageTitle title={pkg.name} />
      {created && (
        <Alert tone="success" className="mb-4">
          Draf paket tersimpan. Periksa lagi, lalu klik &ldquo;Ajukan ke GMM&rdquo;.
        </Alert>
      )}
      <Card className="mb-5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <PackageStatusBadge status={pkg.status} validUntil={pkg.validUntil} />
          <span className="text-fg-secondary text-sm">{STATUS_COPY[pkg.status]}</span>
        </div>
        {reviewNote && (
          <p className="mt-3 text-sm">
            <span className="font-semibold">Catatan GMM:</span> {reviewNote}
          </p>
        )}
        {canSubmit && provider.verificationStatus !== 'VERIFIED' && (
          <p className="text-fg-muted mt-3 text-sm">
            Paket bisa diajukan setelah provider Anda terverifikasi (lihat menu Profil).
          </p>
        )}
        <div className="mt-4">
          <PackageSteps id={pkg.id} canSubmit={canSubmit} canArchive={canArchive} />
        </div>
      </Card>
      <PackageForm
        id={pkg.id}
        disabled={!editable}
        live={pkg.status === 'PUBLISHED'}
        values={{
          name: pkg.name,
          description: pkg.description,
          downloadMbps: String(pkg.downloadMbps),
          uploadMbps: String(pkg.uploadMbps),
          technology: pkg.technology,
          monthlyPrice: String(pkg.monthlyPrice),
          installationFee: String(pkg.installationFee),
          activationFee: String(pkg.activationFee),
          taxIncluded: pkg.taxIncluded,
          contractMonths: String(pkg.contractMonths),
          routerIncluded: pkg.routerIncluded,
          fupPolicy: pkg.fupPolicy ?? '',
          slaSummary: pkg.slaSummary ?? '',
          supportHours: pkg.supportHours ?? '',
          estInstallationDaysMin: String(pkg.estInstallationDaysMin ?? ''),
          estInstallationDaysMax: String(pkg.estInstallationDaysMax ?? ''),
          features: pkg.features.map((f) => `${f.label}: ${f.value}`).join('\n'),
        }}
      />
      <div className="mt-6">
        <PriceHistory prices={prices} />
      </div>
    </>
  );
}
