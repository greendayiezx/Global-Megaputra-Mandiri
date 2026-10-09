import { BadgeCheck, FileCheck2, MapPinned, Package } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/content-page';
import { ButtonLink } from '@/components/ui/button';
import { Alert } from '@/components/ui/primitives';
import TimelineBlock01, { type TimelineEntry } from '@/components/ui/timeline-01';

export const metadata: Metadata = {
  title: 'Jadi Mitra Provider',
  description:
    'Bergabung sebagai provider internet di GMM dan jangkau pelanggan di area layanan Anda.',
};

const unsplash = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&h=675&q=75`;

const STEPS: TimelineEntry[] = [
  {
    icon: FileCheck2,
    date: 'Langkah 01',
    title: 'Daftar & unggah dokumen',
    description:
      'Isi data perusahaan dan PIC, lalu unggah dokumen legal (NIB, akta, NPWP). Dokumen disimpan privat dan hanya dibuka tim verifikasi GMM.',
    image: unsplash('photo-1450101499163-c8848c66ca85'),
    imageAlt: 'Ilustrasi: menandatangani dokumen pendaftaran',
  },
  {
    icon: BadgeCheck,
    date: 'Langkah 02',
    title: 'Verifikasi oleh GMM',
    description:
      'Tim kami memeriksa kelengkapan dan keabsahan dokumen. Provider baru tampil di marketplace setelah verifikasi selesai, lengkap dengan tanggalnya.',
    image: unsplash('photo-1521791136064-7986c2920216'),
    imageAlt: 'Ilustrasi: jabat tangan tanda kemitraan',
  },
  {
    icon: MapPinned,
    date: 'Langkah 03',
    title: 'Atur area layanan',
    description:
      'Gambar polygon, tentukan radius, atau pilih wilayah administratif yang Anda layani, supaya pelanggan hanya melihat Anda bila lokasinya terjangkau.',
    image: unsplash('photo-1524661135-423995f22d0b'),
    imageAlt: 'Ilustrasi: peta untuk menentukan wilayah layanan',
  },
  {
    icon: Package,
    date: 'Langkah 04',
    title: 'Publikasikan paket',
    description:
      'Isi harga, biaya pasang, SLA, dan kontrak secara lengkap. Paket ditinjau sebelum tayang agar semua biaya wajib terlihat jelas oleh pelanggan.',
    image: unsplash('photo-1520869562399-e772f042f422'),
    imageAlt: 'Ilustrasi: perangkat jaringan fiber optik',
  },
];

export default function MitraPage() {
  return (
    <ContentPage
      crumb="Jadi Mitra"
      title="Jadi Mitra Provider"
      description="Terima pesanan dari pelanggan yang lokasinya berada di area layanan Anda."
      wide
    >
      <TimelineBlock01
        badge="Langkah kemitraan"
        title="Empat langkah sampai paket Anda tayang"
        description="Dari pendaftaran hingga pesanan pertama: setiap provider melewati proses yang sama agar pelanggan GMM hanya melihat penawaran yang terverifikasi."
        items={STEPS}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-fg-muted text-sm">
              Foto adalah ilustrasi. Ketentuan komisi kemitraan sedang difinalisasi.
            </p>
            <ButtonLink href="/how-it-works#verifikasi" variant="secondary" size="sm">
              Detail proses verifikasi
            </ButtonLink>
          </div>
        }
      />
      <Alert tone="info" className="mt-6 max-w-3xl" title="Pendaftaran online segera dibuka">
        Formulir pendaftaran provider dan unggah dokumen aktif pada tahap pengembangan berikutnya.
        Ketentuan komisi kemitraan sedang difinalisasi.
      </Alert>
      <div className="mt-6 flex flex-wrap gap-3">
        <ButtonLink href="/register">Buat akun terlebih dahulu</ButtonLink>
        <ButtonLink href="/how-it-works#verifikasi" variant="secondary">
          Proses verifikasi
        </ButtonLink>
      </div>
    </ContentPage>
  );
}
