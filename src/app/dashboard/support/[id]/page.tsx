import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageTitle } from '@/components/dashboard/dashboard-shell';
import { CustomerReplyForm } from '@/components/support/ticket-forms';
import { TicketThread } from '@/components/support/ticket-thread';
import { Alert, Badge, Card } from '@/components/ui/primitives';
import { requireSession } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { getOwnTicket } from '@/modules/support/application/tickets';
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
} from '@/modules/support/domain/ticket-rules';

export const metadata: Metadata = { title: 'Tiket Bantuan', robots: { index: false } };

export default async function CustomerTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const session = await requireSession(`/dashboard/support/${id}`);
  const data = await getOwnTicket(await getReadyDb(), session.actor, id);
  if (!data) notFound();
  const { ticket: t, messages } = data;

  return (
    <>
      <Link
        href="/dashboard/support"
        className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua tiket
      </Link>
      <PageTitle
        title={t.subject}
        description={`${t.refCode} · ${TICKET_CATEGORY_LABEL[t.category]}`}
      />
      <div className="mb-5">
        <Badge tone={TICKET_STATUS_TONE[t.status]}>{TICKET_STATUS_LABEL[t.status]}</Badge>
      </div>
      {(await searchParams).created === '1' && (
        <Alert tone="success" className="mb-5">
          Tiket {t.refCode} terkirim. Balasan tim GMM akan muncul di halaman ini.
        </Alert>
      )}
      <Card className="p-5 sm:p-6">
        <TicketThread messages={messages} viewer="CUSTOMER" />
        <div className="border-line mt-6 border-t pt-5">
          <CustomerReplyForm id={t.id} closed={t.status === 'CLOSED'} />
        </div>
      </Card>
    </>
  );
}
