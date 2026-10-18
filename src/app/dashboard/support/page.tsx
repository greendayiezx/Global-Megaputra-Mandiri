import type { Metadata } from 'next';
import Link from 'next/link';
import { PageTitle } from '@/components/dashboard/dashboard-shell';
import { NewTicketForm } from '@/components/support/ticket-forms';
import { Badge, Card } from '@/components/ui/primitives';
import { requireSession } from '@/lib/auth/session';
import { formatDateTime } from '@/lib/format';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { listOwnTickets } from '@/modules/support/application/tickets';
import {
  TICKET_CATEGORY_LABEL,
  TICKET_STATUS_LABEL,
  TICKET_STATUS_TONE,
} from '@/modules/support/domain/ticket-rules';

export const metadata: Metadata = { title: 'Bantuan', robots: { index: false } };

export default async function CustomerSupportPage() {
  const session = await requireSession('/dashboard/support');
  const rows = await listOwnTickets(await getReadyDb(), session.actor);

  return (
    <>
      <PageTitle
        title="Bantuan"
        description="Laporkan kendala pemasangan, gangguan, tagihan, atau keluhan terhadap provider. Setiap tiket punya nomor referensi."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 font-semibold">Buat tiket baru</h2>
          <NewTicketForm />
        </Card>
        <Card className="overflow-hidden">
          <h2 className="border-line border-b px-5 py-3.5 font-semibold">
            Tiket saya ({rows.length})
          </h2>
          {rows.length === 0 ? (
            <p className="text-fg-muted px-5 py-6 text-sm">Belum ada tiket.</p>
          ) : (
            <ul className="divide-line divide-y">
              {rows.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/dashboard/support/${t.id}`}
                    className="hover:bg-canvas block px-5 py-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">{t.subject}</p>
                      <Badge tone={TICKET_STATUS_TONE[t.status]}>
                        {TICKET_STATUS_LABEL[t.status]}
                      </Badge>
                    </div>
                    <p className="text-fg-muted mt-0.5 text-xs">
                      {t.refCode} · {TICKET_CATEGORY_LABEL[t.category]} ·{' '}
                      {formatDateTime(t.lastMessageAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
