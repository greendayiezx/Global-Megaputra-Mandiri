import { Headset, ShieldCheck, Tag, Zap } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoMark } from '@/components/brand/logo';

const FEATURES = [
  { icon: ShieldCheck, title: 'Provider Terverifikasi', body: 'Dokumen legal diperiksa tim GMM' },
  { icon: Tag, title: 'Harga Transparan', body: 'Semua biaya wajib tampil di awal' },
  { icon: Zap, title: 'Proses Mudah', body: 'Cek lokasi, pilih paket, pesan' },
  { icon: Headset, title: 'Dukungan Pelanggan', body: 'Didampingi hingga internet aktif' },
];

/**
 * Standalone auth screen: full-bleed "GMM Login" photo with a light wash, brand intro and
 * feature list on the left, the form card on the right (stacked on mobile).
 * The photo is looked up as .png then .jpg so either saved format works.
 */
export function AuthShell({
  heading,
  intro,
  children,
}: {
  heading: ReactNode;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="relative isolate min-h-dvh overflow-hidden bg-[#eaf3fd]">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-bottom bg-no-repeat"
        style={{
          backgroundImage:
            "url('/images/GMM%20Login.png'), url('/images/GMM%20Login.jpg'), url('/images/GMM%20Login.jpeg'), url('/images/GMM%20Login.webp')",
        }}
      />
      {/* Light wash so copy stays readable over the sky; stronger on small screens. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-b from-white/85 via-white/55 to-white/10 lg:bg-gradient-to-r lg:from-white/85 lg:via-white/50 lg:to-white/0"
      />

      <div className="container-header grid min-h-dvh items-center gap-8 py-6 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16 lg:py-10">
        <section className="max-w-xl lg:self-start lg:pt-6">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="GMM — Beranda">
            {/* multiply drops the logo file's white backdrop onto the light background */}
            <LogoMark className="size-14 rounded-none bg-transparent mix-blend-multiply" />
            <span className="leading-tight">
              <span className="text-navy block text-lg font-bold">Global Megaputra Mandiri</span>
              <span className="text-fg-muted block text-xs font-medium">
                Internet Marketplace &amp; Provider Platform
              </span>
            </span>
          </Link>
          <h1 className="text-navy mt-8 text-3xl leading-tight font-bold tracking-tight md:text-4xl">
            {heading}
          </h1>
          <p className="text-fg-secondary mt-4 max-w-md text-base leading-relaxed">{intro}</p>
          <ul className="mt-7 hidden grid-cols-2 gap-x-6 gap-y-5 sm:grid">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex items-center gap-3">
                <span className="border-primary-border text-primary grid size-10 shrink-0 place-items-center rounded-lg border bg-white/80 shadow-sm">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span>
                  <span className="text-navy block text-sm font-semibold">{title}</span>
                  <span className="text-fg-muted block text-xs">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="w-full lg:justify-self-end">{children}</section>
      </div>
    </div>
  );
}

/** White form card used on the auth screens. */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="border-line/70 rounded-2xl border bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.12)] md:p-8">
      <h2 className="text-navy text-2xl font-bold">{title}</h2>
      <p className="text-fg-muted mt-1 mb-6 text-sm">{description}</p>
      {children}
    </div>
  );
}
