import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { safeRedirectPath } from '@/modules/auth/domain/credentials';
import {
  googleAuthUrl,
  googleConfig,
  googleRedirectUri,
  newOAuthState,
  OAUTH_COOKIE,
} from '@/modules/auth/infrastructure/google-oauth';

export const dynamic = 'force-dynamic';

/** Starts Google Sign-In: stores state + PKCE verifier briefly, then redirects to Google. */
export async function GET(req: NextRequest) {
  const cfg = googleConfig();
  const next = safeRedirectPath(req.nextUrl.searchParams.get('next'));
  if (!cfg) {
    return NextResponse.redirect(new URL('/login?error=google_unavailable', req.url));
  }
  const remember = req.nextUrl.searchParams.get('remember') === '1';
  const { state, verifier, challenge } = newOAuthState();
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ state, verifier, next, remember }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google',
    maxAge: 600,
  });
  return NextResponse.redirect(
    googleAuthUrl({
      clientId: cfg.clientId,
      redirectUri: googleRedirectUri(req.url),
      state,
      challenge,
    }),
  );
}
