import 'server-only';
import { createHash, randomBytes } from 'node:crypto';

/**
 * Google Sign-In via OAuth 2.0 / OpenID Connect (authorization code flow + PKCE).
 * Enabled only when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.
 */

/** Short-lived cookie holding state, PKCE verifier and redirect target during sign-in. */
export const OAUTH_COOKIE = 'gmm_google_oauth';

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function isGoogleLoginEnabled(): boolean {
  return googleConfig() !== null;
}

/** Callback URL registered in Google Cloud. APP_URL wins over the request origin (proxies). */
export function googleRedirectUri(requestUrl: string): string {
  const base = process.env.APP_URL?.trim() || new URL(requestUrl).origin;
  return new URL('/api/auth/google/callback', base).toString();
}

const b64url = (buf: Buffer) => buf.toString('base64url');

export function newOAuthState() {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(32));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  return { state, verifier, challenge };
}

export function googleAuthUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  challenge: string;
}): string {
  const url = new URL(AUTH_URL);
  url.search = new URLSearchParams({
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: opts.state,
    code_challenge: opts.challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  }).toString();
  return url.toString();
}

export interface GoogleIdentity {
  email: string;
  name: string;
}

/**
 * Exchanges the authorization code and validates the returned ID token's claims.
 * The token comes straight from Google's token endpoint over TLS, which OpenID Connect
 * Core §3.1.3.7 accepts in place of signature verification; audience, issuer, expiry and
 * email verification are still checked.
 */
export async function exchangeGoogleCode(opts: {
  code: string;
  verifier: string;
  redirectUri: string;
}): Promise<GoogleIdentity> {
  const cfg = googleConfig();
  if (!cfg) throw new Error('Google login is not configured');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: opts.code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: opts.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: opts.verifier,
    }),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status})`);
  const { id_token: idToken } = (await res.json()) as { id_token?: string };
  if (!idToken) throw new Error('Google response has no id_token');

  const payload = JSON.parse(Buffer.from(idToken.split('.')[1] ?? '', 'base64url').toString()) as {
    iss?: string;
    aud?: string;
    exp?: number;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };
  const verified = payload.email_verified === true || payload.email_verified === 'true';
  if (
    !payload.iss ||
    !ISSUERS.includes(payload.iss) ||
    payload.aud !== cfg.clientId ||
    !payload.exp ||
    payload.exp * 1000 < Date.now() ||
    !payload.email ||
    !verified
  ) {
    throw new Error('Google ID token failed validation');
  }
  return { email: payload.email, name: payload.name ?? '' };
}
