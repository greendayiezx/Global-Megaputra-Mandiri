import { ArrowDown, ArrowUp, BadgeCheck, CalendarClock, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CompareToggle } from '@/components/compare/compare-controls';
import {
  COVERAGE_EXPLANATION,
  CoverageNotice,
  CoverageStatusBadge,
} from '@/components/coverage/coverage-status';
import { PriceBreakdown } from '@/components/marketplace/price-breakdown';
import { ProviderAvatar } from '@/components/marketplace/provider-avatar';
import { Button, ButtonLink } from '@/components/ui/button';
import { Breadcrumb, Card, DemoBadge, RatingSummary } from '@/components/ui/primitives';
import { formatContract, formatDate, formatInstallWindow, formatRupiah } from '@/lib/format';
import { point, qs, type RawSearchParams } from '@/lib/search-params';
import { isOrderableCoverage } from '@/modules/coverage/domain/coverage';
import { checkCoverage, getPublicPackage } from '@/modules/packages/application/catalog';
import { TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';
import { showVerifiedBadge } from '@/modules/providers/domain/provider-rules';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const view = await getPublicPackage((await params).slug);
  if (!view) return { title: 'Paket tidak ditemukan' };
  return {
    title: `${view.pkg.name} ${view.pkg.downloadMbps} Mbps — ${view.provider.displayName}`,
    description: view.pkg.description,
  };
}

export default async function PackageDetailPage({ params, searchParams }: Props) {
  const view = await getPublicPackage((await params).slug);
  if (!view) notFound();
  const { pkg, provider } = view;

  const pt = point(await searchParams);
  const coverage = pt
    ? ((await checkCoverage(pt)).providers.find((c) => c.provider.id === provider.id) ?? null)
    : null;
  const orderable = coverage ? isOrderableCoverage(coverage.status) : false;

  const specs: [string, string][] = [
    ['Teknologi', TECHNOLOGY_LABEL[pkg.technology]],
    ['Router', pkg.routerIncluded ? 'Termasuk' : 'Tidak termasuk'],
    ['FUP', pkg.fupPolicy ?? 'Tidak ada FUP yang dinyatakan provider'],
    ['Kontrak', formatContract(pkg.contractMonths)],
    ['SLA', pkg.slaSummary ?? provider.slaSummary ?? 'Tidak dinyatakan provider'],
    ['Dukungan', pkg.supportHours ?? provider.supportHours],
    [
      'Estimasi instalasi',
      formatInstallWindow(pkg.estInstallationDaysMin, pkg.estInstallationDaysMax),
    ],
    ...pkg.features.map((f): [string, string] => [f.label, f.value]),
  ];

  return (
    <div className="container-page py-6 md:py-8">
      <Breadcrumb
        items={[
          { label: 'Beranda', href: '/' },
          { label: 'Paket', href: `/packages${pt ? qs({ lat: pt.lat, lng: pt.lng }) : ''}` },
          { label: pkg.name },
        ]}
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-12">
        {/* Left: package information */}
        <div className="space-y-6 lg:col-span-7 xl:col-span-8">
          <Card className="p-5 md:p-6">
            <div className="flex items-center gap-3">
              <ProviderAvatar name={provider.displayName} />
              <div>
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <Link
                    href={`/provider/${provider.slug}`}
                    className="hover:text-primary font-medium"
                  >
                    {provider.displayName}
                  </Link>
                  {showVerifiedBadge(provider) && (
                    <span className="text-primary-hover inline-flex items-center gap-1 text-[13px]">
                      <BadgeCheck className="size-3.5" aria-hidden="true" /> Terverifikasi
                    </span>
                  )}
                  {pkg.isDemo && <DemoBadge />}
                </p>
                <RatingSummary average={null} count={0} className="mt-0.5" />
              </div>
            </div>
            <h1 className="mt-4 text-[28px] font-bold md:text-[32px]">{pkg.name}</h1>
            <p className="text-fg-secondary mt-2">{pkg.description}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="bg-canvas rounded-md p-4">
                <dt className="text-fg-muted flex items-center gap-1.5 text-[13px]">
                  <ArrowDown className="size-3.5" aria-hidden="true" /> Download
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums">
                  {pkg.downloadMbps} <span className="text-fg-muted text-sm font-medium">Mbps</span>
                </dd>
              </div>
              <div className="bg-canvas rounded-md p-4">
                <dt className="text-fg-muted flex items-center gap-1.5 text-[13px]">
                  <ArrowUp className="size-3.5" aria-hidden="true" /> Upload
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums">
                  {pkg.uploadMbps} <span className="text-fg-muted text-sm font-medium">Mbps</span>
                </dd>
              </div>
              <div className="bg-canvas col-span-2 rounded-md p-4 sm:col-span-1">
                <dt className="text-fg-muted flex items-center gap-1.5 text-[13px]">
                  <CalendarClock className="size-3.5" aria-hidden="true" /> Estimasi instalasi
                </dt>
                <dd className="mt-1 text-[15px] font-semibold">
                  {formatInstallWindow(pkg.estInstallationDaysMin, pkg.estInstallationDaysMax)}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="border-line border-b px-5 py-4 text-lg font-semibold md:px-6">
              Spesifikasi layanan
            </h2>
            <dl className="divide-line divide-y">
              {specs.map(([k, v]) => (
                <div
                  key={k}
                  className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[200px_1fr] md:px-6"
                >
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {pkg.lastPriceVerifiedAt && (
              <p className="border-line text-fg-muted border-t px-5 py-3 text-xs md:px-6">
                Harga terakhir diverifikasi {formatDate(pkg.lastPriceVerifiedAt)}.
              </p>
            )}
          </Card>

          <Card className="p-5 md:p-6">
            <h2 className="text-lg font-semibold">Informasi pemasangan</h2>
            <p className="text-fg-secondary mt-2 text-sm">{provider.installationInfo}</p>
          </Card>
        </div>

        {/* Right: purchase summary */}
        <aside className="lg:col-span-5 xl:col-span-4">
          <div className="space-y-4 lg:sticky lg:top-40">
            <Card className="p-5">
              <p className="text-fg-muted text-sm">Harga bulanan</p>
              <p className="mt-1">
                <span className="text-[28px] font-bold tabular-nums">
                  {formatRupiah(pkg.monthlyPrice)}
                </span>
                <span className="text-fg-muted">/bulan</span>
              </p>
              <p className="text-fg-muted text-xs">
                {pkg.taxIncluded ? 'Sudah termasuk pajak' : 'Belum termasuk pajak'}
              </p>
              <div className="border-line mt-4 border-t pt-3">
                <PriceBreakdown pkg={pkg} />
              </div>

              <div className="mt-5 grid gap-2">
                {orderable ? (
                  <>
                    <Button size="lg" disabled>
                      Pesan Sekarang
                    </Button>
                    <p className="text-fg-muted text-center text-xs">
                      Pemesanan online segera dibuka.
                    </p>
                  </>
                ) : (
                  <ButtonLink href="#cek-lokasi" size="lg">
                    Cek Ketersediaan Dulu
                  </ButtonLink>
                )}
                <CompareToggle packageId={pkg.id} name={pkg.name} className="w-full" />
              </div>
            </Card>

            <Card id="cek-lokasi" className="scroll-mt-40 p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <MapPin className="text-primary size-4" aria-hidden="true" />
                Ketersediaan di lokasi Anda
              </h2>
              {coverage ? (
                <div className="mt-3 space-y-2">
                  <CoverageStatusBadge status={coverage.status} />
                  <p className="text-fg-secondary text-sm">
                    {COVERAGE_EXPLANATION[coverage.status]}
                  </p>
                  <CoverageNotice />
                  <Link
                    href={`/coverage${qs({ package: pkg.slug, lat: pt?.lat, lng: pt?.lng })}`}
                    className="text-primary inline-block text-sm font-medium hover:underline"
                  >
                    Ubah titik lokasi
                  </Link>
                </div>
              ) : (
                <>
                  <p className="text-fg-muted mt-2 text-sm">
                    Tandai titik pemasangan untuk memastikan {provider.displayName} menjangkau
                    lokasi Anda.
                  </p>
                  <ButtonLink
                    href={`/coverage${qs({ package: pkg.slug })}`}
                    variant="outline"
                    className="mt-4 w-full"
                  >
                    Cek di peta
                  </ButtonLink>
                </>
              )}
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
