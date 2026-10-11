import { CheckCircle2, ClipboardList, Hourglass, Package, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Forbidden } from '@/components/dashboard/dashboard-shell';
import { CtaBanner, EmptyChart, Panel, StatCard, WelcomeBanner } from '@/components/portal/widgets';
import { Alert, Badge } from '@/components/ui/primitives';
import { requirePermission } from '@/lib/auth/session';
import { formatRupiah } from '@/lib/money';
import { getProviderRecord, listPackagesForProvider } from '@/modules/packages/application/catalog';

export const metadata: Metadata = { title: 'Portal Provider', robots: { index: false } };

const ORDERS = 'Aktif setelah modul pesanan (STEP 5)';

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
  const published = packages.filter((p) => p.status === 'PUBLISHED');

  return (
    <div className="space-y-6">
      <WelcomeBanner
        title={
          <>
            Selamat Datang,
            <br />
            {provider?.displayName ?? 'Provider'}!
          </>
        }
        body="Kelola layanan internet Anda, pantau pesanan dan pemasangan dengan mudah melalui platform GMM Global Megaputra Mandiri."
        cta={{ href: '/mitra', label: 'Lihat Panduan Provider' }}
        image="Biznet Telecom Office Banner"
      />

      {provider?.verificationStatus !== 'VERIFIED' && (
        <Alert tone="warning" title="Provider belum terverifikasi">
          Paket Anda tidak tampil di marketplace sampai verifikasi selesai.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          tone="blue"
          label="Total Pesanan"
          value={null}
          caption={ORDERS}
        />
        <StatCard
          icon={Hourglass}
          tone="amber"
          label="Pesanan Diproses"
          value={null}
          caption={ORDERS}
        />
        <StatCard
          icon={CheckCircle2}
          tone="green"
          label="Paket Dipublikasikan"
          value={`${published.length}`}
          caption={`dari ${packages.length} paket`}
        />
        <StatCard
          icon={Wallet}
          tone="violet"
          label="Total Pendapatan"
          value={null}
          caption={ORDERS}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title="Grafik Penjualan">
          <EmptyChart
            message={`Grafik penjualan tampil setelah pesanan pertama masuk. ${ORDERS}.`}
          />
        </Panel>
        <Panel
          title="Pesanan Terbaru"
          action={{ href: '/provider-dashboard/orders', label: 'Lihat semua' }}
        >
          <div className="grid h-56 place-items-center text-center">
            <div>
              <span className="bg-subtle text-fg-muted mx-auto grid size-11 place-items-center rounded-full">
                <ClipboardList className="size-5" aria-hidden="true" />
              </span>
              <p className="text-fg-secondary mt-3 text-sm font-medium">Belum ada pesanan</p>
              <p className="text-fg-muted mt-1 max-w-xs text-xs">
                Pesanan pelanggan GMM akan masuk ke sini untuk Anda konfirmasi.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="Layanan & Produk Anda"
        action={{ href: '/provider-dashboard/packages', label: 'Kelola' }}
      >
        {packages.length === 0 ? (
          <p className="text-fg-muted text-sm">Belum ada paket.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((p) => (
              <li key={p.id}>
                <Link
                  href="/provider-dashboard/packages"
                  className="border-line hover:border-primary/50 hover:bg-primary-soft/40 flex h-full flex-col rounded-xl border p-4 transition-colors"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="bg-primary-soft text-primary grid size-9 place-items-center rounded-lg">
                      <Package className="size-4" aria-hidden="true" />
                    </span>
                    <Badge tone={p.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {p.status === 'PUBLISHED' ? 'Aktif' : p.status}
                    </Badge>
                  </span>
                  <span className="mt-3 text-sm font-semibold">{p.name}</span>
                  <span className="text-fg-muted text-xs">{p.downloadMbps} Mbps</span>
                  <span className="mt-auto pt-2 text-sm font-semibold">
                    {formatRupiah(p.monthlyPrice)}
                    <span className="text-fg-muted text-xs font-normal">/bulan</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <CtaBanner
        title="Bersama GMM, lebih mudah mengelola bisnis internet Anda."
        body="Dukungan tim GMM untuk setiap pesanan, pemasangan, dan layanan pelanggan Anda."
      />
    </div>
  );
}
