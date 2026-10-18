import type { MetadataRoute } from 'next';
import { isIndexable, siteUrl } from '@/lib/site-url';

/** Portals, accounts and personal-data forms stay out of search; staging is fully blocked. */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: [{ userAgent: '*', disallow: '/' }] };
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/provider-dashboard',
          '/dashboard',
          '/api/',
          '/login',
          '/register',
          '/permintaan',
          '/compare',
        ],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
