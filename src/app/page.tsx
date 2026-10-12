import { ArrowRight, MessageSquareText } from 'lucide-react';
import Link from 'next/link';
import { GmmHero } from '@/components/marketplace/gmm-hero';
import { CountUp } from '@/components/motion/count-up';
import { ParallaxImage } from '@/components/motion/parallax-image';
import { Reveal } from '@/components/motion/reveal';
import { PackageCard } from '@/components/marketplace/package-card';
import { ProviderCard } from '@/components/marketplace/provider-card';
import { ProviderMarquee } from '@/components/marketplace/provider-marquee';
import { StickyLocationBar } from '@/components/marketplace/sticky-location-bar';
import { ButtonLink } from '@/components/ui/button';
import { DemoBadge, EmptyState, SectionHeader } from '@/components/ui/primitives';
import { Faq } from '@/components/ui/faq';
import { FAQ } from '@/content/faq';
import { NEEDS } from '@/content/needs';
import { formatRupiah } from '@/lib/format';
import { searchPackages, searchProviders } from '@/modules/packages/application/catalog';

const emptySearch = {
  point: null,
  q: null,
  technologies: [],
  providerSlugs: [],
  speedRanges: [],
  minDownload: null,
  minUpload: null,
  minMonthly: null,
  maxMonthly: null,
  maxInstallation: null,
  routerIncluded: false,
  freeInstallation: false,
  contract12: false,
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
  // Only real figures from the catalogue (demo data is flagged as such).
  const stats = [
    { value: providers.length, label: 'Provider terverifikasi' },
    { value: packages.total, label: 'Paket internet' },
    {
      value: new Set(providers.flatMap((s) => s.provider.serviceAreaNames)).size,
      label: 'Wilayah layanan',
    },
  ];
  const statsAreDemo = providers.some((s) => s.provider.isDemo);

  return (
    <>
      {/* 1. Full-bleed hero (includes the trust strip) */}
      <GmmHero />
      <StickyLocationBar heroId="hero-title" />

      {/* 2. GMM in numbers — counts up on scroll, real values only */}
      <section aria-labelledby="stats-title" className="container-page pt-10 pb-4 md:pt-14">
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <Reveal>
            <p className="text-primary text-xs font-semibold tracking-wide uppercase">
              GMM dalam angka
            </p>
            <h2
              id="stats-title"
              className="mt-2 text-2xl font-bold md:text-[32px] md:leading-tight"
            >
              Satu tempat untuk membandingkan internet di lokasi Anda
            </h2>
            {statsAreDemo && (
              <p className="text-fg-muted mt-3 flex items-center gap-2 text-sm">
                <DemoBadge /> Angka dihitung dari data demo saat ini.
              </p>
            )}
          </Reveal>
          <dl className="grid grid-cols-3 gap-3 sm:gap-6">
            {stats.map((st, i) => (
              <Reveal
                key={st.label}
                delay={i * 90}
                className="border-line bg-surface shadow-card flex flex-col-reverse rounded-2xl border p-4 text-center sm:p-6"
              >
                <dt className="text-fg-muted mt-2 text-xs sm:text-sm">{st.label}</dt>
                <dd className="text-primary text-3xl font-bold tracking-tight sm:text-5xl">
                  <CountUp value={st.value} />
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      {/* Providers on GMM — names from the catalogue, scrolling slowly */}
      <section aria-label="Provider di GMM" className="pt-8 pb-2">
        <Reveal>
          <p className="text-fg-muted container-page mb-3 text-center text-xs font-semibold tracking-wide uppercase">
            Provider yang sudah bergabung di GMM
          </p>
          <ProviderMarquee
            providers={providers.map((s) => ({
              slug: s.provider.slug,
              displayName: s.provider.displayName,
              verified: s.provider.verificationStatus === 'VERIFIED',
            }))}
          />
        </Reveal>
      </section>

      {/* 3. Search by need — large photo tiles */}
      <section className="section container-page" aria-labelledby="need-title">
        <Reveal>
          <SectionHeader
            id="need-title"
            eyebrow="Kebutuhan"
            title="Cari Internet Sesuai Kebutuhan Anda"
            description="Mulai dari cara Anda memakai internet; kami saring paket yang cocok."
          />
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {NEEDS.map(({ icon: Icon, title, body, href, image, imageAlt }, i) => (
            <Reveal as="li" key={title} delay={i * 90}>
              <Link
                href={href}
                className="group bg-navy shadow-card focus-visible:outline-primary relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-2xl p-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:p-5 lg:aspect-[3/4]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- remote stock photo, sized by CSS */}
                <img
                  src={image}
                  alt={imageAlt}
                  loading="lazy"
                  className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-gradient-to-t from-[#05122b]/90 via-[#05122b]/35 to-transparent"
                />
                <span className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="mt-3 flex items-center justify-between gap-2 text-base font-semibold sm:text-lg">
                  {title}
                  <ArrowRight
                    className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-1 hidden text-[13px] leading-snug text-white/80 sm:block">
                  {body}
                </span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* 4. Providers */}
      <section className="section border-line bg-surface border-y" aria-labelledby="prov-title">
        <div className="container-page">
          <Reveal>
            <SectionHeader
              id="prov-title"
              eyebrow="Provider"
              title="Provider Pilihan"
              description="Hanya provider yang sudah lolos verifikasi dokumen yang tampil di GMM."
              action={
                <ButtonLink href="/provider" variant="ghost" className="text-primary">
                  Semua provider <ArrowRight aria-hidden="true" />
                </ButtonLink>
              }
            />
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {providers.slice(0, 3).map((s, i) => (
              <Reveal key={s.provider.id} delay={i * 90}>
                <ProviderCard summary={s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Packages */}
      <section className="section container-page" aria-labelledby="pkg-title">
        <Reveal>
          <SectionHeader
            id="pkg-title"
            eyebrow="Paket"
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
        </Reveal>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.items.slice(0, 3).map((v, i) => (
            <Reveal key={v.pkg.id} delay={i * 90}>
              <PackageCard view={v} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* 6. Comparison — full-bleed parallax band */}
      <section
        aria-labelledby="cmp-title"
        className="relative isolate overflow-hidden bg-[#05122b] text-white"
      >
        <ParallaxImage src="/images/Futuristic%20Telecom%20Facility%20at%20Dusk.png" />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.95)_0%,rgba(5,18,43,0.82)_50%,rgba(5,18,43,0.45)_100%)]"
        />
        <div className="container-page grid grid-cols-1 items-center gap-10 py-20 md:py-28 lg:grid-cols-2">
          <Reveal>
            <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200 uppercase">
              Bandingkan
            </p>
            <h2
              id="cmp-title"
              className="mt-4 text-3xl leading-tight font-bold text-white md:text-[42px]"
            >
              Membandingkan Paket Internet Jadi Lebih Mudah
            </h2>
            <p className="mt-4 max-w-md text-white/75 md:text-lg">
              Bandingkan harga, kecepatan, fitur, dan layanan dari berbagai provider dalam satu
              tempat.
            </p>
            <ButtonLink href="/packages" variant="inverse" size="lg" className="mt-8">
              Bandingkan Paket
            </ButtonLink>
          </Reveal>
          {comparePreview.length > 0 && (
            <Reveal
              delay={120}
              className="overflow-x-auto rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-md"
            >
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
            </Reveal>
          )}
        </div>
      </section>

      {/* 8. Reviews — real reviews only */}
      <section className="container-page pt-12 md:pt-16" aria-labelledby="rev-title">
        <Reveal>
          <SectionHeader id="rev-title" eyebrow="Ulasan" title="Ulasan Pelanggan" />
        </Reveal>
        <EmptyState
          className="mt-6"
          icon={MessageSquareText}
          title="Belum ada ulasan"
          description="Ulasan hanya dapat ditulis oleh pelanggan yang internetnya sudah aktif melalui GMM, dan akan ditampilkan apa adanya."
        />
      </section>

      {/* 9. FAQ */}
      <Faq
        id="faq"
        title="Pertanyaan Umum"
        description="Jawaban singkat sebelum Anda memesan."
        items={FAQ.slice(0, 6).map((f, i) => ({ id: `faq-${i}`, question: f.q, answer: f.a }))}
        defaultValue="faq-0"
        footer={
          <>
            <p>Masih ada pertanyaan?</p>
            <ButtonLink href="/faq" variant="secondary" className="mt-3">
              Semua pertanyaan
            </ButtonLink>
          </>
        }
      />

      {/* 10. Final CTA — full-bleed photo */}
      <section
        aria-labelledby="cta-title"
        className="bleed-to-footer relative isolate mt-12 flex min-h-[560px] items-center overflow-hidden bg-[#05122b] md:mt-16 lg:min-h-[680px]"
      >
        {/* Taller band, bottom-weighted crop: the van and technician stay in frame. */}
        <ParallaxImage
          src="/images/GMM%20Login.png"
          strength={0.06}
          imageClassName="object-[70%_75%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.92)_0%,rgba(5,28,65,0.75)_50%,rgba(5,28,65,0.15)_100%)]"
        />
        <Reveal className="container-page w-full py-20 md:py-28">
          <h2
            id="cta-title"
            className="max-w-xl text-3xl leading-tight font-bold text-white md:text-[42px]"
          >
            Provider apa yang bisa dipasang di lokasi Anda?
          </h2>
          <p className="mt-4 max-w-md text-white/80 md:text-lg">
            Cek gratis dalam hitungan detik, tanpa membuat akun.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/coverage" size="lg">
              Cek Ketersediaan
            </ButtonLink>
            <ButtonLink href="/mitra" variant="inverse" size="lg">
              Jadi Mitra Provider
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
