import { describe, expect, it } from 'vitest';
import {
  checkVerificationReadiness,
  providerStateMachine,
  showVerifiedBadge,
  type ProviderProfileSummary,
} from './provider-rules';

const now = new Date('2026-10-08');
const profile: ProviderProfileSummary = {
  legalName: 'PT Demo Provider 001',
  nib: '0000000000000',
  picName: 'Demo PIC',
  picPhone: '+620000000000',
  picEmail: 'pic@demo.invalid',
  address: 'Demo address',
};

describe('provider verification', () => {
  it('is ready only with full profile and all required documents verified and unexpired', () => {
    const docs = [
      { type: 'NIB' as const, status: 'VERIFIED' as const, validUntil: null },
      { type: 'NPWP' as const, status: 'VERIFIED' as const, validUntil: new Date('2026-01-01') },
    ];
    const r = checkVerificationReadiness(
      { ...profile, nib: ' ' },
      docs,
      ['NIB', 'NPWP', 'AKTA'],
      now,
    );
    expect(r).toEqual({
      ready: false,
      missingProfileFields: ['nib'],
      missingDocuments: ['NPWP', 'AKTA'],
    });

    const ok = checkVerificationReadiness(
      profile,
      [{ type: 'NIB', status: 'VERIFIED', validUntil: null }],
      ['NIB'],
      now,
    );
    expect(ok.ready).toBe(true);
  });

  it('providers cannot verify themselves', () => {
    expect(providerStateMachine.canTransition('UNDER_REVIEW', 'VERIFIED', 'PROVIDER')).toBe(false);
    expect(providerStateMachine.canTransition('PENDING', 'VERIFIED', 'PLATFORM')).toBe(false);
    expect(providerStateMachine.canTransition('UNDER_REVIEW', 'VERIFIED', 'PLATFORM')).toBe(true);
  });

  it('rejection and suspension require a reason', () => {
    expect(() =>
      providerStateMachine.validate('UNDER_REVIEW', 'REJECTED', { kind: 'PLATFORM', id: 'admin' }),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('badge shows only after verification actually completed', () => {
    expect(showVerifiedBadge({ verificationStatus: 'VERIFIED', verifiedAt: new Date() })).toBe(
      true,
    );
    expect(showVerifiedBadge({ verificationStatus: 'VERIFIED', verifiedAt: null })).toBe(false);
    expect(showVerifiedBadge({ verificationStatus: 'UNDER_REVIEW', verifiedAt: new Date() })).toBe(
      false,
    );
  });
});
