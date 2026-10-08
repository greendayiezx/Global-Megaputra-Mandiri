import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

const COLUMNS = [
  {
    title: 'Layanan',
    links: [
      { href: '/coverage', label: 'Cek coverage' },
      { href: '/packages', label: 'Daftar paket' },
      { href: '/provider', label: 'Daftar provider' },
      { href: '/compare', label: 'Bandingkan paket' },
      { href: '/promo', label: 'Promo' },
    ],
  },
  {
    title: 'Perusahaan',
    links: [
      { href: '/about', label: 'Tentang GMM' },
      { href: '/how-it-works', label: 'Cara kerja' },
      { href: '/blog', label: 'Blog' },
      { href: '/mitra', label: 'Jadi mitra provider' },
    ],
  },
  {
    title: 'Bantuan',
    links: [
      { href: '/faq', label: 'Pertanyaan umum' },
      { href: '/dashboard/support', label: 'Tiket bantuan' },
      { href: '/how-it-works#urutan', label: 'Cara kami mengurutkan paket' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-line bg-surface mt-16 border-t pb-20 lg:pb-0">
      <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-fg-muted text-sm">
            Marketplace internet independen. Bandingkan provider, pilih paket yang sesuai, dan pesan
            layanan internet dengan mudah.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-sm font-semibold">{col.title}</h2>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-fg-muted hover:text-primary text-sm">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-line border-t">
        <div className="container-page text-fg-muted flex flex-col gap-2 py-5 text-[13px] md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} Global Megaputra Mandiri</p>
          <p>
            Syarat layanan, kebijakan privasi, dan kebijakan refund sedang dalam tinjauan hukum.
          </p>
        </div>
      </div>
    </footer>
  );
}
