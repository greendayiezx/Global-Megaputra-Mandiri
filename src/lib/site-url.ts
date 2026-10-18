/** Public origin for absolute URLs (sitemap, canonical, Open Graph). Set APP_URL per environment. */
export function siteUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

/** Staging and other non-public deployments must never be indexed. */
export function isIndexable(): boolean {
  return process.env.APP_ENV !== 'staging' && process.env.NODE_ENV === 'production';
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
