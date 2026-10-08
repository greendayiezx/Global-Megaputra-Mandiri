import { Bell, CalendarClock, LifeBuoy, ReceiptText, Wallet, Wifi } from 'lucide-react';
import type { Metadata } from 'next';
import { PageTitle } from '@/components/dashboard/dashboard-shell';
import { ButtonLink } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/primitives';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } };

export default async function CustomerDashboard() {
  const { user } = await requireSession('/dashboard');
  const firstName = user.fullName.split(' ')[0];

  const cards = [
    { icon: Wifi, title: 'Internet aktif', empty: 'Belum ada layanan aktif.' },
    { icon: CalendarClock, title: 'Status pemasangan', empty: 'Belum ada pemasangan berjalan.' },
    { icon: Wallet, title: 'Tagihan berikutnya', empty: 'Tidak ada tagihan.' },
    { icon: LifeBuoy, title: 'Tiket bantuan', empty: 'Tidak ada tiket terbuka.' },
  ];

  return (
    <>
      <PageTitle
        title={`Halo, ${firstName}`}
        description="Ringkasan layanan internet Anda."
        action={<ButtonLink href="/coverage">Cek Ketersediaan</ButtonLink>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ icon: Icon, title, empty }) => (
          <Card key={title} className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-fg-muted text-sm">{title}</p>
              <Icon className="text-fg-muted size-4" aria-hidden="true" />
            </div>
            <p className="text-fg-secondary mt-3 text-sm font-medium">{empty}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="last-order">
          <h2 id="last-order" className="mb-3 text-lg font-semibold">
            Pesanan terakhir
          </h2>
          <EmptyState
            icon={ReceiptText}
            title="Belum ada pesanan"
            description="Cek ketersediaan di lokasi Anda, pilih paket, lalu ajukan pemasangan."
            action={
              <ButtonLink href="/coverage" variant="secondary">
                Mulai cek lokasi
              </ButtonLink>
            }
          />
        </section>
        <section aria-labelledby="notif">
          <h2 id="notif" className="mb-3 text-lg font-semibold">
            Notifikasi terbaru
          </h2>
          <EmptyState
            icon={Bell}
            title="Belum ada notifikasi"
            description="Pembaruan pesanan dan pemasangan akan muncul di sini."
          />
        </section>
      </div>
    </>
  );
}
