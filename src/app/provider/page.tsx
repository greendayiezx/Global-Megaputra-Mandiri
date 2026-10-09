import { Building } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CoverageNotice } from '@/components/coverage/coverage-status';
import { FilterPanel } from '@/components/marketplace/filter-panel';
import { ProviderCard } from '@/components/marketplace/provider-card';
import { Button, ButtonLink } from '@/components/ui/button';
import { Checkbox, FieldHint, Input, Label } from '@/components/ui/field';
import { SelectMenu } from '@/components/ui/select-menu';
import { Breadcrumb, EmptyState } from '@/components/ui/primitives';
import { bool, int, oneOf, point, qs, str, type RawSearchParams } from '@/lib/search-params';
import { searchProviders } from '@/modules/packages/application/catalog';
import { TECHNOLOGIES, TECHNOLOGY_LABEL } from '@/modules/packages/application/catalog-repository';

export const metadata: Metadata = {
  title: 'Daftar Provider Internet Terverifikasi',
  description:
    'Bandingkan provider internet terverifikasi berdasarkan lokasi, teknologi, harga, dan kecepatan.',
};

export default async function ProvidersPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const pt = point(params);
  const f = {
    q: str(params, 'q'),
    technology: oneOf(params, 'technology', TECHNOLOGIES),
    maxStartingPrice: int(params, 'maxPrice'),
    minSpeed: int(params, 'minSpeed'),
    slaStated: bool(params, 'sla'),
  };
  const results = await searchProviders({ ...f, point: pt });
  const activeCount = [
    f.q,
    f.technology,
    f.maxStartingPrice,
    f.minSpeed,
    f.slaStated || null,
    pt,
  ].filter((v) => v !== null).length;

  return (
    <div className="container-page py-6 md:py-8">
      <Breadcrumb items={[{ label: 'Beranda', href: '/' }, { label: 'Provider' }]} />
      <div className="mt-4">
        <h1 className="text-[28px] font-bold md:text-[32px]">Daftar Provider</h1>
        <p className="text-fg-muted mt-1">
          Hanya provider yang sudah lolos verifikasi dokumen oleh tim GMM yang tampil di sini.
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
        <aside className="lg:col-span-3">
          <FilterPanel activeCount={activeCount}>
            <form
              method="get"
              action="/provider"
              className="space-y-5"
              aria-label="Filter provider"
            >
              <div>
                <Label htmlFor="pf-q">Kata kunci</Label>
                <Input
                  id="pf-q"
                  name="q"
                  defaultValue={f.q ?? ''}
                  placeholder="Nama provider atau area"
                />
              </div>
              <fieldset className="border-line border-t pt-4">
                <legend className="mb-2 text-sm font-semibold">Lokasi & coverage</legend>
                {pt ? (
                  <>
                    <input type="hidden" name="lat" value={pt.lat} />
                    <input type="hidden" name="lng" value={pt.lng} />
                    <p className="text-fg-secondary text-sm">
                      Menampilkan provider yang menjangkau titik {pt.lat.toFixed(4)},{' '}
                      {pt.lng.toFixed(4)}.
                    </p>
                    <Link
                      href={`/provider${qs({ q: f.q, technology: f.technology, maxPrice: f.maxStartingPrice, minSpeed: f.minSpeed, sla: f.slaStated ? 1 : null })}`}
                      className="text-primary mt-1 inline-block text-sm hover:underline"
                    >
                      Hapus lokasi
                    </Link>
                  </>
                ) : (
                  <>
                    <ButtonLink href="/coverage" variant="secondary" size="sm" className="w-full">
                      Tandai lokasi di peta
                    </ButtonLink>
                    <FieldHint>
                      Setelah cek lokasi, hanya provider yang menjangkau titik Anda yang tampil.
                    </FieldHint>
                  </>
                )}
              </fieldset>
              <fieldset className="border-line space-y-3 border-t pt-4">
                <legend className="mb-2 text-sm font-semibold">Layanan</legend>
                <SelectMenu
                  label="Teknologi"
                  name="technology"
                  defaultValue={f.technology ?? ''}
                  options={[
                    { value: '', label: 'Semua teknologi' },
                    ...TECHNOLOGIES.map((t) => ({ value: t, label: TECHNOLOGY_LABEL[t] })),
                  ]}
                />
                <div>
                  <Label htmlFor="pf-price">Harga mulai maks. (Rp/bulan)</Label>
                  <Input
                    id="pf-price"
                    name="maxPrice"
                    inputMode="numeric"
                    defaultValue={f.maxStartingPrice ?? ''}
                    placeholder="250000"
                  />
                </div>
                <SelectMenu
                  label="Kecepatan hingga minimal"
                  name="minSpeed"
                  defaultValue={f.minSpeed === null ? '' : String(f.minSpeed)}
                  options={[
                    { value: '', label: 'Semua kecepatan' },
                    ...[20, 50, 100, 150].map((n) => ({ value: String(n), label: `${n} Mbps` })),
                  ]}
                />
                <SelectMenu
                  label="Rating"
                  disabled
                  options={[{ value: '', label: 'Belum ada data ulasan' }]}
                  hint="Filter rating aktif setelah ada ulasan terverifikasi."
                />
                <Checkbox
                  name="sla"
                  value="1"
                  defaultChecked={f.slaStated}
                  label="Menyatakan SLA"
                />
              </fieldset>
              <div className="border-line flex gap-2 border-t pt-4">
                <Button type="submit" className="flex-1">
                  Terapkan
                </Button>
                {activeCount > 0 && (
                  <ButtonLink href="/provider" variant="secondary">
                    Reset
                  </ButtonLink>
                )}
              </div>
            </form>
          </FilterPanel>
        </aside>

        <section className="lg:col-span-9" aria-labelledby="prov-results">
          <h2 id="prov-results" className="sr-only">
            Hasil
          </h2>
          <p className="border-line text-fg-muted mb-4 border-b pb-4 text-sm" aria-live="polite">
            <strong className="text-fg">{results.length}</strong> provider ditemukan
          </p>
          {pt && <CoverageNotice className="mb-4" />}
          {results.length === 0 ? (
            <EmptyState
              icon={Building}
              title="Tidak ada provider yang cocok"
              description="Coba ubah filter, atau tandai ulang titik lokasi Anda."
              action={
                <ButtonLink href="/provider" variant="secondary">
                  Hapus filter
                </ButtonLink>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((s) => (
                <ProviderCard
                  key={s.provider.id}
                  summary={s}
                  query={pt ? qs({ lat: pt.lat, lng: pt.lng }) : ''}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
