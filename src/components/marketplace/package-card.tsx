import { ArrowDown, ArrowUp, Router, Wrench } from 'lucide-react';
import Link from 'next/link';
import { CompareToggle } from '@/components/compare/compare-controls';
import { CoverageStatusBadge } from '@/components/coverage/coverage-status';
import { ButtonLink } from '@/components/ui/button';
import { Card, DemoBadge, RatingSummary, Skeleton } from '@/components/ui/primitives';
import { formatRupiah } from '@/lib/format';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';
import type { PackageView } from '@/modules/packages/application/catalog';
import { ProviderAvatar } from './provider-avatar';

export function PackageCard({ view, query = '' }: { view: PackageView; query?: string }) {
  const { pkg, provider, coverage } = view;
  const href = `/packages/${pkg.slug}${query}`;

  return (
    <Card className="hover:border-line-strong flex flex-col p-5 transition-colors">
      <div className="flex items-start gap-3">
        <ProviderAvatar name={provider.displayName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-fg-muted flex items-center gap-2 text-[13px]">
            <span className="truncate">{provider.displayName}</span>
            {pkg.isDemo && <DemoBadge />}
          </p>
          <h3 className="mt-0.5 truncate text-[17px] font-semibold">
            <Link href={href} className="hover:text-primary">
              {pkg.name}
            </Link>
          </h3>
        </div>
      </div>

      <div className="border-line mt-4 border-y py-3">
        <p className="flex items-baseline gap-1">
          <ArrowDown className="text-fg-muted size-4 self-center" aria-label="Download" />
          <span className="text-[28px] leading-none font-bold tabular-nums">
            {pkg.downloadMbps}
          </span>
          <span className="text-fg-muted text-sm font-medium">Mbps</span>
        </p>
        <p className="text-fg-muted mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[13px]">
          <ArrowUp className="size-3.5" aria-hidden="true" />
          <span>Unggah {pkg.uploadMbps} Mbps</span>
          <span aria-hidden="true">·</span>
          <span className="text-fg-secondary">{TECHNOLOGY_LABEL[pkg.technology]}</span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {coverage ? <CoverageStatusBadge status={coverage.status} /> : null}
        <RatingSummary average={null} count={0} />
      </div>

      <ul className="text-fg-secondary mt-3 space-y-1.5 text-[13px]">
        <li className="flex items-center gap-2">
          <Wrench className="text-fg-muted size-3.5" aria-hidden="true" />
          {pkg.installationFee === 0
            ? 'Instalasi gratis'
            : `Instalasi ${formatRupiah(pkg.installationFee)}`}
          {pkg.activationFee > 0 && ` · aktivasi ${formatRupiah(pkg.activationFee)}`}
        </li>
        <li className="flex items-center gap-2">
          <Router className="text-fg-muted size-3.5" aria-hidden="true" />
          {pkg.routerIncluded ? 'Termasuk router' : 'Router tidak termasuk'}
          {pkg.fupPolicy ? ' · ada FUP' : ''}
          {pkg.contractMonths > 0 ? ` · kontrak ${pkg.contractMonths} bln` : ''}
        </li>
      </ul>

      <div className="mt-auto pt-4">
        <p>
          <span className="text-fg text-xl font-bold tabular-nums">
            {formatRupiah(pkg.monthlyPrice)}
          </span>
          <span className="text-fg-muted text-sm">/bulan</span>
        </p>
        <p className="text-fg-muted text-xs">
          {pkg.taxIncluded ? 'Sudah termasuk pajak' : 'Belum termasuk pajak'}
        </p>
        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <ButtonLink href={href}>Pilih Paket</ButtonLink>
          <CompareToggle packageId={pkg.id} name={pkg.name} />
        </div>
      </div>
    </Card>
  );
}

export function PackageCardSkeleton() {
  return (
    <Card className="p-5" aria-hidden="true">
      <div className="flex gap-3">
        <Skeleton className="size-9" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="mt-4 h-16" />
      <Skeleton className="mt-4 h-4 w-48" />
      <Skeleton className="mt-6 h-6 w-32" />
      <Skeleton className="mt-3 h-10" />
    </Card>
  );
}
