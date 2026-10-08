import { describe, expect, it } from 'vitest';
import {
  canProviderPublishPackage,
  canPurchasePackage,
  isPackagePubliclyListable,
  packageStateMachine,
  type PackageForRules,
} from './package-rules';
import type { ProviderVisibility } from '@/modules/providers/domain/provider-rules';

const now = new Date('2026-10-08T00:00:00Z');

const verified: ProviderVisibility = {
  verificationStatus: 'VERIFIED',
  verifiedAt: new Date('2026-09-01'),
  deletedAt: null,
  isDemo: false,
};

const pkg: PackageForRules = {
  name: 'Demo Paket 50 Mbps',
  slug: 'demo-paket-50',
  downloadMbps: 50,
  uploadMbps: 50,
  technology: 'FIBER',
  monthlyPrice: 300_000,
  installationFee: 0,
  activationFee: 0,
  contractMonths: 0,
  supportHours: '24/7',
  estInstallationDaysMin: 1,
  estInstallationDaysMax: 3,
  status: 'PUBLISHED',
  publishedAt: new Date('2026-09-15'),
  validUntil: null,
  isDemo: false,
};

describe('package publishing', () => {
  it('requires a verified provider', () => {
    for (const status of ['PENDING', 'UNDER_REVIEW', 'REJECTED', 'SUSPENDED'] as const) {
      expect(
        canProviderPublishPackage({ ...verified, verificationStatus: status }, pkg),
      ).toMatchObject({
        ok: false,
        code: 'PROVIDER_NOT_VERIFIED',
      });
    }
    expect(canProviderPublishPackage(verified, pkg)).toEqual({ ok: true });
  });

  it('requires every customer-facing fact including fees', () => {
    const r = canProviderPublishPackage(verified, {
      ...pkg,
      installationFee: -1,
      supportHours: '',
      estInstallationDaysMin: 5,
      estInstallationDaysMax: 2,
    });
    expect(r).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });
    if (!r.ok) expect(r.reasons).toHaveLength(3);
  });

  it('only GMM staff can approve a package for publication', () => {
    expect(packageStateMachine.canTransition('PENDING_REVIEW', 'PUBLISHED', 'PROVIDER')).toBe(
      false,
    );
    expect(packageStateMachine.canTransition('PENDING_REVIEW', 'PUBLISHED', 'PLATFORM')).toBe(true);
  });
});

describe('marketplace visibility', () => {
  it('hides packages of unverified or suspended providers', () => {
    expect(isPackagePubliclyListable(pkg, verified, now, false)).toBe(true);
    expect(
      isPackagePubliclyListable(pkg, { ...verified, verificationStatus: 'SUSPENDED' }, now, false),
    ).toBe(false);
    expect(isPackagePubliclyListable(pkg, { ...verified, verifiedAt: null }, now, false)).toBe(
      false,
    );
  });

  it('hides expired, unpublished and future-dated packages', () => {
    expect(
      isPackagePubliclyListable(
        { ...pkg, validUntil: new Date('2026-10-01') },
        verified,
        now,
        false,
      ),
    ).toBe(false);
    expect(isPackagePubliclyListable({ ...pkg, status: 'DRAFT' }, verified, now, false)).toBe(
      false,
    );
    expect(
      isPackagePubliclyListable(
        { ...pkg, publishedAt: new Date('2026-11-01') },
        verified,
        now,
        false,
      ),
    ).toBe(false);
  });

  it('hides demo data unless explicitly enabled', () => {
    const demo = { ...verified, isDemo: true };
    expect(isPackagePubliclyListable({ ...pkg, isDemo: true }, demo, now, false)).toBe(false);
    expect(isPackagePubliclyListable({ ...pkg, isDemo: true }, demo, now, true)).toBe(true);
  });
});

describe('canPurchasePackage', () => {
  it('allows ordering for AVAILABLE, LIMITED and REQUIRES_SURVEY coverage', () => {
    for (const c of ['AVAILABLE', 'LIMITED', 'REQUIRES_SURVEY'] as const) {
      expect(canPurchasePackage(pkg, verified, c, now, false)).toEqual({ ok: true });
    }
  });

  it('blocks ordering without coverage, for expired packages, or suspended providers', () => {
    expect(canPurchasePackage(pkg, verified, 'NOT_AVAILABLE', now, false)).toMatchObject({
      code: 'COVERAGE_NOT_AVAILABLE',
    });
    expect(
      canPurchasePackage({ ...pkg, status: 'EXPIRED' }, verified, 'AVAILABLE', now, false),
    ).toMatchObject({
      code: 'PACKAGE_NOT_AVAILABLE',
    });
    expect(
      canPurchasePackage(
        pkg,
        { ...verified, verificationStatus: 'SUSPENDED' },
        'AVAILABLE',
        now,
        false,
      ),
    ).toMatchObject({ code: 'PROVIDER_NOT_VERIFIED' });
  });
});
