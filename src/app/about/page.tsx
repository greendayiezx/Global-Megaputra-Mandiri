import type { Metadata } from 'next';
import { ContentPage, Prose } from '@/components/layout/content-page';
import { ButtonLink } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Tentang GMM',
  description:
    'Global Megaputra Mandiri: marketplace internet independen yang mempertemukan pelanggan dan provider.',
};

export default function AboutPage() {
  return (
    <ContentPage
      crumb="Tentang Kami"
      title="Tentang Global Megaputra Mandiri"
      description="Marketplace internet independen untuk pelanggan dan provider di Indonesia."
    >
      <Prose>
        <p>
          Memilih internet sering dimulai dari pertanyaan sederhana yang sulit dijawab: provider
          mana yang benar-benar bisa dipasang di alamat saya, berapa total biayanya, dan kapan
          aktif? GMM dibangun untuk menjawab pertanyaan itu secara jujur.
        </p>
        <h2>Yang kami lakukan</h2>
        <ul>
          <li>Mencocokkan titik lokasi Anda dengan area layanan provider terverifikasi.</li>
          <li>Menampilkan semua biaya wajib sejak awal, tanpa biaya yang muncul belakangan.</li>
          <li>Mendampingi pesanan dari konfirmasi provider sampai internet aktif.</li>
        </ul>
        <h2>Untuk provider</h2>
        <p>
          GMM membantu provider menjangkau pelanggan yang lokasinya memang berada di area layanan
          mereka, sehingga waktu tim sales dan teknisi terpakai untuk calon pelanggan yang tepat.
        </p>
        <h2>Prinsip kami</h2>
        <ul>
          <li>Tidak ada ulasan, rating, atau promo palsu.</li>
          <li>
            Hasil cek lokasi bukan jaminan pemasangan — provider tetap memastikan di lapangan.
          </li>
          <li>
            Data pribadi hanya diminta seperlunya dan dilindungi sesuai UU Pelindungan Data Pribadi.
          </li>
        </ul>
      </Prose>
      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/coverage">Cek Ketersediaan</ButtonLink>
        <ButtonLink href="/mitra" variant="secondary">
          Jadi Mitra Provider
        </ButtonLink>
      </div>
    </ContentPage>
  );
}
