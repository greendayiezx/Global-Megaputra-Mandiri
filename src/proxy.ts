import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session-cookie';

/**
 * Optimistic gate for the work portals: without a session cookie, send the visitor to the
 * login page with a real 307 before anything renders. This only checks that a cookie exists;
 * the session and permissions are still verified in the portal layouts and pages.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const { pathname, search } = request.nextUrl;
  const login = new URL('/login', request.url);
  login.searchParams.set('next', pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/admin/:path*', '/provider-dashboard/:path*'],
};
