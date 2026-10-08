import { GitCompareArrows } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProviderAvatar } from '@/components/marketplace/provider-avatar';
import { ButtonLink } from '@/components/ui/button';
import {
  Badge,
  Breadcrumb,
  DemoBadge,
  EmptyState,
  RatingSummary,
} from '@/components/ui/primitives';
import { formatContract, formatInstallWindow, formatRupiah } from '@/lib/format';
import { str, type RawSearchParams } from '@/lib/search-params';
import { getPublicPackagesByIds, type PackageView } from '@/modules/packages/application/catalog';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';

export const metadata: Metadata = {
  title: 'Bandingkan Paket Internet',
  description:
    'Bandingkan hingga 4 paket internet: harga, kecepatan, biaya instalasi, kontrak, dan SLA.',
};

const MAX = 4;

/** Highlights name the metric they use and are only awarded to a unique winner. */
function highlights(views: PackageView[]) {
  const out = new Map<string, string[]>(views.map((v) => [v.pkg.id, []]));
  if (views.length < 2) return out;
  const award = (label: string, score: (v: PackageView) => number) => {
    const best = Math.min(...views.map(score));
    const winners = views.filter((v) => score(v) === best);
    if (winners.length === 1) out.get(winners[0]!.pkg.id)!.push(label);
  };
  award('Harga Terbaik', (v) => v.pkg.monthlyPrice);
  award('Kecepatan Terbaik', (v) => -v.pkg.downloadMbps);
  award('Nilai Terbaik', (v) => v.pkg.monthlyPrice / v.pkg.downloadMbps);
  return out;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const ids = (str(await searchParams, 'ids') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX);
  const views = await getPublicPackagesByIds(ids);
  const badges = highlights(views);
  const free = (n: number) => (n === 0 ? 'Gratis' : formatRupiah(n));

  const rows: [string, (v: PackageView) => React.ReactNode][] = [
    ['Provider', (v) => v.provider.displayName],
    [
      'Harga / bulan',
      (v) => <span className="font-semibold">{formatRupiah(v.pkg.monthlyPrice)}</span>,
    ],
    ['Pajak', (v) => (v.pkg.taxIncluded ? 'Termasuk' : 'Belum termasuk')],
    ['Download', (v) => `${v.pkg.downloadMbps} Mbps`],
    ['Upload', (v) => `${v.pkg.uploadMbps} Mbps`],
    ['Rp per Mbps', (v) => formatRupiah(Math.round(v.pkg.monthlyPrice / v.pkg.downloadMbps))],
    ['Teknologi', (v) => TECHNOLOGY_LABEL[v.pkg.technology]],
    ['Instalasi', (v) => free(v.pkg.installationFee)],
    ['Aktivasi', (v) => free(v.pkg.activationFee)],
    ['Router', (v) => (v.pkg.routerIncluded ? 'Termasuk' : 'Tidak termasuk')],
    ['Kontrak', (v) => formatContract(v.pkg.contractMonths)],
    ['FUP', (v) => (v.pkg.fupPolicy ? 'Ada' : 'Tidak dinyatakan')],
    ['SLA', (v) => v.pkg.slaSummary ?? v.provider.slaSummary ?? 'Tidak dinyatakan'],
    ['Dukungan', (v) => v.pkg.supportHours ?? v.provider.supportHours],
    [
      'Estimasi instalasi',
      (v) => formatInstallWindow(v.pkg.estInstallationDaysMin, v.pkg.estInstallationDaysMax),
    ],
    ['Rating', () => <RatingSummary average={null} count={0} />],
  ];

  return (
    <div className="container-page py-6 md:py-8">
      <Breadcrumb items={[{ label: 'Beranda', href: '/' }, { label: 'Bandingkan' }]} />
      <div className="mt-4">
        <h1 className="text-[28px] font-bold md:text-[32px]">Bandingkan Paket</h1>
        <p className="text-fg-muted mt-1">
          Hingga {MAX} paket berdampingan. Ketersediaan bergantung pada titik pemasangan Anda.
        </p>
      </div>

      {views.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={GitCompareArrows}
          title="Belum ada paket yang dipilih"
          description="Tekan “Bandingkan” pada kartu paket untuk menambahkannya ke perbandingan."
          action={<ButtonLink href="/packages">Pilih paket</ButtonLink>}
        />
      ) : (
        <>
          <div className="border-line bg-surface shadow-card mt-6 overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <caption className="sr-only">Perbandingan paket internet</caption>
              <thead>
                <tr className="align-top">
                  <th
                    scope="col"
                    className="border-line bg-surface text-fg-muted sticky left-0 z-10 w-40 border-b p-4 text-left font-medium"
                  >
                    Paket
                  </th>
                  {views.map((v) => (
                    <th
                      key={v.pkg.id}
                      scope="col"
                      className="border-line border-b border-l p-4 text-left font-normal"
                    >
                      <div className="flex items-center gap-2">
                        <ProviderAvatar name={v.provider.displayName} size="sm" />
                        {v.pkg.isDemo && <DemoBadge />}
                      </div>
                      <Link
                        href={`/packages/${v.pkg.slug}`}
                        className="text-fg hover:text-primary mt-2 block text-base font-semibold"
                      >
                        {v.pkg.name}
                      </Link>
                      <div className="mt-2 flex min-h-6 flex-wrap gap-1">
                        {badges.get(v.pkg.id)?.map((b) => (
                          <Badge key={b} tone="primary">
                            {b}
                          </Badge>
                        ))}
                      </div>
                      <ButtonLink
                        href={`/packages/${v.pkg.slug}`}
                        size="sm"
                        className="mt-3 w-full"
                      >
                        Pilih Paket
                      </ButtonLink>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, cell]) => (
                  <tr key={label} className="hover:bg-canvas">
                    <th
                      scope="row"
                      className="border-line bg-surface text-fg-muted sticky left-0 z-10 border-b p-4 text-left font-medium"
                    >
                      {label}
                    </th>
                    {views.map((v) => (
                      <td key={v.pkg.id} className="border-line text-fg border-b border-l p-4">
                        {cell(v)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-fg-muted mt-3 text-xs">
            Harga Terbaik = harga bulanan terendah · Kecepatan Terbaik = download tertinggi · Nilai
            Terbaik = Rp per Mbps terendah. Label hanya diberikan bila ada satu pemenang.
          </p>
        </>
      )}
    </div>
  );
}
