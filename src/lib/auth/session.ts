import 'server-only';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getRateLimiter } from '@/lib/rate-limit';
import {
  resolveSession,
  type AuthDeps,
  type RequestContext,
  type SessionUser,
} from '@/modules/auth/application/auth-service';
import { getReadyDb } from '@/modules/auth/application/bootstrap';
import { can, type Action, type Actor } from '@/modules/auth/domain/rbac';

const isProd = process.env.NODE_ENV === 'production';
/** `__Host-` prefix in production: Secure, path=/, no Domain — cannot be set by subdomains. */
export const SESSION_COOKIE = isProd
  ? `__Host-${process.env.SESSION_COOKIE_NAME ?? 'gmm_session'}`
  : (process.env.SESSION_COOKIE_NAME ?? 'gmm_session');

export async function authDeps(): Promise<AuthDeps> {
  return { db: await getReadyDb(), limiter: getRateLimiter() };
}

export async function requestContext(): Promise<RequestContext> {
  const h = await headers();
  // Only trust X-Forwarded-For behind a known reverse proxy.
  const ip =
    process.env.TRUST_PROXY === 'true'
      ? (h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null)
      : (h.get('x-real-ip') ?? null);
  return { ip, userAgent: h.get('user-agent') };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | null> {
  return (await cookies()).get(SESSION_COOKIE)?.value ?? null;
}

export interface Session {
  actor: Actor;
  user: SessionUser;
}

/** Current session, memoised per request. */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = await readSessionToken();
  if (!token) return null;
  return resolveSession(await authDeps(), token);
});

/** Server-side page guard: redirects to login when anonymous. */
export async function requireSession(nextPath: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return session;
}

/**
 * Server-side permission guard for pages. Returns the session when allowed, or
 * `{ forbidden: true }` so the page can render a 403 state.
 */
export async function requirePermission(
  action: Action,
  nextPath: string,
): Promise<{ forbidden: false; session: Session } | { forbidden: true; session: Session }> {
  const session = await requireSession(nextPath);
  return { forbidden: !can(session.actor, action), session };
}
