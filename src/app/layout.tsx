import './globals.css';

import type { Metadata, Viewport } from 'next';
import { CompareBar } from '@/components/compare/compare-controls';
import { MobileBottomNav } from '@/components/layout/nav-links';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { appConfig } from '@/config/app';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: {
    default: 'GMM — Temukan Internet Terbaik di Lokasimu',
    template: '%s · GMM',
  },
  description:
    'Bandingkan provider, pilih paket yang sesuai, dan pesan layanan internet dengan mudah di Global Megaputra Mandiri.',
  applicationName: 'GMM',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Demo-data notice bar, hidden for now. Set to true to show it again.
const SHOW_DEMO_BANNER = false;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <html lang="id">
      <body className="flex min-h-dvh flex-col">
        <a
          href="#konten"
          className="bg-navy sr-only z-50 rounded-md px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Lewati ke konten
        </a>
        <SiteHeader session={session} />
        {SHOW_DEMO_BANNER && appConfig.showDemoData && (
          <div className="border-warning/30 bg-warning-soft border-b">
            <p className="container-page text-warning-fg py-2 text-[13px]">
              <strong>Mode demo:</strong> provider, paket, harga, dan area layanan yang tampil
              adalah data contoh, bukan penawaran nyata.
            </p>
          </div>
        )}
        <main id="konten" className="flex-1 pb-20 lg:pb-0">
          {children}
        </main>
        <SiteFooter />
        <CompareBar />
        <MobileBottomNav />
      </body>
    </html>
  );
}
