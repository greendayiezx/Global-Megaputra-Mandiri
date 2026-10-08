import { notFound } from 'next/navigation';
import { ModulePending } from '@/components/dashboard/dashboard-shell';
import { requireSession } from '@/lib/auth/session';

const SECTIONS: Record<string, { title: string; step: string; description: string }> = {
  subscriptions: {
    title: 'Langganan',
    step: 'STEP 8 (Customer portal)',
    description: 'Daftar layanan internet aktif Anda.',
  },
  invoices: {
    title: 'Tagihan',
    step: 'Fase 3 (Recurring billing)',
    description: 'Tagihan dan riwayat pembayaran bulanan.',
  },
  payments: {
    title: 'Pembayaran',
    step: 'STEP 6 (Payment)',
    description: 'Riwayat pembayaran pesanan.',
  },
  support: {
    title: 'Bantuan',
    step: 'STEP 11 (Support)',
    description: 'Buat dan pantau tiket gangguan atau pertanyaan.',
  },
  reviews: {
    title: 'Ulasan',
    step: 'Fase 2',
    description: 'Tulis ulasan setelah internet Anda aktif.',
  },
  notifications: {
    title: 'Notifikasi',
    step: 'Fase 2 (Notifications)',
    description: 'Semua pembaruan pesanan dan tagihan.',
  },
};

export default async function CustomerSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  await requireSession(`/dashboard/${section}`);
  const s = SECTIONS[section];
  if (!s) notFound();
  return <ModulePending {...s} />;
}
