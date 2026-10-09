import { MapPin, PackageSearch } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CoverageNotice } from '@/components/coverage/coverage-status';
import { FilterPanel } from '@/components/marketplace/filter-panel';
import { SortSelect } from '@/components/marketplace/sort-select';
import { PackageCard } from '@/components/marketplace/package-card';
import { PriceRange } from '@/components/marketplace/price-range';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/field';
import { Alert, Breadcrumb, EmptyState, Pagination } from '@/components/ui/primitives';
import {
  all,
  allOf,
  bool,
  int,
  oneOf,
  point,
  qs,
  str,
  type RawSearchParams,
} from '@/lib/search-params';
import {
  PRICE_RANGE,
  searchPackages,
  searchProviders,
  SORT_LABEL,
  SORTS,
  SPEED_RANGE_KEYS,
  SPEED_RANGES,
} from '@/modules/packages/application/catalog';
import { TECHNOLOGIES, TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';

export const metadata: Metadata = {
  title: 'Daftar Paket Internet',
  description:
    'Temukan paket internet terbaik sesuai kebutuhan Anda. Filter harga, kecepatan, provider, dan teknologi.',
};

/** A slider value sitting at (or beyond) its bound is no limit at all. */
function atBound(n: number | null, bound: number, side: 'min' | 'max'): number | null {
  if (n === null) return null;
  return (side === 'min' ? n <= bound : n >= bound) ? null : n;
}

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const pt = point(params);
  const f = {
    q: str(params, 'q'),
    technologies: allOf(params, 'technology', TECHNOLOGIES),
    providerSlugs: all(params, 'provider'),
    speedRanges: allOf(params, 'speed', SPEED_RANGE_KEYS),
    minDownload: int(params, 'minDownload'),
    minUpload: int(params, 'minUpload'),
    minMonthly: atBound(int(params, 'minMonthly'), PRICE_RANGE.min, 'min'),
    maxMonthly: atBound(int(params, 'maxMonthly'), PRICE_RANGE.max, 'max'),
    maxInstallation: int(params, 'maxInstallation'),
    routerIncluded: bool(params, 'router'),
    freeInstallation: bool(params, 'freeInstall'),
    contract12: bool(params, 'contract12'),
    noContract: bool(params, 'noContract'),
    promoOnly: bool(params, 'promo'),
    sort: oneOf(params, 'sort', SORTS) ?? 'recommended',
  };
  const [result, providers] = await Promise.all([
    searchPackages({ ...f, point: pt, page: int(params, 'page') ?? 1 }),
    searchProviders({
      point: null,
      q: null,
      technology: null,
      maxStartingPrice: null,
      minSpeed: null,
      slaStated: false,
    }),
  ]);

  const queryState = {
    lat: pt?.lat,
    lng: pt?.lng,
    q: f.q,
    technology: f.technologies,
    provider: f.providerSlugs,
    speed: f.speedRanges,
    minDownload: f.minDownload,
    minUpload: f.minUpload,
    minMonthly: f.minMonthly,
    maxMonthly: f.maxMonthly,
    maxInstallation: f.maxInstallation,
    router: f.routerIncluded ? 1 : null,
    freeInstall: f.freeInstallation ? 1 : null,
    contract12: f.contract12 ? 1 : null,
    noContract: f.noContract ? 1 : null,
    promo: f.promoOnly ? 1 : null,
    sort: f.sort === 'recommended' ? null : f.sort,
  };
  const locationQuery = pt ? qs({ lat: pt.lat, lng: pt.lng }) : '';
  const activeCount =
    [
      f.q,
      f.minDownload,
      f.minUpload,
      f.minMonthly ?? f.maxMonthly,
      f.maxInstallation,
      f.routerIncluded || null,
      f.freeInstallation || null,
      f.contract12 || null,
      f.noContract || null,
      f.promoOnly || null,
    ].filter((v) => v !== null).length +
    f.technologies.length +
    f.providerSlugs.length +
    f.speedRanges.length;

  return (
    <div className="container-page py-6 md:py-8">
      <Breadcrumb items={[{ label: 'Beranda', href: '/' }, { label: 'Paket' }]} />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold md:text-[32px]">Daftar Paket</h1>
          <p className="text-fg-muted mt-1">
            Temukan paket internet terbaik sesuai kebutuhan Anda.
          </p>
        </div>
      </div>

      {pt ? (
        <div className="border-primary-border bg-primary-soft mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3">
          <p className="text-primary-dark flex items-center gap-2 text-sm">
            <MapPin className="size-4" aria-hidden="true" />
            Hanya paket dari provider yang menjangkau titik {pt.lat.toFixed(4)}, {pt.lng.toFixed(4)}
          </p>
          <Link
            href={`/packages${qs({ ...queryState, lat: null, lng: null })}`}
            className="text-primary text-sm font-medium hover:underline"
          >
            Hapus lokasi
          </Link>
        </div>
      ) : (
        <Alert tone="info" className="mt-4">
          Paket di bawah belum disaring berdasarkan lokasi.{' '}
          <Link href="/coverage" className="font-semibold underline">
            Cek lokasi Anda
          </Link>{' '}
          untuk melihat paket yang bisa dipasang.
        </Alert>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <aside className="lg:col-span-3">
          <FilterPanel activeCount={activeCount}>
            <form
              id="package-filters"
              method="get"
              action="/packages"
              className="space-y-5"
              aria-label="Filter paket"
            >
              {pt && (
                <>
                  <input type="hidden" name="lat" value={pt.lat} />
                  <input type="hidden" name="lng" value={pt.lng} />
                </>
              )}
              {/* Filters set elsewhere (header search, homepage shortcuts) carry over. */}
              {(
                [
                  ['q', f.q],
                  ['minDownload', f.minDownload],
                  ['minUpload', f.minUpload],
                  ['maxInstallation', f.maxInstallation],
                  ['noContract', f.noContract ? 1 : null],
                  ['promo', f.promoOnly ? 1 : null],
                ] as const
              ).map(([name, value]) =>
                value === null ? null : (
                  <input key={name} type="hidden" name={name} value={value} />
                ),
              )}
              <p className="text-lg font-bold">Filter</p>
              <fieldset className="space-y-3">
                <legend className="mb-3 text-sm font-semibold">Harga Bulanan</legend>
                <PriceRange
                  min={PRICE_RANGE.min}
                  max={PRICE_RANGE.max}
                  step={PRICE_RANGE.step}
                  defaultLow={f.minMonthly}
                  defaultHigh={f.maxMonthly}
                />
              </fieldset>
              <fieldset className="border-line space-y-3 border-t pt-4">
                <legend className="mb-3 text-sm font-semibold">Kecepatan Download</legend>
                {SPEED_RANGES.map((r) => (
                  <Checkbox
                    key={r.key}
                    name="speed"
                    value={r.key}
                    defaultChecked={f.speedRanges.includes(r.key)}
                    label={`${r.min} Mbps - ${r.max} Mbps`}
                  />
                ))}
              </fieldset>
              <fieldset className="border-line space-y-3 border-t pt-4">
                <legend className="mb-3 text-sm font-semibold">Provider</legend>
                {providers.map((s) => (
                  <Checkbox
                    key={s.provider.id}
                    name="provider"
                    value={s.provider.slug}
                    defaultChecked={f.providerSlugs.includes(s.provider.slug)}
                    label={s.provider.displayName}
                  />
                ))}
              </fieldset>
              <fieldset className="border-line space-y-3 border-t pt-4">
                <legend className="mb-3 text-sm font-semibold">Teknologi</legend>
                {TECHNOLOGIES.map((t) => (
                  <Checkbox
                    key={t}
                    name="technology"
                    value={t}
                    defaultChecked={f.technologies.includes(t)}
                    label={TECHNOLOGY_LABEL[t]}
                  />
                ))}
              </fieldset>
              <fieldset className="border-line space-y-3 border-t pt-4">
                <legend className="mb-3 text-sm font-semibold">Fitur</legend>
                <Checkbox
                  name="router"
                  value="1"
                  defaultChecked={f.routerIncluded}
                  label="Router Gratis"
                />
                <Checkbox
                  name="freeInstall"
                  value="1"
                  defaultChecked={f.freeInstallation}
                  label="Instalasi Gratis"
                />
                <Checkbox
                  name="contract12"
                  value="1"
                  defaultChecked={f.contract12}
                  label="Kontrak 12 Bulan"
                />
              </fieldset>
              <div className="border-line flex gap-2 border-t pt-4">
                <Button type="submit" className="flex-1">
                  Terapkan
                </Button>
                {activeCount > 0 && (
                  <ButtonLink href={`/packages${locationQuery}`} variant="secondary">
                    Reset
                  </ButtonLink>
                )}
              </div>
            </form>
          </FilterPanel>
        </aside>

        <section className="lg:col-span-9" aria-labelledby="results-title">
          <h2 id="results-title" className="sr-only">
            Hasil
          </h2>
          <div className="border-line mb-4 flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <p className="text-fg-muted text-sm" aria-live="polite">
              <strong className="text-fg">{result.total}</strong> paket ditemukan
            </p>
            <SortSelect
              id="sort"
              formId="package-filters"
              value={f.sort}
              options={SORTS.map((s) => ({ value: s, label: SORT_LABEL[s] }))}
            />
          </div>
          {f.sort === 'best_rating' && (
            <Alert tone="info" className="mb-4">
              Belum ada ulasan terverifikasi, sehingga urutan mengikuti rekomendasi.
            </Alert>
          )}
          {pt && <CoverageNotice className="mb-4" />}

          {result.total === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Tidak ada paket yang cocok"
              description={
                f.promoOnly
                  ? 'Saat ini belum ada promo aktif dari provider.'
                  : pt
                    ? 'Belum ada provider terverifikasi yang melayani titik ini dengan filter tersebut.'
                    : 'Coba longgarkan filter harga atau kecepatan.'
              }
              action={
                <ButtonLink href={`/packages${locationQuery}`} variant="secondary">
                  Hapus filter
                </ButtonLink>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.items.map((v) => (
                <PackageCard key={v.pkg.id} view={v} query={locationQuery} />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              hrefFor={(p) => `/packages${qs({ ...queryState, page: p === 1 ? null : p })}`}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
