import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-url';
import { listPublicPackages, listPublicProviders } from '@/modules/packages/application/catalog';

// Regenerated at most hourly; only verified providers and live packages are listed.
export const revalidate = 3600;

const STATIC: { path: string; priority: number }[] = [
  { path: '/', priority: 1 },
  { path: '/coverage', priority: 0.9 },
  { path: '/packages', priority: 0.9 },
  { path: '/provider', priority: 0.8 },
  { path: '/konsultasi', priority: 0.7 },
  { path: '/how-it-works', priority: 0.6 },
  { path: '/mitra', priority: 0.6 },
  { path: '/mitra/daftar', priority: 0.5 },
  { path: '/about', priority: 0.5 },
  { path: '/faq', priority: 0.5 },
  { path: '/blog', priority: 0.4 },
  { path: '/terms', priority: 0.2 },
  { path: '/privacy', priority: 0.2 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [providers, packages] = await Promise.all([listPublicProviders(), listPublicPackages()]);
  return [
    ...STATIC.map((s) => ({ url: `${base}${s.path}`, priority: s.priority })),
    ...providers.map((p) => ({
      url: `${base}/provider/${p.slug}`,
      lastModified: p.verifiedAt ?? undefined,
      priority: 0.7,
    })),
    ...packages.map(({ pkg }) => ({
      url: `${base}/packages/${pkg.slug}`,
      lastModified: pkg.lastPriceVerifiedAt ?? pkg.publishedAt ?? undefined,
      priority: 0.6,
    })),
  ];
}
