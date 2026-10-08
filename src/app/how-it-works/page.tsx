import type { Metadata } from 'next';
import { CoverageStatusBadge } from '@/components/coverage/coverage-status';
import { ContentPage, Prose } from '@/components/layout/content-page';
import { ButtonLink } from '@/components/ui/button';
import { Card } from '@/components/ui/primitives';
import type { CoverageStatus } from '@/modules/coverage/domain/coverage';

export const metadata: Metadata = {
  title: 'Cara Kerja GMM',
  description: 'Bagaimana GMM mencocokkan lokasi, mengurutkan paket, dan memverifikasi provider.',
};

const STATUS: [CoverageStatus, string][] = [
  ['AVAILABLE', 'Titik Anda berada di area layanan yang didaftarkan provider.'],
  ['LIMITED', 'Area layanan ada, namun kapasitas atau jangkauannya terbatas.'],
  ['REQUIRES_SURVEY', 'Provider perlu memeriksa lokasi sebelum memastikan pemasangan.'],
  ['NOT_AVAILABLE', 'Provider belum melayani titik ini, atau sengaja mengecualikannya.'],
  ['UNKNOWN', 'Data belum cukup untuk memastikan.'],
];

export default function HowItWorksPage() {
  return (
    <ContentPage
      crumb="Cara Kerja"
      title="Cara Kerja GMM"
      description="Apa arti setiap hasil, bagaimana kami mengurutkan paket, dan kapan Anda membayar."
    >
      <section aria-labelledby="status">
        <h2 id="status" className="text-xl font-semibold">
          Arti status ketersediaan
        </h2>
        <Card className="mt-4">
          <dl className="divide-line divide-y">
            {STATUS.map(([s, text]) => (
              <div
                key={s}
                className="grid items-center gap-2 px-5 py-3.5 text-sm sm:grid-cols-[170px_1fr]"
              >
                <dt>
                  <CoverageStatusBadge status={s} />
                </dt>
                <dd className="text-fg-secondary">{text}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <p className="text-fg-muted mt-3 text-sm">
          Jika data beberapa area bertentangan, kami memakai data yang paling spesifik untuk titik
          Anda, lalu hasil yang paling hati-hati. Area yang dikecualikan provider selalu diutamakan.
        </p>
      </section>

      <div className="mt-10">
        <Prose>
          <h2 id="urutan" className="scroll-mt-40">
            Cara kami mengurutkan “Rekomendasi”
          </h2>
          <ol>
            <li>Kepastian ketersediaan di lokasi Anda (Tersedia → Terbatas → Perlu survei).</li>
            <li>Prioritas daftar yang ditetapkan tim GMM.</li>
            <li>Harga bulanan terendah.</li>
          </ol>
          <p>
            Tidak ada skor tersembunyi dan saat ini tidak ada penempatan berbayar. Bila suatu saat
            ada, paket tersebut diberi label “Sponsor”. “Nilai Terbaik” dihitung dari harga bulanan
            dibagi kecepatan download (Rp/Mbps).
          </p>
          <h2>Kapan Anda membayar</h2>
          <p>
            Setelah Anda memesan, provider mengonfirmasi bahwa lokasi Anda bisa dilayani. Baru
            setelah itu Anda diminta membayar. Jika pemasangan gagal setelah pembayaran, pesanan
            masuk ke proses pengembalian dana.
          </p>
          <h2 id="verifikasi" className="scroll-mt-40">
            Verifikasi provider
          </h2>
          <p>
            Provider mendaftar, mengunggah dokumen legal ke penyimpanan privat, lalu ditinjau tim
            GMM. Lencana “Verified Provider” hanya muncul setelah verifikasi selesai, lengkap dengan
            tanggalnya. Provider yang ditolak, ditangguhkan, atau masih ditinjau — beserta paketnya
            — tidak tampil di marketplace.
          </p>
        </Prose>
      </div>
      <ButtonLink href="/coverage" className="mt-10">
        Cek Ketersediaan
      </ButtonLink>
    </ContentPage>
  );
}
