import { ArrowLeft, BadgeCheck, FileCheck2, Package } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ProviderSignupForm } from '@/components/provider/provider-signup-form';
import { ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/primitives';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: 'Daftar Jadi Mitra Provider',
  description:
    'Daftarkan perusahaan penyedia internet Anda di GMM. Setelah diverifikasi, paket Anda tampil untuk pelanggan di area layanan Anda.',
};

const AFTER = [
  { icon: FileCheck2, text: 'Lengkapi profil di Portal Provider' },
  { icon: BadgeCheck, text: 'Tim GMM memverifikasi data perusahaan' },
  { icon: Package, text: 'Tambah paket dan area layanan, lalu ajukan untuk tayang' },
];

export default async function ProviderSignupPage() {
  const session = await getSession();

  return (
    <div className="container-page py-8 md:py-12">
      <Link
        href="/mitra"
        className="text-fg-muted hover:text-fg inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Jadi Mitra
      </Link>
      <h1 className="mt-3 text-[28px] leading-tight font-bold md:text-[36px]">
        Daftar jadi mitra provider
      </h1>
      <p className="text-fg-secondary mt-2 max-w-2xl">
        Sekitar 5 menit. Setelah mendaftar Anda langsung masuk ke Portal Provider untuk melengkapi
        data.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          {session ? (
            session.actor.providerId ? (
              <Alert tone="info" title="Akun Anda sudah terhubung ke provider">
                <ButtonLink href="/provider-dashboard" className="mt-3" size="sm">
                  Buka Portal Provider
                </ButtonLink>
              </Alert>
            ) : (
              <Alert tone="info" title={`Anda sedang masuk sebagai ${session.user.fullName}`}>
                Pendaftaran mitra memakai akun baru atas nama penanggung jawab perusahaan. Keluar
                terlebih dahulu, lalu buka halaman ini lagi.
              </Alert>
            )
          ) : (
            <ProviderSignupForm />
          )}
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="font-semibold">Setelah mendaftar</h2>
          <ol className="mt-4 space-y-4">
            {AFTER.map(({ icon: Icon, text }, i) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <span className="bg-primary-soft text-primary grid size-9 shrink-0 place-items-center rounded-lg">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <span className="pt-2">
                  {i + 1}. {text}
                </span>
              </li>
            ))}
          </ol>
          <p className="text-fg-muted mt-6 text-[13px]">
            Ketentuan komisi kemitraan sedang difinalisasi dan akan disampaikan sebelum paket Anda
            tayang.
          </p>
        </aside>
      </div>
    </div>
  );
}
