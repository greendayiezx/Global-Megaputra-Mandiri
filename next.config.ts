import type { NextConfig } from 'next';

/**
 * Security headers applied to every response.
 *
 * CSP note: the policy below is intentionally strict and does NOT allow
 * 'unsafe-inline' for scripts. Next.js injects inline bootstrap scripts, so the
 * nonce is attached per-request by `src/middleware.ts` and this static header
 * only covers the non-script directives. See docs/09-security-checklist.md.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  {
    key: 'Permissions-Policy',
    // Geolocation is required by the coverage engine, on the same origin only.
    value: 'camera=(), microphone=(), payment=(), usb=(), geolocation=(self)',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Fail the production build on type errors instead of shipping them.
  // (Next 16 no longer runs ESLint during build; CI runs `npm run lint` separately.)
  typescript: { ignoreBuildErrors: false },
  serverExternalPackages: ['@electric-sql/pglite'],

  // PGlite locates its WASM/data files via import.meta.url; bundling it breaks those paths
  // (notably on Windows), so load it with native Node.js require instead.
  serverExternalPackages: ['@electric-sql/pglite'],

  experimental: {
    // Server Actions are only accepted from these origins (CSRF hardening).
    serverActions: {
      allowedOrigins: process.env.APP_ALLOWED_ORIGINS?.split(',').filter(Boolean) ?? [],
    },
  },

  images: {
    // Provider logos / covers / article images are served from S3-compatible storage.
    remotePatterns: process.env.STORAGE_PUBLIC_HOST
      ? [{ protocol: 'https', hostname: process.env.STORAGE_PUBLIC_HOST }]
      : [],
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
