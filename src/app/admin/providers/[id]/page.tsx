import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { PackageTable } from '@/components/dashboard/package-table';
import { StatusChangeForm } from '@/components/dashboard/status-change-form';
import { providerMoveOptions } from '@/components/dashboard/status-options';
import { ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { Alert, Card, DemoBadge } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { listPackagesForProvider } from '@/modules/packages/application/catalog';
import {
  TECHNOLOGY_LABEL,
  type Technology,
} from '@/modules/packages/application/catalog-repository';
import { changeProviderStatusAction } from '@/modules/providers/api/actions';
import {
  getProviderForReview,
  PROFILE_FIELD_LABEL,
} from '@/modules/providers/application/provider-review';
import { providerStateMachine } from '@/modules/providers/domain/provider-rules';

export const metadata: Metadata = { title: 'Tinjau Provider', robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function AdminProviderDetailPage({ params }: Props) {
  const { id } = await params;
  const { forbidden, session } = await requirePermission(
    'dashboard.platform',
    `/admin/providers/${id}`,
  );
  if (forbidden || !can(session.actor, 'provider.read')) return <Forbidden />;
  const data = await getProviderForReview(await getReadyDb(), session.actor, id);
  if (!data) notFound();
  const { provider: p, history, readiness, allowedNext } = data;
  const packages = await listPackagesForProvider(p.id);

  const mayDecide = can(session.actor, 'provider.verify') || can(session.actor, 'provider.suspend');
  const options = providerMoveOptions(
    allowedNext.filter((to) =>
      can(session.actor, to === 'SUSPENDED' ? 'provider.suspend' : 'provider.verify'),
    ),
    (to) => providerStateMachine.requiresReason(p.verificationStatus, to),
  );

  const rows: [string, string | null][] = [
    ['Nama badan usaha', p.legalName],
    ['NIB', p.nib],
    ['Alamat kantor', p.address],
    ['Nama PIC', p.picName],
    ['Telepon PIC', p.picPhone],
    ['Email PIC', p.picEmail],
    ['Teknologi', p.technologies.map((t) => TECHNOLOGY_LABEL[t as Technology]).join(', ')],
    ['Area layanan', p.serviceAreaNames.join(', ')],
    ['Jam dukungan', p.supportHours],
    ['SLA (dinyatakan provider)', p.slaSummary],
    ['Email dukungan', p.supportEmail],
    ['Situs web', p.website],
  ];

  return (
    <>
      <Link
        href="/admin/providers"
        className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua provider
      </Link>
      <PageTitle title={p.displayName} description={p.description || undefined} />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <ProviderStatusBadge status={p.verificationStatus} />
        {p.isDemo && <DemoBadge />}
        <span className="text-fg-muted">
          {p.verifiedAt ? `Terverifikasi sejak ${formatDate(p.verifiedAt)}` : 'Belum terverifikasi'}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <h2 className="border-line border-b px-5 py-3.5 font-semibold">Profil perusahaan</h2>
            <dl className="divide-line divide-y">
              {rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[200px_1fr]">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className={v ? 'font-medium' : 'text-fg-muted'}>{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <section aria-labelledby="pkgs">
            <h2 id="pkgs" className="mb-3 font-semibold">
              Paket ({packages.length})
            </h2>
            <PackageTable packages={packages} reviewHref={(pkgId) => `/admin/packages/${pkgId}`} />
          </section>

          <Card>
            <h2 className="border-line border-b px-5 py-3.5 font-semibold">Riwayat verifikasi</h2>
            {history.length === 0 ? (
              <p className="text-fg-muted px-5 py-4 text-sm">Belum ada keputusan tercatat.</p>
            ) : (
              <ol className="divide-line divide-y">
                {history.map((h) => (
                  <li key={h.id} className="px-5 py-3 text-sm">
                    <p className="flex flex-wrap items-center gap-2">
                      <ProviderStatusBadge status={h.fromStatus} />
                      <span aria-hidden="true">→</span>
                      <ProviderStatusBadge status={h.toStatus} />
                      <span className="text-fg-muted">
                        {formatDate(h.createdAt)} · {h.actorName ?? 'Sistem'}
                      </span>
                    </p>
                    {h.reason && <p className="text-fg-secondary mt-1.5">{h.reason}</p>}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Kelengkapan untuk verifikasi</h2>
            {readiness.ready ? (
              <Alert tone="success">Profil lengkap.</Alert>
            ) : (
              <Alert tone="warning" title="Belum lengkap">
                {readiness.missingProfileFields.map((f) => PROFILE_FIELD_LABEL[f]).join(', ')}
              </Alert>
            )}
            <p className="text-fg-muted mt-3 text-[13px]">
              Dokumen legal (NIB, akta, NPWP, izin) diperiksa manual sampai fitur unggah dokumen
              tersedia.
            </p>
          </Card>
          {mayDecide && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Keputusan</h2>
              <StatusChangeForm id={p.id} options={options} action={changeProviderStatusAction} />
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
