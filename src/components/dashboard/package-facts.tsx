import { Card } from '@/components/ui/primitives';
import { formatContract, formatDate, formatInstallWindow, formatRupiah } from '@/lib/format';
import {
  TECHNOLOGY_LABEL,
  type PackageRecord,
} from '@/modules/packages/application/catalog-repository';

const fee = (n: number) => (n === 0 ? 'Gratis' : formatRupiah(n));

/** Every customer-facing fact of a package, as a reviewer needs to check it. */
export function PackageFacts({ pkg }: { pkg: PackageRecord }) {
  const rows: [string, string][] = [
    ['Kecepatan', `${pkg.downloadMbps} Mbps download / ${pkg.uploadMbps} Mbps upload`],
    ['Teknologi', TECHNOLOGY_LABEL[pkg.technology] ?? pkg.technology],
    [
      'Harga bulanan',
      `${formatRupiah(pkg.monthlyPrice)}${pkg.taxIncluded ? ' (termasuk pajak)' : ' (belum termasuk pajak)'}`,
    ],
    ['Biaya instalasi', fee(pkg.installationFee)],
    ['Biaya aktivasi', fee(pkg.activationFee)],
    ['Kontrak', formatContract(pkg.contractMonths)],
    ['Router', pkg.routerIncluded ? 'Termasuk' : 'Tidak termasuk'],
    ['FUP', pkg.fupPolicy ?? 'Tidak ada FUP yang dinyatakan'],
    ['SLA', pkg.slaSummary ?? 'Tidak dinyatakan'],
    ['Jam dukungan', pkg.supportHours ?? '—'],
    [
      'Perkiraan instalasi',
      formatInstallWindow(pkg.estInstallationDaysMin, pkg.estInstallationDaysMax),
    ],
    ['Slug (URL)', `/packages/${pkg.slug}`],
    ['Berlaku sampai', pkg.validUntil ? formatDate(pkg.validUntil) : 'Tidak dibatasi'],
    ...pkg.features.map((f): [string, string] => [f.label, f.value]),
  ];
  return (
    <Card>
      <h2 className="border-line border-b px-5 py-3.5 font-semibold">Detail paket</h2>
      <dl className="divide-line divide-y">
        {rows.map(([k, v], i) => (
          <div key={`${k}-${i}`} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[200px_1fr]">
            <dt className="text-fg-muted">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
