import { ShieldCheck } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/auth/auth-forms';
import { AuthCard, AuthShell } from '@/components/auth/auth-shell';
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
    <AuthShell
      heading={
        <>
          Temukan Internet Terbaik
          <br />
          di Lokasimu
        </>
      }
      intro="Bandingkan provider, pilih paket yang sesuai, dan nikmati proses pemesanan yang lebih mudah."
    >
      <AuthCard
        title="Daftar Akun"
        description="Buat akun Anda untuk mulai menggunakan layanan GMM."
      >
        <p className="bg-canvas text-fg-secondary mb-5 flex gap-2 rounded-md p-3 text-[13px]">
          <ShieldCheck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Kami hanya meminta data yang diperlukan untuk pemasangan. KTP tidak diminta kecuali
          diwajibkan secara hukum untuk provider tertentu.
        </p>
        <RegisterForm next={next} />
      </AuthCard>
    </AuthShell>
  );
}
