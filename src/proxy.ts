import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session-cookie';
import { isPortalPath } from '@/lib/portal-paths';

/** Length-independent comparison, so the check does not leak how much of a guess matched. */
function sameText(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/**
 * Optional password gate for a shared staging link: set STAGING_BASIC_AUTH="user:password" and
 * every page asks for it once (the browser remembers it for the session). Off when unset.
 */
function basicAuthChallenge(request: NextRequest): NextResponse | null {
  const expected = process.env.STAGING_BASIC_AUTH;
  if (!expected) return null;
  const header = request.headers.get('authorization') ?? '';
  if (header.startsWith('Basic ')) {
    try {
      const given = atob(header.slice(6));
      // "user:password" checks both; a value without ":" is a password with any username.
      const candidate = expected.includes(':') ? given : given.slice(given.indexOf(':') + 1);
      if (sameText(candidate, expected)) return null;
    } catch {
      // malformed base64: fall through to the challenge
    }
  }
  return new NextResponse('Autentikasi diperlukan.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="GMM Staging", charset="UTF-8"' },
  });
}

/**
 * 1. Staging password gate (above), when configured.
 * 2. Optimistic gate for the work portals: without a session cookie, send the visitor to the
 *    login page with a real 307 before anything renders. This only checks that a cookie
 *    exists; the session and permissions are still verified in the portal layouts and pages.
 */
export function proxy(request: NextRequest) {
  const challenge = basicAuthChallenge(request);
  if (challenge) return challenge;

  const { pathname, search } = request.nextUrl;
  if (!isPortalPath(pathname) || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL('/login', request.url);
  login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Every page and API route. Skipped: build assets, the tab icons, and the public marketing
  // images/videos — the image optimizer fetches /images internally without the visitor's
  // password, so gating them would break every photo behind the staging password.
  matcher: [
    '/((?!_next/static|_next/image|images/|videos/|favicon.ico|icon.png|apple-icon.png).*)',
  ],
};
