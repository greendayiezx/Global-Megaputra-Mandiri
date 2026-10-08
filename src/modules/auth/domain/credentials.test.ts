import { describe, expect, it } from 'vitest';
import {
  afterFailedLogin,
  isLocked,
  LOCKOUT,
  normalizeEmail,
  normalizeIndonesianPhone,
  passwordIssues,
  safeRedirectPath,
} from './credentials';

describe('credentials', () => {
  it('normalises emails and Indonesian phone numbers', () => {
    expect(normalizeEmail('  Budi@Example.COM ')).toBe('budi@example.com');
    expect(normalizeIndonesianPhone('0812-3456-7890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhone('+62 812 3456 7890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhone('6281234567890')).toBe('+6281234567890');
    expect(normalizeIndonesianPhone('021555123')).toBeNull();
    expect(normalizeIndonesianPhone('12345')).toBeNull();
  });

  it('enforces length, block-list and email-derived passwords', () => {
    expect(passwordIssues('short', 'a@b.co')).toHaveLength(1);
    expect(passwordIssues('Password123', 'a@b.co')).toContain('Kata sandi ini terlalu umum.');
    expect(passwordIssues('budisantoso-99', 'budisantoso@mail.com')).toContain(
      'Jangan memakai bagian dari email Anda.',
    );
    expect(passwordIssues('aaaaaaaaaaaa', 'x@y.z').length).toBeGreaterThan(0);
    expect(passwordIssues('kopi-pagi-di-teras', 'budi@mail.com')).toEqual([]);
  });

  it('locks the account after the configured number of failures', () => {
    const now = new Date('2026-10-08T00:00:00Z');
    let count = 0;
    let state = afterFailedLogin(count, now);
    for (let i = 1; i < LOCKOUT.maxFailures; i++) {
      expect(state.lockedUntil).toBeNull();
      count = state.failedLoginCount;
      state = afterFailedLogin(count, now);
    }
    expect(state.lockedUntil).not.toBeNull();
    expect(isLocked(state.lockedUntil, now)).toBe(true);
    expect(isLocked(state.lockedUntil, new Date(now.getTime() + 16 * 60_000))).toBe(false);
  });

  it('only allows same-site relative redirects', () => {
    expect(safeRedirectPath('/dashboard/orders')).toBe('/dashboard/orders');
    expect(safeRedirectPath('//evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('/\\evil.example')).toBe('/dashboard');
    expect(safeRedirectPath('https://evil.example')).toBe('/dashboard');
    expect(safeRedirectPath(null, '/')).toBe('/');
  });
});
