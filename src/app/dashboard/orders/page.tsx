import { ReceiptText } from 'lucide-react';
import type { Metadata } from 'next';
import { OrderTimeline } from '@/components/dashboard/order-timeline';
import { PageTitle } from '@/components/dashboard/dashboard-shell';
import { ButtonLink } from '@/components/ui/button';
import { Card, EmptyState } from '@/components/ui/primitives';
import { requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Pesanan Saya', robots: { index: false } };

export default async function OrdersPage() {
  await requireSession('/dashboard/orders');
  return (
    <>
      <PageTitle
        title="Pesanan"
        description="Pantau setiap pesanan dari pengajuan sampai internet aktif."
      />
      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <EmptyState
            icon={ReceiptText}
            title="Belum ada pesanan"
            description="Pesanan yang Anda ajukan akan tampil di sini lengkap dengan status terbarunya."
            action={<ButtonLink href="/packages">Cari paket</ButtonLink>}
          />
        </div>
        <Card className="p-5 xl:col-span-4">
          <h2 className="text-base font-semibold">Tahapan pesanan</h2>
          <p className="text-fg-muted mt-1 mb-5 text-sm">
            Setiap pesanan melewati tahapan berikut. Anda membayar setelah provider mengonfirmasi
            lokasi.
          </p>
          <OrderTimeline status={null} />
        </Card>
      </div>
    </>
  );
}
