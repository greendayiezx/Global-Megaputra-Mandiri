import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/auth/auth-forms';
import { Alert, Card } from '@/components/ui/primitives';
import { getSession } from '@/lib/auth/session';
import { str, type RawSearchParams } from '@/lib/search-params';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/modules/auth/application/bootstrap';
import { safeRedirectPath } from '@/modules/auth/domain/credentials';

export const metadata: Metadata = { title: 'Masuk', robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const next = safeRedirectPath(str(await searchParams, 'next'));
  if (await getSession()) redirect(next);
  const showDemo =
    process.env.NODE_ENV !== 'production' && process.env.APP_SHOW_DEMO_DATA !== 'false';

  return (
    <div className="container-page grid place-items-center py-10 md:py-16">
      <div className="w-full max-w-md space-y-4">
        <Card className="p-6 md:p-8">
          <h1 className="text-2xl font-bold">Masuk ke GMM</h1>
          <p className="text-fg-muted mt-1 mb-6 text-sm">
            Pantau pesanan, pemasangan, dan tagihan Anda.
          </p>
          <LoginForm next={next} />
        </Card>
        {showDemo && (
          <Alert tone="warning" title="Akun demo (hanya lingkungan pengembangan)">
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
      </div>
    </div>
  );
}
