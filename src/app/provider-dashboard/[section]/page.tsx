import { notFound } from 'next/navigation';
import { Forbidden, ModulePending } from '@/components/dashboard/dashboard-shell';
import { requirePermission } from '@/lib/auth/session';

const SECTIONS: Record<string, { title: string; step: string; description: string }> = {
  coverage: {
    title: 'Coverage',
    step: 'STEP 3',
    description: 'Gambar polygon, radius, atau area administratif layanan Anda.',
  },
  orders: {
    title: 'Pesanan',
    step: 'STEP 5',
    description: 'Konfirmasi atau tolak pesanan, lengkap dengan alasan.',
  },
  installations: {
    title: 'Instalasi',
    step: 'STEP 7',
    description: 'Jadwal teknisi, progres pemasangan, dan QC.',
  },
  customers: {
    title: 'Pelanggan',
    step: 'STEP 9',
    description: 'Pelanggan aktif hasil akuisisi GMM.',
  },
  leads: {
    title: 'Leads',
    step: 'Fase 3',
    description: 'Calon pelanggan yang menyetujui data mereka dibagikan.',
  },
  analytics: {
    title: 'Analitik',
    step: 'Fase 3',
    description: 'Funnel dari cek lokasi sampai aktivasi.',
  },
  settings: {
    title: 'Pengaturan',
    step: 'STEP 9',
    description: 'Pengguna provider, rekening, dan dokumen legal.',
  },
};

export default async function ProviderSection({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const { forbidden } = await requirePermission(
    'dashboard.provider',
    `/provider-dashboard/${section}`,
  );
  if (forbidden) return <Forbidden />;
  const s = SECTIONS[section];
  if (!s) notFound();
  return <ModulePending {...s} />;
}
