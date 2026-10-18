import { Suspense } from 'react';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { CompareBar } from '@/components/compare/compare-controls';
import { WhatsAppFab } from '@/components/consult/whatsapp-fab';
import { MobileBottomNav } from '@/components/layout/nav-links';
import { SiteFooter } from '@/components/layout/site-footer';
import { NavigationProgress } from '@/components/layout/navigation-progress';
import { SiteChrome } from '@/components/layout/site-chrome';
import { SiteHeader } from '@/components/layout/site-header';
import { appConfig } from '@/config/app';
import { siteUrl } from '@/lib/site-url';
import { getSession } from '@/lib/auth/session';

export const metadata: Metadata = {
  title: {
    default: 'GMM',
    template: '%s · GMM',
  },
  description:
    'Bandingkan provider, pilih paket yang sesuai, dan pesan layanan internet dengan mudah di Global Megaputra Mandiri.',
  applicationName: 'GMM',
  metadataBase: new URL(siteUrl()),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'GMM — Global Megaputra Mandiri',
  },
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
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <a
          href="#konten"
          className="bg-navy sr-only z-50 rounded-md px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Lewati ke konten
        </a>
        <SiteChrome>
          <SiteHeader session={session} />
        </SiteChrome>
        {SHOW_DEMO_BANNER && appConfig.showDemoData && (
          <div className="border-warning/30 bg-warning-soft border-b">
            <p className="container-page text-warning-fg py-2 text-[13px]">
              <strong>Mode demo:</strong> provider, paket, harga, dan area layanan yang tampil
              adalah data contoh, bukan penawaran nyata.
            </p>
          </div>
        )}
        <main id="konten" className="flex-1">
          {children}
        </main>
        <SiteChrome>
          {/* Room for the fixed mobile bottom nav. */}
          <div aria-hidden="true" data-bottom-spacer className="h-20 lg:hidden" />
          <SiteFooter />
          <CompareBar />
          <WhatsAppFab />
          <MobileBottomNav />
        </SiteChrome>
      </body>
    </html>
  );
}
