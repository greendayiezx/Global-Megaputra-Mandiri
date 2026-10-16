import { decide, type Decision } from '@/lib/decision';
import { createStateMachine, type TransitionTable } from '@/lib/state-machine';
import { isOrderableCoverage, type CoverageStatus } from '@/modules/coverage/domain/coverage';
import {
  isProviderPubliclyVisible,
  type ProviderVisibility,
} from '@/modules/providers/domain/provider-rules';

/** Package lifecycle (brief §7). */
export const PACKAGE_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'SUSPENDED',
  'EXPIRED',
  'ARCHIVED',
] as const;
export type PackageStatus = (typeof PACKAGE_STATUSES)[number];

const TRANSITIONS: TransitionTable<PackageStatus> = {
  DRAFT: {
    PENDING_REVIEW: { actors: ['PROVIDER', 'PLATFORM'] },
    ARCHIVED: { actors: ['PROVIDER', 'PLATFORM'] },
  },
  PENDING_REVIEW: {
    PUBLISHED: { actors: ['PLATFORM'] },
    DRAFT: { actors: ['PLATFORM', 'PROVIDER'], requiresReason: true },
  },
  PUBLISHED: {
    // Material changes (price, speed) by the provider send the package back to review.
    PENDING_REVIEW: { actors: ['PROVIDER', 'PLATFORM'] },
    SUSPENDED: { actors: ['PLATFORM'], requiresReason: true },
    EXPIRED: { actors: ['SYSTEM', 'PLATFORM'] },
    ARCHIVED: { actors: ['PROVIDER', 'PLATFORM'] },
  },
  SUSPENDED: {
    PUBLISHED: { actors: ['PLATFORM'], requiresReason: true },
    ARCHIVED: { actors: ['PLATFORM'] },
  },
  EXPIRED: {
    PENDING_REVIEW: { actors: ['PROVIDER', 'PLATFORM'] },
    ARCHIVED: { actors: ['PROVIDER', 'PLATFORM'] },
  },
};

export const packageStateMachine = createStateMachine('package', TRANSITIONS);

export interface PackageForRules {
  name: string;
  slug: string;
  downloadMbps: number;
  uploadMbps: number;
  technology: string | null;
  monthlyPrice: number;
  installationFee: number;
  activationFee: number;
  contractMonths: number;
  supportHours: string | null;
  estInstallationDaysMin: number | null;
  estInstallationDaysMax: number | null;
  status: PackageStatus;
  publishedAt: Date | null;
  validUntil: Date | null;
  isDemo: boolean;
}

const isNonNegInt = (n: number) => Number.isSafeInteger(n) && n >= 0;
const isPosInt = (n: number) => Number.isSafeInteger(n) && n > 0;

/** Field-level completeness required before a package can be reviewed/published (messages are user-facing). */
export function packageCompletenessIssues(pkg: PackageForRules): string[] {
  const issues: string[] = [];
  if (!pkg.name.trim()) issues.push('Nama paket wajib diisi');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pkg.slug))
    issues.push('Slug hanya huruf kecil, angka, dan tanda hubung');
  if (!isPosInt(pkg.downloadMbps)) issues.push('Kecepatan download harus angka bulat lebih dari 0');
  if (!isPosInt(pkg.uploadMbps)) issues.push('Kecepatan upload harus angka bulat lebih dari 0');
  if (!pkg.technology) issues.push('Teknologi wajib dipilih');
  if (!isPosInt(pkg.monthlyPrice)) issues.push('Harga bulanan harus lebih dari 0');
  if (!isNonNegInt(pkg.installationFee)) issues.push('Biaya instalasi wajib diisi (0 bila gratis)');
  if (!isNonNegInt(pkg.activationFee)) issues.push('Biaya aktivasi wajib diisi (0 bila gratis)');
  if (!isNonNegInt(pkg.contractMonths))
    issues.push('Masa kontrak wajib diisi (0 bila tanpa kontrak)');
  if (!pkg.supportHours?.trim()) issues.push('Jam dukungan wajib diisi');
  if (
    pkg.estInstallationDaysMin === null ||
    pkg.estInstallationDaysMax === null ||
    pkg.estInstallationDaysMin < 0 ||
    pkg.estInstallationDaysMax < pkg.estInstallationDaysMin
  ) {
    issues.push('Perkiraan waktu instalasi (min–maks hari) wajib diisi');
  }
  return issues;
}

/**
 * A package may be submitted for review or published only by a VERIFIED provider
 * and only when every customer-facing fact (incl. all fees) is filled in.
 */
export function canProviderPublishPackage(
  provider: Pick<ProviderVisibility, 'verificationStatus' | 'verifiedAt' | 'deletedAt'>,
  pkg: PackageForRules,
): Decision {
  if (
    provider.verificationStatus !== 'VERIFIED' ||
    provider.verifiedAt === null ||
    provider.deletedAt
  ) {
    return { ok: false, code: 'PROVIDER_NOT_VERIFIED', reasons: ['Provider belum terverifikasi'] };
  }
  return decide('VALIDATION_ERROR', packageCompletenessIssues(pkg));
}

/** Public marketplace visibility. Unverified providers' packages never appear. */
export function isPackagePubliclyListable(
  pkg: Pick<PackageForRules, 'status' | 'publishedAt' | 'validUntil' | 'isDemo'>,
  provider: ProviderVisibility,
  now: Date,
  showDemoData: boolean,
): boolean {
  return (
    pkg.status === 'PUBLISHED' &&
    pkg.publishedAt !== null &&
    pkg.publishedAt.getTime() <= now.getTime() &&
    (pkg.validUntil === null || pkg.validUntil.getTime() > now.getTime()) &&
    (!pkg.isDemo || showDemoData) &&
    isProviderPubliclyVisible(provider, showDemoData)
  );
}

/** Whether a customer can start an order for this package at a location with this coverage. */
export function canPurchasePackage(
  pkg: Pick<PackageForRules, 'status' | 'publishedAt' | 'validUntil' | 'isDemo'>,
  provider: ProviderVisibility,
  coverage: CoverageStatus,
  now: Date,
  showDemoData: boolean,
): Decision {
  if (!isProviderPubliclyVisible(provider, showDemoData)) {
    return { ok: false, code: 'PROVIDER_NOT_VERIFIED', reasons: ['provider is not available'] };
  }
  if (!isPackagePubliclyListable(pkg, provider, now, showDemoData)) {
    return { ok: false, code: 'PACKAGE_NOT_AVAILABLE', reasons: ['package is not available'] };
  }
  if (!isOrderableCoverage(coverage)) {
    return {
      ok: false,
      code: 'COVERAGE_NOT_AVAILABLE',
      reasons: [`coverage at this location is ${coverage}`],
    };
  }
  return { ok: true };
}
