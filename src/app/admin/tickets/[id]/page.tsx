import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { StaffTicketForm } from '@/components/support/ticket-forms';
import { TicketThread } from '@/components/support/ticket-thread';
import { Badge, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatAge, formatDateTime } from '@/lib/format';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { getTicketForStaff } from '@/modules/support/application/tickets';
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_STAFF_LABEL,
  TICKET_STATUS_TONE,
} from '@/modules/support/domain/ticket-rules';

export const metadata: Metadata = { title: 'Tiket', robots: { index: false } };

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { forbidden, session } = await requirePermission(
    'dashboard.platform',
    `/admin/tickets/${id}`,
  );
  if (forbidden || !can(session.actor, 'ticket.read')) return <Forbidden />;
  const data = await getTicketForStaff(await getReadyDb(), session.actor, id);
  if (!data) notFound();
  const { ticket: t, customer, messages, allowedNext } = data;

  const info: [string, string][] = [
    ['Kode', t.refCode],
    ['Kategori', TICKET_CATEGORY_LABEL[t.category]],
    ['Pelanggan', customer ? `${customer.fullName} · ${customer.email}` : '—'],
    ['Ponsel', customer?.phone ?? '—'],
    ['Provider terkait', data.providerName ?? '—'],
    ['Ditangani', data.assigneeName ?? 'Belum ada'],
    ['Dibuat', `${formatDateTime(t.createdAt)} (${formatAge(t.createdAt)} lalu)`],
  ];

  return (
    <>
      <Link
        href="/admin/tickets"
        className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua tiket
      </Link>
      <PageTitle title={t.subject} />
      <div className="mb-5">
        <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_STAFF_LABEL[t.status]}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="min-w-0 p-5 sm:p-6">
          <TicketThread messages={messages} viewer="PLATFORM" />
        </Card>
        <aside className="space-y-4">
          <Card>
            <dl className="divide-line divide-y">
              {info.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[120px_1fr] gap-2 px-5 py-2.5 text-sm">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className="font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          {can(session.actor, 'ticket.reply') && (
            <Card className="p-5">
              <h2 className="mb-3 font-semibold">Tanggapi</h2>
              <StaffTicketForm
                id={t.id}
                allowedNext={allowedNext}
                canInternal={can(session.actor, 'ticket.internal_note')}
                canAssign={can(session.actor, 'ticket.assign')}
                assigned={t.assigneeId === session.actor.userId}
              />
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
