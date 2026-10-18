import { afterEach, describe, expect, it, vi } from 'vitest';
import robots from '@/app/robots';
import { absoluteUrl, isIndexable } from './site-url';

afterEach(() => vi.unstubAllEnvs());

describe('indexing', () => {
  it('blocks everything on staging even in a production build', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ENV', 'staging');
    expect(isIndexable()).toBe(false);
    expect(robots().rules).toEqual([{ userAgent: '*', disallow: '/' }]);
  });

  it('opens public pages in production but keeps portals and forms out', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('APP_URL', 'https://gmm.example/');
    const r = robots();
    expect(r.sitemap).toBe('https://gmm.example/sitemap.xml');
    expect(JSON.stringify(r.rules)).toContain('/admin');
    expect(JSON.stringify(r.rules)).toContain('/permintaan');
    expect(absoluteUrl('/packages')).toBe('https://gmm.example/packages');
  });
});
