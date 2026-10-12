import {
  ArrowRight,
  Headset,
  MousePointerClick,
  ReceiptText,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroLocationForm } from '@/components/coverage/coverage-search-form';

const TRUST = [
  { icon: ShieldCheck, title: 'Provider Terverifikasi', body: 'Dokumen legal diperiksa tim GMM.' },
  { icon: ReceiptText, title: 'Harga Transparan', body: 'Semua biaya tampil sebelum memesan.' },
  { icon: MousePointerClick, title: 'Proses Mudah', body: 'Cek lokasi, pilih, pesan.' },
  { icon: Headset, title: 'Dukungan Pelanggan', body: 'Didampingi sampai internet aktif.' },
];

/**
 * Full-bleed homepage hero: the smart-home-at-dusk photo runs edge to edge under a navy
 * gradient, zooms out slowly, and the copy rises in. The trust points sit on a glass strip
 * at the bottom, and a soft curve hands over to the page below.
 */
export function GmmHero() {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-[#05122b]">
      <div aria-hidden="true" className="hero-zoom absolute inset-0 -z-20">
        <Image
          src="/images/Smart%20Home%20Wi-Fi%20Network%20at%20Dusk.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] lg:object-center"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.95)_0%,rgba(5,28,65,0.85)_55%,rgba(5,28,65,0.55)_100%)] sm:bg-[linear-gradient(90deg,rgba(5,18,43,0.94)_0%,rgba(5,28,65,0.72)_45%,rgba(5,28,65,0.08)_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-[#05122b]/80 to-transparent"
      />

      <div className="container-page flex min-h-[640px] flex-col pt-14 pb-28 sm:min-h-[600px] lg:min-h-[min(calc(100svh-137px),820px)] lg:pt-20 lg:pb-32">
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

        {/* Trust strip on glass */}
        <ul
          aria-label="Keunggulan GMM"
          className="hero-rise mt-10 grid grid-cols-2 gap-x-4 gap-y-4 rounded-2xl border border-white/15 bg-white/[0.07] p-4 backdrop-blur-md [animation-delay:500ms] sm:p-5 lg:grid-cols-4 lg:gap-x-6"
        >
          {TRUST.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/10 text-cyan-200">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 hidden text-[13px] leading-snug text-blue-100/75 sm:block">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Soft curve into the page background */}
      <svg
        aria-hidden="true"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="text-canvas absolute inset-x-0 -bottom-px h-10 w-full sm:h-14 lg:h-20"
      >
        <path fill="currentColor" d="M0 44C360 84 1080 4 1440 44V80H0Z" />
      </svg>
    </section>
  );
}
