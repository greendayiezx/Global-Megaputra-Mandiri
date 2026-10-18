import type { Metadata } from 'next';
import { LookupForm } from '@/components/requests/lookup-form';

export const metadata: Metadata = {
  title: 'Cek Status Permintaan',
  description: 'Pantau status permintaan survei atau pemasangan internet Anda di GMM.',
};

export default async function RequestLookupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const ref = (await searchParams).ref?.slice(0, 20) ?? '';
  return (
    <div className="container-page max-w-3xl py-8 md:py-12">
      <h1 className="text-[28px] leading-tight font-bold md:text-[34px]">Cek status permintaan</h1>
      <p className="text-fg-secondary mt-2 mb-6">
        Masukkan kode referensi yang Anda terima dan 4 digit terakhir nomor ponsel yang didaftarkan.
      </p>
      <LookupForm initialRef={ref} />
    </div>
  );
}
