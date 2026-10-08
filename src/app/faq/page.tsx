import { ChevronDown } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/content-page';
import { ButtonLink } from '@/components/ui/button';
import { FAQ } from '@/content/faq';

export const metadata: Metadata = {
  title: 'Pertanyaan Umum',
  description:
    'Jawaban atas pertanyaan umum tentang cek ketersediaan, biaya, pembayaran, dan pemasangan.',
};

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return (
    <ContentPage
      crumb="FAQ"
      title="Pertanyaan Umum"
      description="Belum menemukan jawabannya? Tim GMM siap membantu."
    >
      <div className="divide-line border-line bg-surface shadow-card divide-y rounded-lg border">
        {FAQ.map((f) => (
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
      <ButtonLink href="/coverage" className="mt-8">
        Cek Ketersediaan
      </ButtonLink>
      <script
        type="application/ld+json"
        // Static, developer-authored content only — never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    </ContentPage>
  );
}
