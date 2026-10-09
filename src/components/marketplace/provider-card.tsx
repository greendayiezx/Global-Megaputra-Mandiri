import { BadgeCheck, MapPin } from 'lucide-react';
import Link from 'next/link';
import { CoverageStatusBadge } from '@/components/coverage/coverage-status';
import { ButtonLink } from '@/components/ui/button';
import { Card, DemoBadge, RatingSummary } from '@/components/ui/primitives';
import { formatRupiah } from '@/lib/format';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';
import type { ProviderSummary } from '@/modules/packages/application/catalog';
import { showVerifiedBadge } from '@/modules/providers/domain/provider-rules';
import { ProviderAvatar } from './provider-avatar';

export function ProviderCard({
  summary,
  query = '',
}: {
  summary: ProviderSummary;
  query?: string;
}) {
  const { provider: p, packageCount, startingPrice, maxDownload, coverage } = summary;
  const href = `/provider/${p.slug}${query}`;

  return (
    <Card className="hover:border-line-strong flex flex-col p-5 transition-colors">
      <div className="flex items-start gap-3">
        <ProviderAvatar name={p.displayName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[17px] font-semibold">
              <Link href={href} className="hover:text-primary">
                {p.displayName}
              </Link>
            </h3>
            {p.isDemo && <DemoBadge />}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <RatingSummary average={null} count={0} />
            {showVerifiedBadge(p) && (
              <span className="text-primary-hover inline-flex items-center gap-1 text-[13px] font-medium">
                <BadgeCheck className="size-3.5" aria-hidden="true" /> Terverifikasi
              </span>
            )}
          </div>
        </div>
      </div>

      <dl className="border-line mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 text-sm">
        <div>
          <dt className="text-fg-muted text-xs">Teknologi</dt>
          <dd className="font-medium">
            {p.technologies.map((t) => TECHNOLOGY_LABEL[t]).join(', ')}
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted text-xs">Jumlah paket</dt>
          <dd className="font-medium">{packageCount} paket</dd>
        </div>
        <div>
          <dt className="text-fg-muted text-xs">Harga mulai</dt>
          <dd className="text-fg font-semibold">
            {startingPrice !== null ? `${formatRupiah(startingPrice)}/bln` : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-fg-muted text-xs">Kecepatan hingga</dt>
          <dd className="font-medium">{maxDownload !== null ? `${maxDownload} Mbps` : '—'}</dd>
        </div>
      </dl>

      <div className="text-fg-muted mt-4 flex items-center gap-2 text-[13px]">
        {coverage ? (
          <CoverageStatusBadge status={coverage.status} />
        ) : (
          <>
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{p.serviceAreaNames.join(' · ')}</span>
          </>
        )}
      </div>

      <div className="mt-auto pt-4">
        <ButtonLink href={href} variant="outline" className="w-full">
          Lihat Paket
        </ButtonLink>
      </div>
    </Card>
  );
}
