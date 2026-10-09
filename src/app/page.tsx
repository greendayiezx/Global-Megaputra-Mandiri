import {
  ArrowRight,
  Building2,
  ChevronDown,
  Gamepad2,
  GraduationCap,
  Headset,
  House,
  MessageSquareText,
  MousePointerClick,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { GmmHero } from '@/components/marketplace/gmm-hero';
import { PackageCard } from '@/components/marketplace/package-card';
import { ProviderCard } from '@/components/marketplace/provider-card';
import { ButtonLink } from '@/components/ui/button';
import { Card, EmptyState, SectionHeader } from '@/components/ui/primitives';
import { FAQ } from '@/content/faq';
import { formatRupiah } from '@/lib/format';
import { searchPackages, searchProviders } from '@/modules/packages/application/catalog';

const TRUST = [
  {
    icon: ShieldCheck,
    title: 'Provider Terverifikasi',
    body: 'Dokumen legal diperiksa tim GMM sebelum tampil.',
  },
  {
    icon: ReceiptText,
    title: 'Harga Transparan',
    body: 'Semua biaya wajib tampil sebelum Anda memesan.',
  },
  {
    icon: MousePointerClick,
    title: 'Proses Mudah',
    body: 'Cek lokasi, pilih paket, dan pesan dalam satu alur.',
  },
  {
    icon: Headset,
    title: 'Dukungan Pelanggan',
    body: 'Tim GMM mendampingi dari pemesanan hingga aktif.',
  },
];

const NEEDS = [
  {
    icon: House,
    title: 'Untuk Rumah',
    body: 'Streaming, belajar, dan banyak perangkat.',
    href: '/packages?minDownload=30',
  },
  {
    icon: Building2,
    title: 'Untuk Bisnis',
    body: 'Unggah stabil untuk kasir, CCTV, dan rapat.',
    href: '/packages?minUpload=50',
  },
  {
    icon: GraduationCap,
    title: 'Untuk Sekolah',
    body: 'Kelas daring dan lab komputer.',
    href: '/packages?minDownload=50',
  },
  {
    icon: Gamepad2,
    title: 'Untuk Gaming',
    body: 'Kecepatan tinggi untuk unduh dan main daring.',
    href: '/packages?minDownload=100',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Cek Lokasi',
    body: 'Tandai titik pemasangan untuk melihat provider yang menjangkau lokasi Anda.',
  },
  {
    n: '02',
    title: 'Pilih Paket',
    body: 'Bandingkan harga, kecepatan, dan biaya pemasangan hingga 4 paket sekaligus.',
  },
  {
    n: '03',
    title: 'Lakukan Pemesanan',
    body: 'Provider mengonfirmasi kelayakan lokasi dulu, baru Anda membayar.',
  },
  {
    n: '04',
    title: 'Instalasi & Aktif',
    body: 'Pilih jadwal teknisi dan pantau status sampai internet aktif.',
  },
];

const emptySearch = {
  point: null,
  q: null,
  technology: null,
  providerSlug: null,
  minDownload: null,
  minUpload: null,
  maxMonthly: null,
  maxInstallation: null,
  routerIncluded: false,
  noContract: false,
  promoOnly: false,
  sort: 'recommended' as const,
  page: 1,
};

export default async function HomePage() {
  const [providers, packages] = await Promise.all([
    searchProviders({
      point: null,
      q: null,
      technology: null,
      maxStartingPrice: null,
      minSpeed: null,
      slaStated: false,
    }),
    searchPackages(emptySearch),
  ]);
  const comparePreview = packages.items.slice(0, 3);

  return (
    <>
      {/* 1. Hero banner */}
      <GmmHero />

      {/* 2. Trust indicators */}
      <section aria-label="Keunggulan GMM" className="border-line bg-surface border-y">
        <ul className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-x-6 gap-y-5 px-4 py-7 min-[420px]:grid-cols-2 sm:px-6 md:px-8 lg:grid-cols-4">
          {TRUST.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-md">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-fg-muted mt-0.5 text-[13px] leading-snug">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Search by need */}
      <section className="section container-page" aria-labelledby="need-title">
        <SectionHeader id="need-title" title="Cari Internet Sesuai Kebutuhan Anda" />
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {NEEDS.map(({ icon: Icon, title, body, href }) => (
            <li key={title}>
              <Link
                href={href}
                className="group border-line bg-surface shadow-card hover:border-primary flex h-full items-start gap-3 rounded-lg border p-4 transition-colors"
              >
                <span className="bg-primary-soft text-primary grid size-10 shrink-0 place-items-center rounded-md">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center justify-between gap-2 font-semibold">
                    {title}
                    <ArrowRight
                      className="text-fg-muted group-hover:text-primary size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-fg-muted mt-0.5 block text-[13px]">{body}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4. Providers */}
      <section className="section border-line bg-surface border-y" aria-labelledby="prov-title">
        <div className="container-page">
          <SectionHeader
            id="prov-title"
            title="Provider Pilihan"
            description="Hanya provider yang sudah lolos verifikasi dokumen yang tampil di GMM."
            action={
              <ButtonLink href="/provider" variant="ghost" className="text-primary">
                Semua provider <ArrowRight aria-hidden="true" />
              </ButtonLink>
            }
          />
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.slice(0, 3).map((s) => (
              <ProviderCard key={s.provider.id} summary={s} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Packages */}
      <section className="section container-page" aria-labelledby="pkg-title">
        <SectionHeader
          id="pkg-title"
          title="Paket Internet Pilihan"
          description={
            <>
              Diurutkan dengan rumus rekomendasi yang kami publikasikan.{' '}
              <Link href="/how-it-works#urutan" className="text-primary hover:underline">
                Lihat caranya
              </Link>
            </>
          }
          action={
            <ButtonLink href="/packages" variant="ghost" className="text-primary">
              Semua paket <ArrowRight aria-hidden="true" />
            </ButtonLink>
          }
        />
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.items.slice(0, 3).map((v) => (
            <PackageCard key={v.pkg.id} view={v} />
          ))}
        </div>
      </section>

      {/* 6. Comparison CTA */}
      <section className="container-page" aria-labelledby="cmp-title">
        <div className="bg-navy grid gap-8 overflow-hidden rounded-xl p-6 text-white md:p-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 id="cmp-title" className="text-2xl font-bold text-white md:text-[28px]">
              Membandingkan Paket Internet Jadi Lebih Mudah
            </h2>
            <p className="mt-3 max-w-md text-white/75">
              Bandingkan harga, kecepatan, fitur, dan layanan dari berbagai provider dalam satu
              tempat.
            </p>
            <ButtonLink href="/packages" variant="inverse" size="lg" className="mt-6">
              Bandingkan Paket
            </ButtonLink>
          </div>
          {comparePreview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-white/15 bg-white/5">
              <table className="w-full min-w-[420px] text-sm">
                <caption className="sr-only">Cuplikan perbandingan paket (data demo)</caption>
                <thead>
                  <tr className="border-b border-white/15 text-left text-white/60">
                    <th scope="col" className="px-4 py-3 font-medium">
                      Paket
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Kecepatan
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Bulanan
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Instalasi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparePreview.map((v) => (
                    <tr key={v.pkg.id} className="border-b border-white/10 last:border-0">
                      <th scope="row" className="px-4 py-3 text-left font-medium text-white">
                        {v.pkg.name}
                      </th>
                      <td className="px-4 py-3 tabular-nums">{v.pkg.downloadMbps} Mbps</td>
                      <td className="px-4 py-3 tabular-nums">{formatRupiah(v.pkg.monthlyPrice)}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {v.pkg.installationFee === 0
                          ? 'Gratis'
                          : formatRupiah(v.pkg.installationFee)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 7. How it works */}
      <section className="section container-page" aria-labelledby="how-title">
        <SectionHeader id="how-title" title="Cara Kerja GMM" />
        <ol className="mt-8 grid gap-0 lg:grid-cols-4 lg:gap-6">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="relative flex gap-4 pb-8 last:pb-0 lg:flex-col lg:gap-3 lg:pb-0"
            >
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="bg-line absolute top-10 bottom-0 left-5 w-px lg:top-5 lg:right-0 lg:bottom-auto lg:left-14 lg:h-px lg:w-auto"
                />
              )}
              <span className="border-primary-border bg-primary-soft text-primary relative z-10 grid size-10 shrink-0 place-items-center rounded-md border text-sm font-bold">
                {s.n}
              </span>
              <div>
                <h3 className="text-[17px] font-semibold">{s.title}</h3>
                <p className="text-fg-muted mt-1 text-sm">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 8. Reviews — real reviews only */}
      <section className="container-page" aria-labelledby="rev-title">
        <SectionHeader id="rev-title" title="Ulasan Pelanggan" />
        <EmptyState
          className="mt-6"
          icon={MessageSquareText}
          title="Belum ada ulasan"
          description="Ulasan hanya dapat ditulis oleh pelanggan yang internetnya sudah aktif melalui GMM, dan akan ditampilkan apa adanya."
        />
      </section>

      {/* 9. FAQ */}
      <section className="section container-page" aria-labelledby="faq-title">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <SectionHeader
              id="faq-title"
              title="Pertanyaan Umum"
              description="Jawaban singkat sebelum Anda memesan."
            />
            <ButtonLink href="/faq" variant="secondary" className="mt-5">
              Semua pertanyaan
            </ButtonLink>
          </div>
          <div className="divide-line border-line bg-surface divide-y rounded-lg border lg:col-span-8">
            {FAQ.slice(0, 5).map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown
                    className="text-fg-muted size-4 shrink-0 transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="text-fg-secondary mt-2 text-sm">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Final CTA */}
      <section className="container-page">
        <Card className="flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div>
            <h2 className="text-xl font-bold md:text-2xl">
              Provider apa yang bisa dipasang di lokasi Anda?
            </h2>
            <p className="text-fg-muted mt-1">
              Cek gratis dalam hitungan detik, tanpa membuat akun.
            </p>
          </div>
          <ButtonLink href="/coverage" size="lg" className="shrink-0">
            Cek Ketersediaan
          </ButtonLink>
        </Card>
      </section>
    </>
  );
}
