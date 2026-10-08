import { BadgeCheck, FileCheck2, MapPinned, Package } from 'lucide-react';
import type { Metadata } from 'next';
import { ContentPage } from '@/components/layout/content-page';
import { ButtonLink } from '@/components/ui/button';
import { Alert, Card } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Jadi Mitra Provider',
  description:
    'Bergabung sebagai provider internet di GMM dan jangkau pelanggan di area layanan Anda.',
};

const STEPS = [
  {
    icon: FileCheck2,
    title: 'Daftar & unggah dokumen',
    body: 'Data perusahaan, PIC, dan dokumen legal (NIB, akta, NPWP) disimpan privat.',
  },
  {
    icon: BadgeCheck,
    title: 'Verifikasi oleh GMM',
    body: 'Tim kami memeriksa dokumen. Provider baru tampil setelah terverifikasi.',
  },
  {
    icon: MapPinned,
    title: 'Atur area layanan',
    body: 'Gambar polygon, radius, atau pilih wilayah administratif yang Anda layani.',
  },
  {
    icon: Package,
    title: 'Publikasikan paket',
    body: 'Isi harga, biaya pasang, SLA, dan kontrak. Paket ditinjau sebelum tayang.',
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
      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map(({ icon: Icon, title, body }, i) => (
          <li key={title}>
            <Card className="h-full p-5">
              <div className="flex items-center gap-3">
                <span className="bg-primary-soft text-primary grid size-10 place-items-center rounded-md">
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="text-fg-muted text-sm font-semibold">Langkah {i + 1}</span>
              </div>
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="text-fg-muted mt-1 text-sm">{body}</p>
            </Card>
          </li>
        ))}
      </ol>
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
