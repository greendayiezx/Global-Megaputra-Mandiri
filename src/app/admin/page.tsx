import { Activity, Building2, CreditCard, UsersRound, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import { Forbidden } from '@/components/dashboard/dashboard-shell';
import { ProviderStatusBadge } from '@/components/dashboard/status-badges';
import { ProviderAvatar } from '@/components/marketplace/provider-avatar';
import { Donut, EmptyChart, Panel, StatCard, WelcomeBanner } from '@/components/portal/widgets';
import { requirePermission } from '@/lib/auth/session';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can } from '@/modules/auth/domain/rbac';
import { listAllProvidersForStaff } from '@/modules/packages/application/catalog';
import { listAuditLogs, platformCounts } from '@/modules/users/application/admin-queries';

export const metadata: Metadata = { title: 'Portal Admin', robots: { index: false } };

const ORDERS = 'Aktif setelah modul pesanan (STEP 5)';
const PAYMENTS = 'Aktif setelah modul pembayaran (STEP 6)';

const ACTIVITY_LABEL: Record<string, string> = {
  user_registered: 'Pengguna baru terdaftar',
  login_succeeded: 'Login berhasil',
  login_failed: 'Percobaan login gagal',
  login_locked: 'Akun dikunci sementara',
  logout: 'Pengguna keluar',
  user_role_changed: 'Role pengguna diubah',
  provider_approved: 'Provider disetujui',
  provider_rejected: 'Provider ditolak',
  package_published: 'Paket dipublikasikan',
  package_price_changed: 'Harga paket diubah',
  coverage_changed: 'Area layanan diubah',
  settings_changed: 'Pengaturan diubah',
};

const timeAgo = (d: Date) => {
  const min = Math.max(1, Math.round((Date.now() - d.getTime()) / 60_000));
  if (min < 60) return `${min} menit lalu`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h} jam lalu` : `${Math.round(h / 24)} hari lalu`;
};

export default async function AdminDashboard() {
  const { forbidden, session } = await requirePermission('dashboard.platform', '/admin');
  if (forbidden) return <Forbidden />;
  const db = await getReadyDb();
  const [counts, providers, activity] = await Promise.all([
    platformCounts(db, session.actor),
    can(session.actor, 'provider.read') ? listAllProvidersForStaff() : Promise.resolve([]),
    can(session.actor, 'audit.read') ? listAuditLogs(db, session.actor, 5) : Promise.resolve([]),
  ]);
  const verified = providers.filter((p) => p.provider.verificationStatus === 'VERIFIED');

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={
          <>
            Selamat Datang,
            <br />
            {session.user.fullName}!
          </>
        }
        body="Kelola seluruh sistem, pantau provider dan pengguna, serta atur platform GMM Global Megaputra Mandiri."
        cta={{ href: '/admin/providers', label: 'Kelola Provider' }}
        image="SuperAdmin/Super Admin at a Modern Tech Workspace"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={UsersRound}
          tone="blue"
          label="Total Pengguna"
          value={counts.users.toLocaleString('id-ID')}
          caption={`${counts.customers} pelanggan`}
        />
        <StatCard
          icon={CreditCard}
          tone="amber"
          label="Total Transaksi"
          value={null}
          caption={PAYMENTS}
        />
        <StatCard
          icon={Building2}
          tone="green"
          label="Total Provider"
          value={String(providers.length)}
          caption={`${verified.length} terverifikasi`}
        />
        <StatCard
          icon={Wallet}
          tone="violet"
          label="Total Pendapatan"
          value={null}
          caption={PAYMENTS}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel title="Ringkasan Transaksi">
          <EmptyChart
            message={`Grafik transaksi harian tampil setelah ada transaksi. ${PAYMENTS}.`}
          />
        </Panel>
        <Panel title="Provider" action={{ href: '/admin/providers', label: 'Lihat semua' }}>
          {providers.length === 0 ? (
            <p className="text-fg-muted text-sm">Belum ada provider.</p>
          ) : (
            <ul className="divide-line divide-y">
              {providers.slice(0, 8).map(({ provider: p }) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <ProviderAvatar name={p.displayName} size="sm" />
                    <span className="truncate text-sm font-medium">{p.displayName}</span>
                  </span>
                  <ProviderStatusBadge status={p.verificationStatus} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Transaksi Terbaru" action={{ href: '/admin/payments', label: 'Lihat semua' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="text-fg-muted border-line border-b text-left text-xs">
                {['No. Order', 'Provider', 'Pelanggan', 'Status', 'Total', 'Waktu'].map((h) => (
                  <th key={h} className="py-2 pr-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-fg-muted py-8 text-center">
                  Belum ada transaksi. {ORDERS}.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel
          title="Aktivitas Sistem"
          action={{ href: '/admin/audit-logs', label: 'Lihat semua' }}
        >
          {activity.length === 0 ? (
            <p className="text-fg-muted text-sm">Belum ada aktivitas tercatat.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3">
                  <span className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-lg">
                    <Activity className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {ACTIVITY_LABEL[a.action] ?? a.action}
                      {a.actorName && (
                        <span className="text-fg-muted font-normal"> · {a.actorName}</span>
                      )}
                    </span>
                    <span className="text-fg-muted block text-xs">{timeAgo(a.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel
          title="Paket per Provider"
          action={{ href: '/admin/packages', label: 'Lihat semua' }}
        >
          <Donut
            totalLabel="paket"
            data={providers.map((p) => ({
              label: p.provider.displayName,
              value: p.packages.length,
            }))}
          />
          <p className="text-fg-muted mt-4 text-xs">
            Grafik transaksi per provider tampil setelah modul pembayaran aktif.
          </p>
        </Panel>
      </div>
    </div>
  );
}
