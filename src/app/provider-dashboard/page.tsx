import { ClipboardList, Inbox, LifeBuoy, Percent, Target, UsersRound, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { ButtonLink } from '@/components/ui/button';
import { Alert, Card, EmptyState, Metric } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { getProviderRecord, listPackagesForProvider } from '@/modules/packages/application/catalog';

export const metadata: Metadata = { title: 'Portal Provider', robots: { index: false } };

const PENDING = 'Aktif setelah modul pesanan (STEP 5)';

export default async function ProviderOverview() {
  const { forbidden, session } = await requirePermission(
    'dashboard.provider',
    '/provider-dashboard',
  );
  if (forbidden || !session.actor.providerId) return <Forbidden />;
  const [provider, packages] = await Promise.all([
    getProviderRecord(session.actor.providerId),
    listPackagesForProvider(session.actor.providerId),
  ]);
  const published = packages.filter((p) => p.status === 'PUBLISHED').length;

  return (
    <>
      <PageTitle
        title="Overview"
        description="Kinerja akuisisi pelanggan Anda di GMM."
        action={
          <ButtonLink href="/provider-dashboard/packages" variant="secondary">
            Kelola paket
          </ButtonLink>
        }
      />
      {provider?.verificationStatus !== 'VERIFIED' && (
        <Alert tone="warning" className="mb-4" title="Provider belum terverifikasi">
          Paket Anda tidak tampil di marketplace sampai verifikasi selesai.
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric icon={Inbox} label="Pesanan baru" value={null} caption={PENDING} />
        <Metric
          icon={Target}
          label="Leads"
          value={null}
          caption="Aktif di Fase 3 (lead management)"
        />
        <Metric icon={UsersRound} label="Pelanggan aktif" value={null} caption={PENDING} />
        <Metric
          icon={Percent}
          label="Conversion rate"
          value={null}
          caption="Butuh data pesanan & analitik"
        />
        <Metric icon={Wallet} label="Pendapatan (MRR)" value={null} caption={PENDING} />
        <Metric
          icon={LifeBuoy}
          label="Tiket terbuka"
          value={null}
          caption="Aktif di STEP 11 (support)"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="border-line flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="text-base font-semibold">Paket Anda</h2>
            <span className="text-fg-muted text-sm">
              {published} dari {packages.length} dipublikasikan
            </span>
          </div>
          <ul className="divide-line divide-y">
            {packages.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-medium">{p.name}</span>
                <span className="text-fg-muted">{p.status}</span>
              </li>
            ))}
          </ul>
        </Card>
        <section aria-labelledby="orders-title">
          <h2 id="orders-title" className="mb-3 text-base font-semibold">
            Pesanan terbaru
          </h2>
          <EmptyState
            icon={ClipboardList}
            title="Belum ada pesanan"
            description="Pesanan dari pelanggan GMM akan masuk ke sini untuk Anda konfirmasi."
          />
        </section>
      </div>
    </>
  );
}
