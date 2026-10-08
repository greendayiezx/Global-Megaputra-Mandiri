import { createHash, createHmac, randomBytes } from 'node:crypto';
import { hash, verify } from '@node-rs/argon2';

/** OWASP-recommended argon2id baseline (19 MiB, t=2, p=1). */
// algorithm 2 = Argon2id (the package exports it as a const enum, unusable with verbatimModuleSyntax).
const ARGON2 = { algorithm: 2, memoryCost: 19_456, timeCost: 2, parallelism: 1 };

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | null = null;
/**
 * Burns comparable time for unknown accounts so response timing does not reveal
 * whether an email is registered.
 */
export async function verifyAgainstDummy(password: string): Promise<void> {
  dummyHash ??= hashPassword('gmm-timing-equaliser-not-a-real-password');
  await verifyPassword(await dummyHash, password);
}

/** 256-bit random session token for the cookie; only its SHA-256 is stored. */
export function newSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Keyed hash for IPs/identifiers in logs and rate-limit keys (no raw IPs at rest). */
export function hmacIdentifier(value: string): string {
  const secret = process.env.RATE_LIMIT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('RATE_LIMIT_SECRET is required in production');
  }
  return createHmac('sha256', secret ?? 'gmm-dev-only-secret')
    .update(value)
    .digest('hex')
    .slice(0, 32);
}
