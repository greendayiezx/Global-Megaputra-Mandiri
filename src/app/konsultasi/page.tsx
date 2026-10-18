import { MapPinned, MessagesSquare, ReceiptText, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { consultImage } from '@/components/consult/consult-image';
import { ConsultForm } from '@/components/consult/consult-form';
import { WhatsAppIcon } from '@/components/consult/whatsapp-icon';
import { PageHero } from '@/components/layout/page-hero';
import { Reveal } from '@/components/motion/reveal';
import { Card } from '@/components/ui/primitives';
import { whatsappLink } from '@/config/contact';

export const metadata: Metadata = {
  title: 'Konsultasi',
  description:
    'Bingung memilih internet? Ceritakan kebutuhan dan lokasi Anda, tim GMM membantu lewat WhatsApp.',
};

const STEPS = [
  {
    icon: MessagesSquare,
    title: 'Ceritakan kebutuhan',
    body: 'Isi form singkat atau langsung chat.',
  },
  { icon: MapPinned, title: 'Kami cek lokasi', body: 'Provider mana yang menjangkau alamat Anda.' },
  { icon: Sparkles, title: 'Terima rekomendasi', body: 'Paket yang cocok beserta semua biayanya.' },
];

export default function KonsultasiPage() {
  return (
    <>
      <PageHero
        image={consultImage('hero')}
        imagePosition="object-[70%_center]"
        crumb="Konsultasi"
        eyebrow="Konsultasi"
        title="Bingung memilih internet? Tanya tim GMM."
        description="Ceritakan kebutuhan dan lokasi Anda. Kami bantu bandingkan provider dan biaya, lewat WhatsApp."
        compact
      />

      <section className="container-page pt-10 md:pt-14" aria-label="Cara konsultasi">
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <Reveal as="li" key={title} delay={i * 90} className="flex items-start gap-3">
              <span className="bg-primary-soft text-primary grid size-10 shrink-0 place-items-center rounded-xl">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">
                  {i + 1}. {title}
                </span>
                <span className="text-fg-muted block text-sm">{body}</span>
              </span>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="container-page pt-10 md:pt-12" aria-labelledby="form-title">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="p-5 sm:p-7">
            <h2 id="form-title" className="text-xl font-bold">
              Form konsultasi
            </h2>
            <p className="text-fg-muted mt-1 mb-6 text-sm">
              Semakin lengkap ceritanya, semakin tepat rekomendasinya.
            </p>
            <ConsultForm />
          </Card>
          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="font-semibold">Tanpa isi form, langsung tanya</h2>
              <p className="text-fg-muted mt-1 text-sm">
                Ceritakan kebutuhan Anda dengan bahasa sendiri, tim GMM yang merangkumnya.
              </p>
              <a
                href={whatsappLink('Halo GMM, saya ingin konsultasi memilih paket internet.')}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-3 rounded-lg bg-[#25D366] px-4 py-3 text-white transition-colors hover:bg-[#1ebe5b]"
              >
                <WhatsAppIcon className="size-7 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">Mulai chat di WhatsApp</span>
                  <span className="block text-[13px] text-white/90">
                    Dibalas tim GMM pada jam kerja
                  </span>
                </span>
              </a>
            </Card>
            <Card className="space-y-3 p-5 text-sm">
              <p className="flex items-start gap-2.5">
                <ReceiptText className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Kami menjelaskan semua biaya (bulanan, instalasi, aktivasi) sebelum Anda memesan.
              </p>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
