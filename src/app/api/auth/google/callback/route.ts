import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { authDeps, requestContext, setSessionCookie } from '@/lib/auth/session';
import { AppError } from '@/lib/errors';
import { loginWithGoogle } from '@/modules/auth/application/auth-service';
import { safeRedirectPath } from '@/modules/auth/domain/credentials';
import {
  exchangeGoogleCode,
  googleRedirectUri,
  OAUTH_COOKIE,
} from '@/modules/auth/infrastructure/google-oauth';

export const dynamic = 'force-dynamic';

/** Google redirects back here with ?code&state; on success the user lands on `next`. */
export async function GET(req: NextRequest) {
  const jar = await cookies();
  const raw = jar.get(OAUTH_COOKIE)?.value;
  jar.delete({ name: OAUTH_COOKIE, path: '/api/auth/google' });

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, req.url));

  let saved: { state: string; verifier: string; next: string; remember: boolean };
  try {
    saved = JSON.parse(raw ?? '');
  } catch {
    return fail('google_failed');
  }
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  if (!code || !state || state !== saved.state) return fail('google_failed');

  try {
    const identity = await exchangeGoogleCode({
      code,
      verifier: saved.verifier,
      redirectUri: googleRedirectUri(req.url),
    });
    const s = await loginWithGoogle(
      await authDeps(),
      { email: identity.email, fullName: identity.name },
      await requestContext(),
    );
    await setSessionCookie(s.token, s.expiresAt, saved.remember);
  } catch (err) {
    return fail(
      err instanceof AppError && err.code === 'FORBIDDEN' ? 'google_staff' : 'google_failed',
    );
  }
  return NextResponse.redirect(new URL(safeRedirectPath(saved.next), req.url));
}
