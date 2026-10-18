import { CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Permintaan Terkirim', robots: { index: false } };

export default async function RequestSentPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const ref = (await searchParams).ref?.slice(0, 20) ?? '';
  return (
    <div className="container-page max-w-xl py-12 md:py-16">
      <Card className="p-6 text-center sm:p-8">
        <CheckCircle2 className="text-success-fg mx-auto size-12" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Permintaan terkirim</h1>
        <p className="text-fg-secondary mt-2">
          Tim GMM akan menghubungi Anda lewat nomor yang Anda isi. Simpan kode berikut untuk
          memantau status.
        </p>
        {ref && (
          <p className="bg-primary-soft text-primary mt-6 rounded-lg py-4 font-mono text-2xl font-bold tracking-widest">
            {ref}
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <ButtonLink href={`/permintaan/cek${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`}>
            Cek status
          </ButtonLink>
          <ButtonLink href="/packages" variant="secondary">
            Lihat paket lain
          </ButtonLink>
        </div>
      </Card>
    </div>
  );
}
