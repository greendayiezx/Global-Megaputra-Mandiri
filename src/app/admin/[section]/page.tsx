import { notFound } from 'next/navigation';
import { Forbidden, ModulePending } from '@/components/dashboard/dashboard-shell';
import { requirePermission } from '@/lib/auth/session';

const SECTIONS: Record<string, { title: string; step: string; description: string }> = {
  orders: {
    title: 'Pesanan',
    step: 'STEP 5',
    description: 'Siklus hidup pesanan lengkap dengan riwayat status.',
  },
  payments: {
    title: 'Pembayaran',
    step: 'STEP 6',
    description: 'Transaksi, webhook, rekonsiliasi, dan refund (four-eyes).',
  },
  installations: {
    title: 'Instalasi',
    step: 'STEP 7',
    description: 'Jadwal, progres, dan QC instalasi lintas provider.',
  },
  tickets: {
    title: 'Tiket',
    step: 'STEP 11',
    description: 'Tiket pelanggan dengan SLA, penugasan, dan catatan internal.',
  },
  settings: {
    title: 'Pengaturan',
    step: 'STEP 3',
    description: 'Tarif pajak, kebijakan penagihan, SLA, dan retensi data.',
  },
};

export default async function AdminSection({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const { forbidden } = await requirePermission('dashboard.platform', `/admin/${section}`);
  if (forbidden) return <Forbidden />;
  const s = SECTIONS[section];
  if (!s) notFound();
  return <ModulePending {...s} />;
}
