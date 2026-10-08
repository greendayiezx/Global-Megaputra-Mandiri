/**
 * Credential rules. Password policy follows current NIST SP 800-63B guidance: length over
 * composition rules, a block-list of common passwords, no forced rotation.
 */

export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/** Login lockout: security policy (not a business decision), tuned conservatively. */
export const LOCKOUT = { maxFailures: 5, lockMinutes: 15 } as const;

const COMMON = new Set([
  'password123',
  'password1234',
  '1234567890',
  '12345678910',
  'qwertyuiop',
  'iloveyou123',
  'admin12345',
  'indonesia123',
  'bismillah123',
  'sayang12345',
  'qwerty12345',
  'passw0rd123',
]);

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Accepts 08xx, 628xx, +628xx; returns E.164 (+628…) or null when invalid. */
export function normalizeIndonesianPhone(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, '');
  let national: string;
  if (digits.startsWith('+62')) national = digits.slice(3);
  else if (digits.startsWith('62')) national = digits.slice(2);
  else if (digits.startsWith('0')) national = digits.slice(1);
  else return null;
  if (!/^8\d{8,11}$/.test(national)) return null;
  return `+62${national}`;
}

export function passwordIssues(password: string, email: string): string[] {
  const issues: string[] = [];
  if (password.length < PASSWORD_MIN) issues.push(`Minimal ${PASSWORD_MIN} karakter.`);
  if (password.length > PASSWORD_MAX) issues.push(`Maksimal ${PASSWORD_MAX} karakter.`);
  if (COMMON.has(password.toLowerCase())) issues.push('Kata sandi ini terlalu umum.');
  const local = normalizeEmail(email).split('@')[0] ?? '';
  if (local.length >= 4 && password.toLowerCase().includes(local)) {
    issues.push('Jangan memakai bagian dari email Anda.');
  }
  if (/^(.)\1+$/.test(password)) issues.push('Jangan memakai karakter yang sama berulang.');
  return issues;
}

export function isLocked(lockedUntil: Date | null, now: Date): boolean {
  return lockedUntil !== null && lockedUntil.getTime() > now.getTime();
}

/** State after a failed password attempt. */
export function afterFailedLogin(failedCount: number, now: Date) {
  const next = failedCount + 1;
  return next >= LOCKOUT.maxFailures
    ? { failedLoginCount: 0, lockedUntil: new Date(now.getTime() + LOCKOUT.lockMinutes * 60_000) }
    : { failedLoginCount: next, lockedUntil: null };
}

/**
 * Only same-site relative paths are allowed as post-login redirects (prevents open redirects
 * such as `//evil.example` or `/\evil.example`).
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(raw)) return fallback;
  return raw;
}
