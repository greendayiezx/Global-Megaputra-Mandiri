import {
  ArrowRight,
  BadgeCheck,
  Handshake,
  MapPinned,
  MessageSquareOff,
  ReceiptText,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { PageHero } from '@/components/layout/page-hero';
import { ParallaxImage } from '@/components/motion/parallax-image';
import { Reveal } from '@/components/motion/reveal';
import { ButtonLink } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Tentang GMM',
  description:
    'Global Megaputra Mandiri: marketplace internet independen yang mempertemukan pelanggan dan provider.',
};

const WHAT_WE_DO = [
  {
    icon: MapPinned,
    title: 'Mencocokkan lokasi',
    body: 'Titik lokasi Anda dicocokkan dengan area layanan provider terverifikasi.',
  },
  {
    icon: ReceiptText,
    title: 'Biaya terbuka sejak awal',
    body: 'Semua biaya wajib tampil sejak awal, tanpa biaya yang muncul belakangan.',
  },
  {
    icon: Wrench,
    title: 'Mendampingi sampai aktif',
    body: 'Pesanan didampingi dari konfirmasi provider sampai internet aktif.',
  },
];

const PRINCIPLES = [
  { icon: MessageSquareOff, text: 'Tidak ada ulasan, rating, atau promo palsu.' },
  {
    icon: BadgeCheck,
    text: 'Hasil cek lokasi bukan jaminan pemasangan — provider tetap memastikan di lapangan.',
  },
  {
    icon: ShieldCheck,
    text: 'Data pribadi hanya diminta seperlunya dan dilindungi sesuai UU Pelindungan Data Pribadi.',
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        image="/images/GMM%20Login.png"
        imagePosition="object-[70%_center]"
        crumb="Tentang Kami"
        eyebrow="Tentang GMM"
        title="Tentang Global Megaputra Mandiri"
        description="Marketplace internet independen untuk pelanggan dan provider di Indonesia."
      />

      {/* Why we exist */}
      <section className="container-page pt-12 pb-4 md:pt-16">
        <Reveal className="max-w-3xl">
          <p className="text-fg-secondary text-lg leading-relaxed md:text-xl">
            Memilih internet sering dimulai dari pertanyaan sederhana yang sulit dijawab: provider
            mana yang benar-benar bisa dipasang di alamat saya, berapa total biayanya, dan kapan
            aktif? GMM dibangun untuk menjawab pertanyaan itu secara jujur.
          </p>
        </Reveal>
      </section>

      {/* What we do */}
      <section className="section container-page" aria-labelledby="do-title">
        <Reveal>
          <SectionHeader id="do-title" eyebrow="Pelanggan" title="Yang kami lakukan" />
        </Reveal>
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {WHAT_WE_DO.map(({ icon: Icon, title, body }, i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 90}
              className="border-line bg-surface shadow-card rounded-2xl border p-6"
            >
              <span className="bg-primary-soft text-primary grid size-11 place-items-center rounded-xl">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="text-fg-muted mt-1.5 text-[15px]">{body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* For providers — split with photo */}
      <section className="border-line bg-surface border-y" aria-labelledby="prov-title">
        <div className="container-page grid grid-cols-1 items-center gap-10 py-14 md:py-20 lg:grid-cols-2">
          <Reveal className="ring-line relative aspect-[16/10] overflow-hidden rounded-2xl ring-1">
            <Image
              src="/images/Futuristic%20Telecom%20Facility%20at%20Dusk.png"
              alt="Ilustrasi: fasilitas jaringan provider internet"
              fill
              sizes="(min-width: 1024px) 600px, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal delay={120}>
            <p className="border-primary/20 bg-primary-soft text-primary inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              Provider
            </p>
            <h2 id="prov-title" className="mt-3 text-2xl font-bold md:text-[32px] md:leading-tight">
              Untuk provider
            </h2>
            <p className="text-fg-secondary mt-4 text-[17px] leading-relaxed">
              GMM membantu provider menjangkau pelanggan yang lokasinya memang berada di area
              layanan mereka, sehingga waktu tim sales dan teknisi terpakai untuk calon pelanggan
              yang tepat.
            </p>
            <ButtonLink href="/mitra" variant="secondary" className="mt-6">
              <Handshake aria-hidden="true" /> Jadi Mitra Provider
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {/* Principles */}
      <section className="section container-page" aria-labelledby="pr-title">
        <Reveal>
          <SectionHeader id="pr-title" eyebrow="Prinsip" title="Prinsip kami" />
        </Reveal>
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, text }, i) => (
            <Reveal
              as="li"
              key={text}
              delay={i * 90}
              className="border-line bg-surface flex items-start gap-3 rounded-2xl border p-5"
            >
              <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <p className="text-[15px]">{text}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Closing band */}
      <section
        className="bleed-to-footer relative isolate mt-4 overflow-hidden bg-[#05122b]"
        aria-labelledby="ab-cta"
      >
        <ParallaxImage
          src="/images/Smart%20Home%20Wi-Fi%20Network%20at%20Dusk.png"
          strength={0.1}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.94)_0%,rgba(5,28,65,0.75)_55%,rgba(5,28,65,0.3)_100%)]"
        />
        <Reveal className="container-page py-20 md:py-24">
          <h2
            id="ab-cta"
            className="max-w-xl text-3xl leading-tight font-bold text-white md:text-[40px]"
          >
            Siap cek internet di lokasi Anda?
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/coverage" size="lg">
              Cek Ketersediaan <ArrowRight aria-hidden="true" />
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
