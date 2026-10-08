import type { Metadata } from 'next';
import { ContentPage, Prose } from '@/components/layout/content-page';
import { Alert } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Syarat Layanan', robots: { index: false } };

export default function TermsPage() {
  return (
    <ContentPage crumb="Syarat Layanan" title="Syarat Layanan">
      <Alert tone="warning" title="Draf — menunggu tinjauan hukum">
        Dokumen resmi akan diterbitkan setelah ditinjau penasihat hukum GMM. Poin di bawah adalah
        prinsip yang akan dituangkan, bukan perjanjian yang mengikat.
      </Alert>
      <div className="mt-6">
        <Prose>
          <ul>
            <li>
              Hasil cek ketersediaan bersifat informatif; kepastian pemasangan dikonfirmasi
              provider.
            </li>
            <li>Pelanggan membayar setelah provider mengonfirmasi bahwa lokasi dapat dilayani.</li>
            <li>Seluruh biaya wajib ditampilkan sebelum pesanan dibuat.</li>
            <li>Ketentuan refund mengikuti Kebijakan Refund yang akan diterbitkan.</li>
          </ul>
        </Prose>
      </div>
    </ContentPage>
  );
}
