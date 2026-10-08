import type { Metadata } from 'next';
import { PageTitle } from '@/components/dashboard/dashboard-shell';
import { Alert, Card } from '@/components/ui/primitives';
import { requireSession } from '@/lib/auth/session';
import { ROLES } from '@/modules/auth/domain/rbac';

export const metadata: Metadata = { title: 'Profil', robots: { index: false } };

export default async function ProfilePage() {
  const { user, actor } = await requireSession('/dashboard/profile');
  const rows: [string, string][] = [
    ['Nama lengkap', user.fullName],
    ['Email', user.email],
    ['Peran', actor.roles.map((r) => ROLES[r].name).join(', ')],
  ];
  return (
    <>
      <PageTitle
        title="Profil"
        description="Data akun yang kami simpan untuk keperluan pesanan Anda."
      />
      <Card>
        <dl className="divide-line divide-y">
          {rows.map(([k, v]) => (
            <div key={k} className="grid gap-1 px-5 py-4 text-sm sm:grid-cols-[200px_1fr]">
              <dt className="text-fg-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Alert tone="info" className="mt-4">
        Perubahan data profil, verifikasi email/ponsel, dan penghapusan akun tersedia pada tahap
        berikutnya.
      </Alert>
    </>
  );
}
