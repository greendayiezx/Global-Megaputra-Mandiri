import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { Badge, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { listServiceRequests } from '@/modules/requests/application/service-requests';
import {
  REQUEST_KIND_LABEL,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_TONE as STATUS_TONE,
  type RequestStatus,
} from '@/modules/requests/domain/request-rules';

export const metadata: Metadata = { title: 'Permintaan', robots: { index: false } };

const TABS: { key: string; label: string; statuses: RequestStatus[] }[] = [
  {
    key: 'open',
    label: 'Perlu ditangani',
    statuses: ['NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'FORWARDED'],
  },
  { key: 'new', label: 'Baru', statuses: ['NEW'] },
  { key: 'closed', label: 'Selesai & batal', statuses: ['DONE', 'CANCELLED'] },
  { key: 'all', label: 'Semua', statuses: [] },
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin/requests');
  if (forbidden || !can(session.actor, 'lead.read')) return <Forbidden />;
  const tabKey = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === tabKey) ?? TABS[0]!;
  const rows = await listServiceRequests(await getReadyDb(), session.actor, tab.statuses);

  return (
    <>
      <PageTitle
        title="Permintaan"
        description="Permintaan survei lokasi dan minat pemasangan dari pengunjung, dengan persetujuan mereka."
      />
      <nav aria-label="Filter status" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/requests?tab=${t.key}`}
            aria-current={t.key === tab.key ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              t.key === tab.key ? 'bg-primary text-white' : 'text-fg-secondary hover:bg-subtle',
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <Card className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-fg-muted px-5 py-6 text-sm">Belum ada permintaan di kelompok ini.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-line bg-canvas text-fg-muted border-b text-left text-xs">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Kode
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Nama & alamat
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Jenis
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Paket
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Masuk
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-mono">
                    <Link href={`/admin/requests/${r.id}`} className="text-primary hover:underline">
                      {r.refCode}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.name}</p>
                    <p className="text-fg-muted max-w-[280px] truncate text-xs">{r.address}</p>
                  </td>
                  <td className="px-4 py-3">{REQUEST_KIND_LABEL[r.kind]}</td>
                  <td className="px-4 py-3">
                    {r.packageName ? `${r.packageName} · ${r.providerName}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
                  </td>
                  <td className="text-fg-muted px-4 py-3">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
