import { appConfig } from '@/config/app';
import { Alert } from '@/components/ui/primitives';
import { isAppError } from '@/lib/errors';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { PackageRecord } from '@/modules/packages/application/catalog-repository';
import { calculateOrderTotal, type OrderTotal } from '@/modules/orders/domain/pricing';

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex justify-between gap-4 py-2', strong && 'text-[15px] font-semibold')}>
      <dt className={strong ? 'text-fg' : 'text-fg-muted'}>{label}</dt>
      <dd className="text-fg text-right tabular-nums">{value}</dd>
    </div>
  );
}

/**
 * Full cost picture from the same function checkout uses. If the pricing policy is not
 * configured, every component is still listed and the total is marked pending — never estimated.
 */
export function PriceBreakdown({ pkg }: { pkg: PackageRecord }) {
  let total: OrderTotal | null = null;
  try {
    total = calculateOrderTotal({ package: pkg, policy: appConfig.pricingPolicy });
  } catch (err) {
    if (!isAppError(err) || err.code !== 'CONFIGURATION_MISSING') throw err;
  }
  const free = (n: number) => (n === 0 ? 'Gratis' : formatRupiah(n));

  return (
    <div>
      <dl className="divide-line divide-y text-sm">
        <Row label="Biaya bulanan" value={formatRupiah(pkg.monthlyPrice)} />
        <Row label="Biaya instalasi" value={free(pkg.installationFee)} />
        <Row label="Biaya aktivasi" value={free(pkg.activationFee)} />
        <Row label="Diskon / promo" value="—" />
        {total ? (
          <>
            <Row
              label={pkg.taxIncluded ? 'Pajak (termasuk)' : 'Pajak'}
              value={formatRupiah(total.taxToday)}
            />
            <Row label="Biaya lain" value="—" />
            <Row label="Total hari ini" value={formatRupiah(total.totalToday)} strong />
            <Row
              label="Tagihan bulanan berikutnya"
              value={formatRupiah(total.recurringMonthly.total)}
            />
          </>
        ) : (
          <>
            <Row
              label="Pajak"
              value={pkg.taxIncluded ? 'Termasuk dalam harga' : 'Menunggu konfigurasi'}
            />
            <Row label="Biaya lain" value="—" />
          </>
        )}
      </dl>
      {!total && (
        <Alert tone="warning" className="mt-3">
          Total akhir ditampilkan setelah kebijakan pajak dan penagihan dikonfigurasi. Kami tidak
          menampilkan angka perkiraan.
        </Alert>
      )}
      {total && !total.firstMonthChargedToday && (
        <p className="text-fg-muted mt-2 text-xs">
          Biaya bulan pertama ditagihkan setelah layanan aktif.
        </p>
      )}
    </div>
  );
}
