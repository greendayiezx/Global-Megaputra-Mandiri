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
import Image from 'next/image';
import Link from 'next/link';
import { HeroCurve } from '@/components/layout/hero-curve';
import { HeroLocationForm } from '@/components/coverage/coverage-search-form';

const TRUST = [
  { icon: ShieldCheck, title: 'Provider Terverifikasi', body: 'Legalitas diperiksa tim GMM' },
  { icon: ReceiptText, title: 'Harga Transparan', body: 'Semua biaya tampil di awal' },
  { icon: MousePointerClick, title: 'Proses Mudah', body: 'Cek lokasi, pilih, pesan' },
  { icon: Headset, title: 'Dukungan Pelanggan', body: 'Didampingi sampai aktif' },
];

/**
 * Full-bleed homepage hero: the smart-home-at-dusk photo runs edge to edge under a navy
 * gradient, zooms out slowly, and the copy rises in. The trust points sit on a glass strip
 * at the bottom, and a soft curve hands over to the page below.
 */
/** Optional background video: drop `public/videos/hero.mp4` (short, muted loop) to enable it. */
const HERO_VIDEO = '/videos/hero.mp4';
const hasHeroVideo = () => existsSync(join(process.cwd(), 'public', HERO_VIDEO));

export function GmmHero() {
  const video = hasHeroVideo();
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[#05122b]">
      {/* Desktop: the photo starts below the floating header (so the provider tiles keep clear
          of its controls) and its top edge fades into the navy background. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 lg:top-[calc(var(--site-header-h)+1.5rem)] lg:[mask-image:linear-gradient(to_bottom,transparent,#000_120px)]"
      >
        <div className="hero-zoom absolute inset-0">
          <Image
            src="/images/Smart%20Home%20Wi-Fi%20Network%20at%20Dusk.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] lg:object-top"
          />
          {/* The photo stays underneath as poster and as the reduced-motion fallback. */}
          {video && (
            <video
              className="absolute inset-0 size-full object-cover motion-reduce:hidden"
              src={HERO_VIDEO}
              poster="/images/Smart%20Home%20Wi-Fi%20Network%20at%20Dusk.png"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          )}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.95)_0%,rgba(5,28,65,0.85)_55%,rgba(5,28,65,0.55)_100%)] sm:bg-[linear-gradient(90deg,rgba(5,18,43,0.94)_0%,rgba(5,28,65,0.72)_45%,rgba(5,28,65,0.08)_100%)]"
      />
      {/* Keeps the floating header's white text legible over bright parts of the photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#05122b]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#05122b]/80 to-transparent"
      />

      <div className="container-page flex min-h-[700px] flex-col pt-[calc(var(--site-header-h)+3rem)] pb-28 sm:min-h-[660px] lg:min-h-[min(100svh,920px)] lg:pt-[calc(var(--site-header-h)+4rem)] lg:pb-32">
        <div className="my-auto max-w-[620px]">
          <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200 backdrop-blur-sm">
            <Wifi className="size-3.5 text-cyan-300" aria-hidden="true" />
            Marketplace Internet &amp; Provider
          </p>
          <h1
            id="hero-title"
            className="hero-rise mt-4 text-[36px] leading-[1.05] font-bold tracking-tight text-white [animation-delay:100ms] sm:text-[48px] lg:text-[60px]"
          >
            Temukan Internet Terbaik di Lokasimu
          </h1>
          <p className="hero-rise mt-4 max-w-[520px] text-[15px] leading-relaxed text-blue-100/90 [animation-delay:200ms] md:text-lg">
            Bandingkan berbagai provider internet, pilih paket yang sesuai kebutuhan, dan nikmati
            layanan internet terbaik untuk kebutuhan Anda.
          </p>
          <div className="hero-rise [animation-delay:300ms]">
            <HeroLocationForm className="mt-8" />
          </div>
          <Link
            href="/packages"
            className="hero-rise group mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-100 transition-colors duration-200 [animation-delay:400ms] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Bandingkan Paket Internet
            <ArrowRight
              className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        {/* Trust points: no box, a hairline above and thin dividers between columns */}
        <ul
          aria-label="Keunggulan GMM"
          className="hero-rise mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/15 pt-6 [animation-delay:500ms] lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-white/15"
        >
          {TRUST.map(({ icon: Icon, title, body }) => (
            <li key={title} className="min-w-0 lg:px-8 lg:first:pl-0 lg:last:pr-0">
              <p className="flex flex-col items-start gap-1.5 text-sm font-semibold text-white sm:flex-row sm:items-center sm:gap-2 sm:text-[15px]">
                <Icon
                  className="size-[18px] shrink-0 text-cyan-300"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {title}
              </p>
              <p className="mt-1 text-[13px] text-blue-100/80 lg:text-sm">{body}</p>
            </li>
          ))}
        </ul>
      </div>
      <HeroCurve />
    </section>
  );
}
