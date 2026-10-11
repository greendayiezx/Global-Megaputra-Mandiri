import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/auth-forms';
import { AuthCard, AuthShell } from '@/components/auth/auth-shell';
import { Alert } from '@/components/ui/primitives';
import { getSession } from '@/lib/auth/session';
import { str, type RawSearchParams } from '@/lib/search-params';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/modules/auth/application/bootstrap';
import { safeRedirectPath } from '@/modules/auth/domain/credentials';
import { isGoogleLoginEnabled } from '@/modules/auth/infrastructure/google-oauth';

export const metadata: Metadata = { title: 'Masuk', robots: { index: false } };

const GOOGLE_ERRORS: Record<string, string> = {
  google_unavailable: 'Login dengan Google belum diaktifkan.',
  google_failed: 'Login dengan Google gagal. Silakan coba lagi.',
  google_staff: 'Akun ini harus masuk dengan email dan kata sandi.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const next = safeRedirectPath(str(params, 'next'));
  const errorMessage = GOOGLE_ERRORS[str(params, 'error') ?? ''];
  if (await getSession()) redirect(next);
  const showDemo =
    process.env.NODE_ENV !== 'production' && process.env.APP_SHOW_DEMO_DATA !== 'false';

  return (
    <AuthShell
      heading={
        <>
          Selamat Datang di
          <br />
          Global Megaputra Mandiri
        </>
      }
      intro="Temukan internet terbaik di lokasimu. Bandingkan provider, pilih paket yang sesuai, dan nikmati proses pemesanan yang lebih mudah."
    >
      <AuthCard
        title="Masuk ke Akun Anda"
        description="Akses pesanan, pemasangan, dan layanan GMM Anda."
      >
        {errorMessage && (
          <Alert tone="danger" className="mb-4">
            {errorMessage}
          </Alert>
        )}
        <LoginForm next={next} googleEnabled={isGoogleLoginEnabled()} />
      </AuthCard>
      {showDemo && (
        <Alert tone="warning" className="mt-4" title="Akun demo (hanya lingkungan pengembangan)">
          <p>
            Kata sandi semua akun: <code className="font-semibold">{DEMO_PASSWORD}</code>
          </p>
          <ul className="mt-1 list-disc pl-4">
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.email}>
                <code>{a.email}</code> — {a.role}
              </li>
            ))}
          </ul>
        </Alert>
      )}
    </AuthShell>
  );
}
