import Link from 'next/link';
import { Card } from '@/components/ui/primitives';
import { formatDate, formatRupiah } from '@/lib/format';
import type { PackageRecord } from '@/modules/packages/application/catalog-repository';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';
import { PackageStatusBadge } from './status-badges';

export function PackageTable({
  packages,
  providerName,
}: {
  packages: PackageRecord[];
  providerName?: (providerId: string) => string;
}) {
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-line bg-canvas text-fg-muted border-b text-left text-xs">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Paket
            </th>
            {providerName && (
              <th scope="col" className="px-4 py-3 font-medium">
                Provider
              </th>
            )}
            <th scope="col" className="px-4 py-3 font-medium">
              Kecepatan
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Teknologi
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Bulanan
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Instalasi
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Harga diverifikasi
            </th>
          </tr>
        </thead>
        <tbody className="divide-line divide-y">
          {packages.map((p) => (
            <tr key={p.id} className="hover:bg-canvas">
              <td className="px-4 py-3 font-medium">
                {p.status === 'PUBLISHED' ? (
                  <Link href={`/packages/${p.slug}`} className="hover:text-primary">
                    {p.name}
                  </Link>
                ) : (
                  p.name
                )}
              </td>
              {providerName && (
                <td className="text-fg-secondary px-4 py-3">{providerName(p.providerId)}</td>
              )}
              <td className="px-4 py-3 tabular-nums">
                {p.downloadMbps}/{p.uploadMbps} Mbps
              </td>
              <td className="px-4 py-3">{TECHNOLOGY_LABEL[p.technology]}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatRupiah(p.monthlyPrice)}</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {p.installationFee === 0 ? 'Gratis' : formatRupiah(p.installationFee)}
              </td>
              <td className="px-4 py-3">
                <PackageStatusBadge status={p.status} validUntil={p.validUntil} />
              </td>
              <td className="text-fg-muted px-4 py-3">
                {p.lastPriceVerifiedAt ? formatDate(p.lastPriceVerifiedAt) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
