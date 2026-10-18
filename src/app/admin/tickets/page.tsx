import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { Badge, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatAge } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { listTicketsForStaff } from '@/modules/support/application/tickets';
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_STAFF_LABEL,
  TICKET_STATUS_TONE,
  type TicketStatus,
} from '@/modules/support/domain/ticket-rules';

export const metadata: Metadata = { title: 'Bantuan & Tiket', robots: { index: false } };

const TABS: { key: string; label: string; statuses: TicketStatus[] }[] = [
  { key: 'open', label: 'Perlu ditangani', statuses: ['OPEN', 'IN_PROGRESS'] },
  { key: 'waiting', label: 'Menunggu pelanggan', statuses: ['WAITING_CUSTOMER'] },
  { key: 'done', label: 'Selesai & ditutup', statuses: ['RESOLVED', 'CLOSED'] },
  { key: 'all', label: 'Semua', statuses: [] },
];

export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin/tickets');
  if (forbidden || !can(session.actor, 'ticket.read')) return <Forbidden />;
  const key = (await searchParams).tab;
  const tab = TABS.find((t) => t.key === key) ?? TABS[0]!;
  const rows = await listTicketsForStaff(await getReadyDb(), session.actor, tab.statuses);

  return (
    <>
      <PageTitle
        title="Bantuan & Tiket"
        description="Tiket pelanggan. Yang paling lama tidak tersentuh tampil paling atas."
      />
      <nav aria-label="Filter status" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/tickets?tab=${t.key}`}
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
          <p className="text-fg-muted px-5 py-6 text-sm">Tidak ada tiket di kelompok ini.</p>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-line bg-canvas text-fg-muted border-b text-left text-xs">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Tiket
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Kategori
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Ditangani
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Aktivitas terakhir
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-canvas">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tickets/${t.id}`}
                      className="text-primary font-medium hover:underline"
                    >
                      {t.subject}
                    </Link>
                    <p className="text-fg-muted font-mono text-xs">{t.refCode}</p>
                  </td>
                  <td className="px-4 py-3">{TICKET_CATEGORY_LABEL[t.category]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={TICKET_STATUS_TONE[t.status]}>
                      {TICKET_STATUS_STAFF_LABEL[t.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {t.assigneeName ?? <span className="text-fg-muted">Belum</span>}
                  </td>
                  <td className="text-fg-muted px-4 py-3">{formatAge(t.lastMessageAt)} lalu</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
