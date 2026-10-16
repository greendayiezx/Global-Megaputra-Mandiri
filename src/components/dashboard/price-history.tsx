import { Card } from '@/components/ui/primitives';
import { formatDate, formatRupiah } from '@/lib/format';

export interface PriceRow {
  id: string;
  monthlyPrice: number;
  installationFee: number;
  activationFee: number;
  taxIncluded: boolean;
  effectiveAt: Date;
  changedByName: string | null;
}

/** Every price the customer could have seen, newest first. */
export function PriceHistory({ prices }: { prices: PriceRow[] }) {
  return (
    <Card className="overflow-x-auto">
      <h2 className="border-line border-b px-5 py-3.5 font-semibold">Riwayat harga</h2>
      {prices.length === 0 ? (
        <p className="text-fg-muted px-5 py-4 text-sm">Belum ada riwayat harga.</p>
      ) : (
        <table className="w-full min-w-[560px] text-sm">
          <thead className="text-fg-muted border-line border-b text-left text-xs">
            <tr>
              <th scope="col" className="px-5 py-2.5 font-medium">
                Berlaku
              </th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">
                Bulanan
              </th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">
                Instalasi
              </th>
              <th scope="col" className="px-5 py-2.5 text-right font-medium">
                Aktivasi
              </th>
              <th scope="col" className="px-5 py-2.5 font-medium">
                Oleh
              </th>
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {prices.map((r) => (
              <tr key={r.id}>
                <td className="px-5 py-2.5">{formatDate(r.effectiveAt)}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatRupiah(r.monthlyPrice)}
                  {r.taxIncluded && <span className="text-fg-muted text-xs"> incl. pajak</span>}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatRupiah(r.installationFee)}
                </td>
                <td className="px-5 py-2.5 text-right tabular-nums">
                  {formatRupiah(r.activationFee)}
                </td>
                <td className="text-fg-muted px-5 py-2.5">{r.changedByName ?? 'Data awal'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
