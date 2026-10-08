import type { Metadata } from 'next';
import { ContentPage, Prose } from '@/components/layout/content-page';
import { Alert } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Kebijakan Privasi', robots: { index: false } };

export default function PrivacyPage() {
  return (
    <ContentPage crumb="Kebijakan Privasi" title="Kebijakan Privasi">
      <Alert tone="warning" title="Draf — menunggu tinjauan hukum">
        Kebijakan resmi (termasuk kontak petugas pelindungan data) diterbitkan setelah ditinjau
        penasihat hukum, mengacu pada UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
      </Alert>
      <div className="mt-6">
        <Prose>
          <h2>Data yang kami kumpulkan</h2>
          <ul>
            <li>
              Akun: nama lengkap, email, nomor ponsel — untuk pesanan dan komunikasi pemasangan.
            </li>
            <li>
              Lokasi pemasangan: alamat dan titik koordinat — untuk cek ketersediaan dan teknisi.
            </li>
            <li>KTP/NIK tidak diminta kecuali diwajibkan hukum untuk provider tertentu.</li>
          </ul>
          <h2>Dengan siapa data dibagikan</h2>
          <p>
            Hanya dengan provider yang Anda pesan, sebatas data yang diperlukan untuk pemasangan.
            Data calon pelanggan (leads) hanya dibagikan dengan persetujuan eksplisit.
          </p>
          <h2>Keamanan</h2>
          <p>
            Kata sandi disimpan dengan hashing argon2id, sesi memakai cookie HttpOnly, dan setiap
            aksi penting tercatat di audit log.
          </p>
        </Prose>
      </div>
    </ContentPage>
  );
}
