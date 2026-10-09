import { ArrowRight, Wifi } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/logo';
import { HeroLocationForm } from '@/components/coverage/coverage-search-form';

/**
 * Homepage hero: one rounded banner with the smart-home-at-dusk artwork as background and
 * the copy on a navy gradient at the left.
 */
export function GmmHero() {
  return (
    <section aria-labelledby="hero-title" className="bg-surface">
      <div className="mx-auto w-full max-w-[1200px] px-4 pt-6 pb-8 sm:px-6 md:pt-8 md:pb-10">
        <div className="relative isolate flex min-h-[420px] items-center overflow-hidden rounded-[18px] bg-[#05122b] sm:min-h-[400px] lg:h-[420px] lg:min-h-0">
          <Image
            src="/images/Smart%20Home%20Wi-Fi%20Network%20at%20Dusk.png"
            alt=""
            fill
            priority
            sizes="(min-width: 1200px) 1168px, 100vw"
            className="-z-20 object-cover object-[65%_center] sm:object-[center_22%]"
          />
          {/* Mobile: text spans the width, so the overlay stays darker further right. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.94)_0%,rgba(5,28,65,0.84)_60%,rgba(5,28,65,0.5)_100%)] sm:bg-[linear-gradient(90deg,rgba(5,18,43,0.94)_0%,rgba(5,28,65,0.78)_42%,rgba(5,28,65,0.12)_100%)]"
          />

          <div className="w-full px-6 py-10 sm:px-8 md:px-10">
            <div className="max-w-[540px]">
              <p className="flex items-center gap-2.5">
                <LogoMark className="size-8 ring-1 ring-white/25" />
                <span className="text-base font-bold text-white md:text-lg">
                  GMM <span className="font-medium text-white/80">— Global Megaputra Mandiri</span>
                </span>
              </p>

              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
                <Wifi className="size-3.5 text-cyan-300" aria-hidden="true" />
                Marketplace Internet &amp; Provider
              </p>

              <h1
                id="hero-title"
                className="mt-3 text-[30px] leading-[1.12] font-bold tracking-tight text-white sm:text-[34px] lg:text-[40px]"
              >
                Temukan Internet Terbaik di Lokasimu
              </h1>
              <p className="mt-3 max-w-[480px] text-sm leading-relaxed text-blue-100/90 md:text-base">
                Bandingkan berbagai provider internet, pilih paket yang sesuai kebutuhan, dan
                nikmati layanan internet terbaik untuk kebutuhan Anda.
              </p>

              <HeroLocationForm className="mt-7" />

              <Link
                href="/packages"
                className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-100 transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Bandingkan Paket Internet
                <ArrowRight
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
