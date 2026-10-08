import { Badge } from '@/components/ui/primitives';
import type { PackageStatus } from '@/modules/packages/domain/package-rules';
import type { ProviderVerificationStatus } from '@/modules/providers/domain/provider-rules';

const PACKAGE: Record<
  PackageStatus,
  { label: string; tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }
> = {
  DRAFT: { label: 'Draf', tone: 'neutral' },
  PENDING_REVIEW: { label: 'Menunggu review', tone: 'primary' },
  PUBLISHED: { label: 'Dipublikasikan', tone: 'success' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'danger' },
  EXPIRED: { label: 'Kedaluwarsa', tone: 'warning' },
  ARCHIVED: { label: 'Diarsipkan', tone: 'neutral' },
};

const PROVIDER: Record<
  ProviderVerificationStatus,
  { label: string; tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' }
> = {
  PENDING: { label: 'Menunggu dokumen', tone: 'neutral' },
  UNDER_REVIEW: { label: 'Dalam review', tone: 'primary' },
  VERIFIED: { label: 'Terverifikasi', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
  SUSPENDED: { label: 'Ditangguhkan', tone: 'warning' },
};

/** Package status shown with its real effective state (a past valid_until counts as expired). */
export function PackageStatusBadge({
  status,
  validUntil,
}: {
  status: PackageStatus;
  validUntil?: Date | null;
}) {
  const effective =
    status === 'PUBLISHED' && validUntil && validUntil.getTime() < Date.now() ? 'EXPIRED' : status;
  const s = PACKAGE[effective];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function ProviderStatusBadge({ status }: { status: ProviderVerificationStatus }) {
  const s = PROVIDER[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
