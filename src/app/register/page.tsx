import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/auth-forms';
import { Card } from '@/components/ui/primitives';
import { getSession } from '@/lib/auth/session';
import { str, type RawSearchParams } from '@/lib/search-params';
import { safeRedirectPath } from '@/modules/auth/domain/credentials';

export const metadata: Metadata = { title: 'Daftar Akun', robots: { index: false } };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const next = safeRedirectPath(str(await searchParams, 'next'));
  if (await getSession()) redirect(next);

  return (
    <div className="container-page grid place-items-center py-10 md:py-16">
      <Card className="w-full max-w-md p-6 md:p-8">
        <h1 className="text-2xl font-bold">Buat akun pelanggan</h1>
        <p className="text-fg-muted mt-1 text-sm">
          Untuk memesan internet dan memantau pemasangan.
        </p>
        <p className="bg-canvas text-fg-secondary mt-4 mb-6 flex gap-2 rounded-md p-3 text-[13px]">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Kami hanya meminta data yang diperlukan untuk pemasangan. KTP tidak diminta kecuali
          diwajibkan secara hukum untuk provider tertentu.
        </p>
        <RegisterForm next={next} />
      </Card>
    </div>
  );
}
