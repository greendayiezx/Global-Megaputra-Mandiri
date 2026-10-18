import { ArrowLeft, CalendarClock, MapPinned, Package } from 'lucide-react';
import type { Metadata } from 'next';
import { ConsultPrompt } from '@/components/consult/consult-prompt';
import { regionChain } from '@/lib/wilayah/codes';
import Link from 'next/link';
import { CoverageLocator } from '@/components/coverage/coverage-search-form';
import {
  COVERAGE_EXPLANATION,
  CoverageNotice,
  CoverageStatusBadge,
} from '@/components/coverage/coverage-status';
import { PageHero } from '@/components/layout/page-hero';
import { ProviderAvatar } from '@/components/marketplace/provider-avatar';
import { ButtonLink } from '@/components/ui/button';
import { Alert, Card, DemoBadge, EmptyState } from '@/components/ui/primitives';
import { appConfig } from '@/config/app';
import { formatDate, formatInstallWindow, formatRupiah } from '@/lib/format';
import { point, qs, str, type RawSearchParams } from '@/lib/search-params';
import { isOrderableCoverage } from '@/modules/coverage/domain/coverage';
import {
  checkCoverage,
  getPublicPackage,
  listPublicPackages,
} from '@/modules/packages/application/catalog';
import { DEMO_LOCATIONS } from '@/modules/packages/infrastructure/demo-catalog';

export const metadata: Metadata = {
  title: 'Cek Coverage Internet di Lokasi Anda',
  description: 'Tandai titik pemasangan dan lihat provider internet yang menjangkau lokasi Anda.',
};

export default async function CoveragePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const pt = point(params);
  const address = str(params, 'address');
  const packageSlug = str(params, 'package');
  const regions = regionChain(str(params, 'region'));
  const forPackage = packageSlug ? await getPublicPackage(packageSlug) : null;
  const hadCoords = str(params, 'lat') !== null || str(params, 'lng') !== null;

  const [result, packages] = await Promise.all([
    pt ? checkCoverage(pt, regions) : Promise.resolve(null),
    listPublicPackages(),
  ]);
  const rows = (result?.providers ?? [])
    .filter((c) => !forPackage || c.provider.id === forPackage.provider.id)
    .map((c) => {
      const own = packages.filter((v) => v.provider.id === c.provider.id).map((v) => v.pkg);
      const mins = own.map((p) => p.estInstallationDaysMin).filter((n): n is number => n !== null);
      const maxs = own.map((p) => p.estInstallationDaysMax).filter((n): n is number => n !== null);
      return {
        ...c,
        packageCount: own.length,
        startingPrice: own.length ? Math.min(...own.map((p) => p.monthlyPrice)) : null,
        install: formatInstallWindow(
          mins.length ? Math.min(...mins) : null,
          maxs.length ? Math.max(...maxs) : null,
        ),
      };
    });
  const orderable = rows.filter((r) => isOrderableCoverage(r.status));
  const carry: Record<string, string> = packageSlug ? { package: packageSlug } : {};

  return (
    <>
      <PageHero
        compact
        image="/images/Smart%20Home%20Wi-Fi%20Network%20at%20Dusk.png"
        imagePosition="object-[70%_center]"
        crumb="Cek Coverage"
        eyebrow="Cek coverage"
        title="Apakah Internet Ini Tersedia di Lokasi Anda?"
        description="Tandai titik pemasangan di peta. Kami mencocokkannya dengan area layanan provider terverifikasi."
      />
      {/* The locator card overlaps the photo band slightly so it reads as part of the header. */}
      <div className="container-page pb-6 md:pb-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="relative -mt-12 space-y-4 md:-mt-16 lg:col-span-5">
            {forPackage && (
              <Alert tone="info">
                Mengecek untuk paket <strong>{forPackage.pkg.name}</strong> dari{' '}
                {forPackage.provider.displayName}.
              </Alert>
            )}

            <Card className="p-5">
              <CoverageLocator
                defaultAddress={address ?? ''}
                defaultPoint={pt}
                defaultRegion={regions.at(-1) ?? null}
                carry={carry}
              />
            </Card>
            {appConfig.showDemoData && (
              <Card className="p-5">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  Coba lokasi contoh <DemoBadge />
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {DEMO_LOCATIONS.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={`/coverage${qs({ ...carry, lat: l.lat, lng: l.lng, address: l.label })}`}
                        className="border-line-strong hover:border-primary hover:text-primary inline-flex h-9 items-center rounded-md border px-3 text-sm"
                      >
                        {l.label.replace('Contoh: ', '')}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <section
            className="lg:col-span-7 lg:pt-4"
            aria-live="polite"
            aria-labelledby="result-title"
          >
            {!result ? (
              <EmptyState
                icon={MapPinned}
                title={
                  hadCoords
                    ? 'Koordinat tidak valid'
                    : address
                      ? 'Tandai titik di peta'
                      : 'Belum ada titik lokasi'
                }
                description={
                  hadCoords
                    ? 'Titik lokasi berada di luar jangkauan koordinat. Tandai ulang di peta.'
                    : address
                      ? `Alamat "${address}" sudah tercatat. Sekarang tandai titik pemasangan di peta agar hasilnya akurat.`
                      : 'Hasil cek akan tampil di sini setelah Anda menandai titik pemasangan.'
                }
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-fg-muted text-sm">
                      {address ?? 'Titik pemasangan'} · {result.point.lat.toFixed(5)},{' '}
                      {result.point.lng.toFixed(5)}
                    </p>
                    <h2 id="result-title" className="mt-1 text-xl font-bold md:text-2xl">
                      {orderable.length > 0
                        ? forPackage
                          ? 'Paket ini dapat diajukan di lokasi Anda'
                          : `${orderable.length} provider tersedia di lokasi ini`
                        : forPackage
                          ? 'Paket ini belum tersedia di lokasi Anda'
                          : 'Belum ada provider di lokasi ini'}
                    </h2>
                  </div>
                  {forPackage ? (
                    <ButtonLink
                      href={`/packages/${forPackage.pkg.slug}${qs({ lat: result.point.lat, lng: result.point.lng })}`}
                      variant="secondary"
                    >
                      <ArrowLeft aria-hidden="true" /> Kembali ke paket
                    </ButtonLink>
                  ) : (
                    orderable.length > 0 && (
                      <ButtonLink
                        href={`/packages${qs({ lat: result.point.lat, lng: result.point.lng })}`}
                      >
                        Lihat paket tersedia
                      </ButtonLink>
                    )
                  )}
                </div>
                <CoverageNotice className="mt-3" />
                {(orderable.length === 0 || rows.some((r) => r.status === 'REQUIRES_SURVEY')) && (
                  <ConsultPrompt
                    className="mt-4"
                    title={
                      orderable.length === 0
                        ? 'Butuh bantuan mencari internet di lokasi ini?'
                        : 'Ada provider yang perlu survei di lokasi ini'
                    }
                    body="Ajukan survei dan dapatkan kode untuk memantau statusnya, atau tanya langsung tim GMM."
                    action={{
                      href: `/permintaan${qs({ lat: result.point.lat, lng: result.point.lng, address: address ?? undefined })}`,
                      label: 'Ajukan survei',
                    }}
                    message={`Halo GMM, saya mengecek ketersediaan internet di ${address ?? 'lokasi saya'} (titik ${result.point.lat.toFixed(5)}, ${result.point.lng.toFixed(5)}). ${orderable.length === 0 ? 'Hasilnya belum ada provider. Apakah ada pilihan lain?' : 'Ada provider yang perlu survei. Bisa dibantu?'}`}
                  />
                )}

                {orderable.length === 0 && !forPackage && (
                  <Alert tone="warning" className="mt-4">
                    Belum ada provider terverifikasi di GMM yang mendaftarkan area layanan di titik
                    ini. Ini bukan berarti tidak ada internet sama sekali — pastikan pin sudah
                    tepat.
                  </Alert>
                )}

                <ul className="mt-5 space-y-3">
                  {rows.map((r) => (
                    <li key={r.provider.id}>
                      <Card className="p-5">
                        <div className="flex flex-wrap items-start gap-3">
                          <ProviderAvatar name={r.provider.displayName} />
                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-center gap-2 font-semibold">
                              <Link
                                href={`/provider/${r.provider.slug}`}
                                className="hover:text-primary"
                              >
                                {r.provider.displayName}
                              </Link>
                              {r.provider.isDemo && <DemoBadge />}
                            </p>
                            <p className="text-fg-muted mt-0.5 text-sm">
                              {COVERAGE_EXPLANATION[r.status]}
                            </p>
                          </div>
                          <CoverageStatusBadge status={r.status} />
                        </div>
                        {isOrderableCoverage(r.status) && (
                          <>
                            <dl className="border-line mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
                              <div>
                                <dt className="text-fg-muted flex items-center gap-1.5 text-xs">
                                  <Package className="size-3.5" aria-hidden="true" /> Paket tersedia
                                </dt>
                                <dd className="mt-0.5 font-medium">{r.packageCount} paket</dd>
                              </div>
                              <div>
                                <dt className="text-fg-muted text-xs">Harga mulai</dt>
                                <dd className="mt-0.5 font-medium">
                                  {r.startingPrice !== null
                                    ? `${formatRupiah(r.startingPrice)}/bln`
                                    : '—'}
                                </dd>
                              </div>
                              <div>
                                <dt className="text-fg-muted flex items-center gap-1.5 text-xs">
                                  <CalendarClock className="size-3.5" aria-hidden="true" /> Estimasi
                                  instalasi
                                </dt>
                                <dd className="mt-0.5 font-medium">{r.install}</dd>
                              </div>
                            </dl>
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                              {r.lastVerifiedAt && (
                                <p className="text-fg-muted text-xs">
                                  Data area diverifikasi {formatDate(r.lastVerifiedAt)}
                                </p>
                              )}
                              {!forPackage && (
                                <ButtonLink
                                  href={`/packages${qs({ lat: result.point.lat, lng: result.point.lng, provider: r.provider.slug })}`}
                                  variant="outline"
                                  size="sm"
                                >
                                  Lihat paket
                                </ButtonLink>
                              )}
                            </div>
                          </>
                        )}
                      </Card>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
