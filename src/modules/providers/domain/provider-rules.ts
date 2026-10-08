import { createStateMachine, type TransitionTable } from '@/lib/state-machine';

/** Provider verification lifecycle (brief §8, §16). */
export const PROVIDER_VERIFICATION_STATUSES = [
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
] as const;
export type ProviderVerificationStatus = (typeof PROVIDER_VERIFICATION_STATUSES)[number];

/** Verification decisions are made only by GMM staff; providers can only (re)submit. */
const TRANSITIONS: TransitionTable<ProviderVerificationStatus> = {
  PENDING: {
    UNDER_REVIEW: { actors: ['PLATFORM'] },
  },
  UNDER_REVIEW: {
    VERIFIED: { actors: ['PLATFORM'] },
    REJECTED: { actors: ['PLATFORM'], requiresReason: true },
    // Sent back for missing/invalid documents.
    PENDING: { actors: ['PLATFORM'], requiresReason: true },
  },
  REJECTED: {
    // Provider fixes the issues and resubmits.
    PENDING: { actors: ['PROVIDER', 'PLATFORM'] },
  },
  VERIFIED: {
    SUSPENDED: { actors: ['PLATFORM'], requiresReason: true },
    // Periodic or triggered re-verification.
    UNDER_REVIEW: { actors: ['PLATFORM'], requiresReason: true },
  },
  SUSPENDED: {
    VERIFIED: { actors: ['PLATFORM'], requiresReason: true },
    REJECTED: { actors: ['PLATFORM'], requiresReason: true },
  },
};

export const providerStateMachine = createStateMachine('provider', TRANSITIONS);

export type ProviderDocumentType =
  'NIB' | 'AKTA' | 'NPWP' | 'ISP_LICENSE' | 'BANK_PROOF' | 'PIC_ID' | 'OTHER';
export type ProviderDocumentStatus =
  'UPLOADED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface ProviderDocumentSummary {
  type: ProviderDocumentType;
  status: ProviderDocumentStatus;
  validUntil: Date | null;
}

export interface ProviderProfileSummary {
  legalName: string | null;
  nib: string | null;
  picName: string | null;
  picPhone: string | null;
  picEmail: string | null;
  address: string | null;
}

export interface VerificationReadiness {
  ready: boolean;
  missingProfileFields: (keyof ProviderProfileSummary)[];
  missingDocuments: ProviderDocumentType[];
}

/**
 * Whether an admin may approve the provider.
 *
 * `requiredDocumentTypes` comes from system_settings `providers.required_document_types`
 * (TODO_BUSINESS_DECISION: confirm the legal document list with GMM legal).
 */
export function checkVerificationReadiness(
  profile: ProviderProfileSummary,
  documents: readonly ProviderDocumentSummary[],
  requiredDocumentTypes: readonly ProviderDocumentType[],
  now: Date,
): VerificationReadiness {
  const missingProfileFields = (Object.keys(profile) as (keyof ProviderProfileSummary)[]).filter(
    (k) => !profile[k]?.trim(),
  );
  const missingDocuments = requiredDocumentTypes.filter(
    (type) =>
      !documents.some(
        (d) =>
          d.type === type &&
          d.status === 'VERIFIED' &&
          (d.validUntil === null || d.validUntil.getTime() > now.getTime()),
      ),
  );
  return {
    ready: missingProfileFields.length === 0 && missingDocuments.length === 0,
    missingProfileFields,
    missingDocuments,
  };
}

export interface ProviderVisibility {
  verificationStatus: ProviderVerificationStatus;
  verifiedAt: Date | null;
  deletedAt: Date | null;
  isDemo: boolean;
}

/** Only verified, non-deleted providers appear in the public marketplace. */
export function isProviderPubliclyVisible(p: ProviderVisibility, showDemoData: boolean): boolean {
  return (
    p.verificationStatus === 'VERIFIED' &&
    p.verifiedAt !== null &&
    p.deletedAt === null &&
    (!p.isDemo || showDemoData)
  );
}

/** "Verified Provider" badge is shown only when verification actually completed. */
export function showVerifiedBadge(
  p: Pick<ProviderVisibility, 'verificationStatus' | 'verifiedAt'>,
) {
  return p.verificationStatus === 'VERIFIED' && p.verifiedAt !== null;
}
