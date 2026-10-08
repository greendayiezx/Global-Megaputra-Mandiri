import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getProviderRecord } from '@/modules/packages/application/catalog';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';

export const metadata: Metadata = { title: 'Profil Provider', robots: { index: false } };

export default async function ProviderProfilePage() {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard/profile',
  );
  if (forbidden || !session.actor.providerId) return <Forbidden />;
  const p = await getProviderRecord(session.actor.providerId);
  if (!p) return <Forbidden />;

  const rows: [string, React.ReactNode][] = [
    ['Status verifikasi', <ProviderStatusBadge key="s" status={p.verificationStatus} />],
    ['Terverifikasi sejak', p.verifiedAt ? formatDate(p.verifiedAt) : '—'],
    ['Nama tampilan', p.displayName],
    ['Nama badan usaha', p.legalName],
    ['Teknologi', p.technologies.map((t) => TECHNOLOGY_LABEL[t]).join(', ')],
    ['Area layanan', p.serviceAreaNames.join(', ')],
    ['Jam dukungan', p.supportHours],
    ['SLA', p.slaSummary ?? '—'],
    ['Email dukungan', p.supportEmail ?? '—'],
  ];
  return (
    <>
      <PageTitle
        title="Profil perusahaan"
        description="Informasi yang tampil di halaman provider Anda."
      />
      <Card>
        <dl className="divide-line divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-5 py-3.5 text-sm sm:grid-cols-[200px_1fr]">
              <dt className="text-fg-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </>
  );
}
