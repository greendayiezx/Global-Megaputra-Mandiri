import {
  BadgeCheck,
  ClipboardList,
  Clock,
  Coins,
  LifeBuoy,
  Percent,
  TrendingUp,
  UsersRound,
  Wrench,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden, PageTitle } from '@/components/dashboard/dashboard-shell';
import { ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { Card, Metric } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { listAllProvidersForStaff } from '@/modules/packages/application/catalog';
import { platformCounts } from '@/modules/users/application/admin-queries';

export const metadata: Metadata = { title: 'Portal Admin', robots: { index: false } };

const ORDERS_PENDING = 'Tersedia setelah modul pesanan (STEP 5)';

export default async function AdminDashboard() {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin');
  if (forbidden) return <Forbidden />;
  const db = await getReadyDb();
  const [counts, providers] = await Promise.all([
    platformCounts(db, session.actor),
    can(session.actor, 'provider.read') ? listAllProvidersForStaff() : Promise.resolve([]),
  ]);
  const verified = providers.filter((p) => p.provider.verificationStatus === 'VERIFIED').length;
  const queue = providers.filter((p) =>
    ['PENDING', 'UNDER_REVIEW'].includes(p.provider.verificationStatus),
  );

  return (
    <>
      <PageTitle
        title="Dashboard"
        description="Ringkasan operasional marketplace. Angka '—' berarti modulnya belum aktif, bukan nol."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={TrendingUp} label="GMV" value={null} caption={ORDERS_PENDING} />
        <Metric icon={Coins} label="Revenue" value={null} caption={ORDERS_PENDING} />
        <Metric icon={ClipboardList} label="Pesanan" value={null} caption={ORDERS_PENDING} />
        <Metric
          icon={BadgeCheck}
          label="Provider aktif"
          value={String(verified)}
          caption="Terverifikasi (data demo)"
        />
        <Metric
          icon={UsersRound}
          label="Pelanggan"
          value={String(counts.customers)}
          caption={`${counts.users} akun terdaftar`}
        />
        <Metric
          icon={Percent}
          label="Conversion rate"
          value={null}
          caption="Butuh data pesanan & analitik"
        />
        <Metric
          icon={Wrench}
          label="Instalasi tertunda"
          value={null}
          caption="Tersedia di STEP 7"
        />
        <Metric icon={LifeBuoy} label="Tiket terbuka" value={null} caption="Tersedia di STEP 11" />
      </div>

      <Card className="mt-6">
        <div className="border-line flex items-center justify-between border-b px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Clock className="text-fg-muted size-4" aria-hidden="true" /> Antrean verifikasi
            provider
          </h2>
          <Link
            href="/admin/providers"
            className="text-primary text-sm font-medium hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        {queue.length === 0 ? (
          <p className="text-fg-muted px-5 py-6 text-sm">
            Tidak ada provider yang menunggu verifikasi.
          </p>
        ) : (
          <ul className="divide-line divide-y">
            {queue.map(({ provider: p }) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-medium">{p.displayName}</span>
                <ProviderStatusBadge status={p.verificationStatus} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
