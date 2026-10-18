import { ArrowRight, MapPinned, ReceiptText, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/motion/reveal';
import { whatsappLink } from '@/config/contact';
import { consultImage } from './consult-image';
import { WhatsAppIcon } from './whatsapp-icon';

const HELP = [
  { icon: Sparkles, text: 'Rekomendasi paket sesuai cara Anda memakai internet' },
  { icon: MapPinned, text: 'Bantu cek lokasi dan jadwal survei bila diperlukan' },
  { icon: ReceiptText, text: 'Penjelasan semua biaya sebelum Anda memesan' },
];

/** Homepage block for visitors who are still unsure: photo, what we help with, two ways in. */
export function ConsultBand() {
  return (
    <section className="container-page pt-14 md:pt-20" aria-labelledby="consult-title">
      <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <Reveal className="relative aspect-[4/3] overflow-hidden rounded-2xl">
          <Image
            src={consultImage('card')}
            alt="Tim konsultasi GMM membantu pelanggan memilih paket internet"
            fill
            sizes="(min-width: 1024px) 600px, 100vw"
            className="object-cover"
          />
        </Reveal>
        <Reveal delay={120}>
          <p className="text-primary text-xs font-semibold tracking-wide uppercase">Konsultasi</p>
          <h2 id="consult-title" className="mt-2 text-2xl leading-tight font-bold md:text-[34px]">
            Masih bingung memilih paket?
          </h2>
          <p className="text-fg-secondary mt-3 text-[17px] leading-relaxed">
            Ceritakan kebutuhan dan lokasi Anda. Tim GMM membantu lewat WhatsApp.
          </p>
          <ul className="mt-6 space-y-3">
            {HELP.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-[15px]">
                <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={whatsappLink('Halo GMM, saya ingin konsultasi memilih paket internet.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-md bg-[#25D366] px-5 text-[15px] font-semibold text-white transition-colors hover:bg-[#1ebe5b]"
            >
              <WhatsAppIcon className="size-5" /> Chat WhatsApp
            </a>
            <Link
              href="/konsultasi"
              className="text-primary group inline-flex h-12 items-center gap-1.5 px-2 text-[15px] font-semibold"
            >
              Isi form konsultasi
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
