import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { RequestUpdateForm } from '@/components/requests/request-update-form';
import { Badge, Card } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatDate } from '@/lib/format';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { getServiceRequest } from '@/modules/requests/application/service-requests';
import {
  REQUEST_KIND_LABEL,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_TONE as STATUS_TONE,
} from '@/modules/requests/domain/request-rules';

export const metadata: Metadata = { title: 'Detail Permintaan', robots: { index: false } };

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { forbidden, session } = await requirePermission(
    'dashboard.platform',
    `/admin/requests/${id}`,
  );
  if (forbidden || !can(session.actor, 'lead.read')) return <Forbidden />;
  const data = await getServiceRequest(await getReadyDb(), session.actor, id);
  if (!data) notFound();
  const { request: r, events, allowedNext } = data;
  const wa = `https://wa.me/${r.phone.replace(/^\+/, '')}`;

  const rows: [string, React.ReactNode][] = [
    ['Jenis', REQUEST_KIND_LABEL[r.kind]],
    ['Nama', r.name],
    [
      'Ponsel',
      <a
        key="p"
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {r.phone}
      </a>,
    ],
    ['Email', r.email ?? '—'],
    ['Alamat', r.address],
    [
      'Titik peta',
      r.lat !== null && r.lng !== null ? (
        <a
          key="m"
          href={`https://www.openstreetmap.org/?mlat=${r.lat}&mlon=${r.lng}#map=17/${r.lat}/${r.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary inline-flex items-center gap-1 hover:underline"
        >
          {r.lat.toFixed(5)}, {r.lng.toFixed(5)}{' '}
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      ) : (
        '—'
      ),
    ],
    ['Paket', data.packageName ? `${data.packageName} · ${data.providerName}` : '—'],
    ['Catatan pelanggan', r.note ?? '—'],
    ['Persetujuan', `${formatDate(r.consentAt)} (${r.consentVersion})`],
    ['Ditangani', data.handlerName ?? 'Belum'],
  ];

  return (
    <>
      <Link
        href="/admin/requests"
        className="text-fg-muted hover:text-fg mb-3 inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Semua permintaan
      </Link>
      <PageTitle title={r.refCode} description={`Masuk ${formatDate(r.createdAt)}`} />
      <div className="mb-6">
        <Badge tone={STATUS_TONE[r.status]}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <dl className="divide-line divide-y">
              {rows.map(([k, v]) => (
                <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[180px_1fr]">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className="font-medium break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card>
            <h2 className="border-line border-b px-5 py-3.5 font-semibold">
              Riwayat (terlihat pelanggan)
            </h2>
            <ol className="divide-line divide-y">
              {events.map((e) => (
                <li key={e.id} className="px-5 py-3 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <Badge tone={STATUS_TONE[e.status]}>{REQUEST_STATUS_LABEL[e.status]}</Badge>
                    <span className="text-fg-muted">
                      {formatDate(e.createdAt)} · {e.actorName ?? 'Pengunjung'}
                    </span>
                  </p>
                  {e.publicNote && <p className="text-fg-secondary mt-1.5">{e.publicNote}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>
        <aside>
          <Card className="p-5">
            <h2 className="mb-3 font-semibold">Tindak lanjut</h2>
            {can(session.actor, 'lead.manage') ? (
              <RequestUpdateForm
                id={r.id}
                allowedNext={allowedNext}
                adminNote={r.adminNote ?? ''}
              />
            ) : (
              <p className="text-fg-muted text-sm">Peran Anda hanya dapat melihat.</p>
            )}
          </Card>
        </aside>
      </div>
    </>
  );
}
