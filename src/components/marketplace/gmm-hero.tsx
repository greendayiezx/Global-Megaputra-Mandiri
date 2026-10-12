import {
  ArrowRight,
  Headset,
  MousePointerClick,
  ReceiptText,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import Link from 'next/link';
import { HeroCurve } from '@/components/layout/hero-curve';
import { HeroLocationForm } from '@/components/coverage/coverage-search-form';
import { HeroBackdrop, HeroDots, HeroHeadline, type HeroSlide } from './hero-slides';

const TRUST = [
  { icon: ShieldCheck, title: 'Provider Terverifikasi', body: 'Legalitas diperiksa tim GMM' },
  { icon: ReceiptText, title: 'Harga Transparan', body: 'Semua biaya tampil di awal' },
  { icon: MousePointerClick, title: 'Proses Mudah', body: 'Cek lokasi, pilih, pesan' },
  { icon: Headset, title: 'Dukungan Pelanggan', body: 'Didampingi sampai aktif' },
];

/** Optional background video: drop `public/videos/hero.mp4` (short, muted loop) to enable it. */
const HERO_VIDEO = '/videos/hero.mp4';
const inPublic = (path: string) => existsSync(join(process.cwd(), 'public', path));

/**
 * Banner slides: only the photo, title and subtitle change; the address form and the
 * comparison link stay put. A slide whose photo is not in public/images yet is skipped.
 */
function heroSlides(): HeroSlide[] {
  const slides: HeroSlide[] = [
    {
      image: '/images/Smart%20Home%20Wi-Fi%20Network%20at%20Dusk.png',
      tone: 'dark',
      // Provider tiles sit at the top of this photo; keep them clear of the header controls.
      belowHeader: true,
      title: 'Temukan Internet Terbaik di Lokasimu',
      subtitle:
        'Bandingkan berbagai provider internet, pilih paket yang sesuai kebutuhan, dan nikmati layanan internet terbaik untuk kebutuhan Anda.',
    },
  ];
  const hub = ['png', 'jpg', 'jpeg', 'webp']
    .map((ext) => `/images/Hub Konektivitas Digital Modern.${ext}`)
    .find(inPublic);
  if (hub) {
    slides.push({
      image: encodeURI(hub),
      tone: 'light',
      title: 'Temukan Provider Internet di Sekitarmu',
      subtitle:
        'Provider terverifikasi yang menjangkau lokasimu, dalam satu tempat. Bandingkan kecepatan, harga, dan biaya pasang sebelum memilih.',
    });
  }
  return slides;
}

/**
 * Full-bleed homepage hero: photo slides crossfade edge to edge under a navy gradient with a
 * slow zoom, the copy rises in, the trust points sit at the bottom, and a soft curve hands
 * over to the page below.
 */
export function GmmHero() {
  const video = inPublic(HERO_VIDEO) ? HERO_VIDEO : undefined;
  const slides = heroSlides();
  return (
    <section
      aria-labelledby="hero-title"
      className="herolight:bg-[#eaf3ff] relative isolate overflow-hidden bg-[#05122b] transition-colors duration-[1200ms]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-20">
        <HeroBackdrop slides={slides} video={video} />
      </div>
      <div
        aria-hidden="true"
        className="herolight:opacity-0 absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.95)_0%,rgba(5,28,65,0.85)_55%,rgba(5,28,65,0.55)_100%)] transition-opacity duration-[1200ms] sm:bg-[linear-gradient(90deg,rgba(5,18,43,0.94)_0%,rgba(5,28,65,0.72)_45%,rgba(5,28,65,0.08)_100%)]"
      />
      {/* Keeps the floating header's white text legible over bright parts of the photo. */}
      <div
        aria-hidden="true"
        className="herolight:opacity-0 absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#05122b]/70 to-transparent transition-opacity duration-[1200ms]"
      />
      {/* Light slide: soft white wash behind the copy (stronger on phones, where text covers the photo). */}
      <div
        aria-hidden="true"
        className="herolight:opacity-100 absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0.6)_60%,rgba(255,255,255,0.2)_100%)] opacity-0 transition-opacity duration-[1200ms] sm:bg-[linear-gradient(90deg,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.25)_45%,transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="herolight:opacity-0 absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#05122b]/80 to-transparent transition-opacity duration-[1200ms]"
      />

      <div className="container-page flex min-h-[700px] flex-col pt-[calc(var(--site-header-h)+3rem)] pb-28 sm:min-h-[660px] lg:min-h-[min(100svh,920px)] lg:pt-[calc(var(--site-header-h)+4rem)] lg:pb-32">
        <div className="my-auto max-w-[620px]">
          <p className="hero-rise herolight:border-primary/25 herolight:bg-primary-soft herolight:text-primary inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200 backdrop-blur-sm transition-colors duration-[1200ms]">
            <Wifi className="herolight:text-primary size-3.5 text-cyan-300" aria-hidden="true" />
            Marketplace Internet &amp; Provider
          </p>
          <HeroHeadline slides={slides} />
          <div className="hero-rise [animation-delay:300ms]">
            <HeroLocationForm className="mt-8" />
          </div>
          <Link
            href="/packages"
            className="hero-rise group herolight:text-primary herolight:hover:text-primary-hover herolight:focus-visible:outline-primary mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-100 transition-colors duration-200 [animation-delay:400ms] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Bandingkan Paket Internet
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
          {slides.length > 1 && (
            <div className="hero-rise mt-6 [animation-delay:450ms]">
              <HeroDots
                count={slides.length}
                labels={slides.map((sl, i) => `Banner ${i + 1}: ${sl.title}`)}
              />
            </div>
          )}
        </div>

        {/* Trust points: no box, a hairline above and thin dividers between columns */}
        <ul
          aria-label="Keunggulan GMM"
          className="hero-rise herolight:border-navy/15 herolight:lg:divide-navy/15 mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 transition-colors duration-[1200ms] [animation-delay:500ms] lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/15"
        >
          {TRUST.map(({ icon: Icon, title, body }) => (
            <li key={title} className="min-w-0 lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <p className="herolight:text-navy flex flex-col items-start gap-1.5 text-sm font-semibold text-white transition-colors duration-[1200ms] sm:flex-row sm:items-center sm:gap-2 sm:text-[15px]">
                <Icon
                  className="herolight:text-primary size-[18px] shrink-0 text-cyan-300"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {title}
              </p>
              <p className="herolight:text-fg-secondary mt-1 text-[13px] text-blue-100/80 transition-colors duration-[1200ms] lg:text-sm">
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <HeroCurve />
    </section>
  );
}
