import type { StatusOption } from './status-change-form';
import type { PackageStatus } from '@/modules/packages/domain/package-rules';
import type { ProviderVerificationStatus } from '@/modules/providers/domain/provider-rules';

type Copy = Omit<StatusOption, 'value' | 'needsReason'>;

const PROVIDER_MOVE: Record<ProviderVerificationStatus, Copy> = {
  UNDER_REVIEW: { label: 'Mulai tinjau', hint: 'Tandai bahwa tim GMM sedang memeriksa data.' },
  VERIFIED: {
    label: 'Setujui verifikasi',
    hint: 'Provider dan paket yang sudah terbit tampil di marketplace.',
  },
  REJECTED: {
    label: 'Tolak',
    hint: 'Provider bisa memperbaiki lalu mengajukan ulang.',
    tone: 'danger',
  },
  PENDING: {
    label: 'Kembalikan untuk dilengkapi',
    hint: 'Minta provider melengkapi data/dokumen.',
  },
  SUSPENDED: {
    label: 'Tangguhkan',
    hint: 'Provider dan semua paketnya hilang dari marketplace.',
    tone: 'danger',
  },
};

const PACKAGE_MOVE: Record<PackageStatus, Copy> = {
  PUBLISHED: {
    label: 'Terbitkan',
    hint: 'Paket tampil di marketplace; harga dianggap terverifikasi.',
  },
  DRAFT: { label: 'Kembalikan ke draf', hint: 'Provider memperbaiki lalu mengajukan ulang.' },
  PENDING_REVIEW: { label: 'Tinjau ulang', hint: 'Turunkan sementara untuk diperiksa ulang.' },
  SUSPENDED: { label: 'Tangguhkan', hint: 'Paket hilang dari marketplace.', tone: 'danger' },
  EXPIRED: { label: 'Tandai kedaluwarsa', hint: 'Paket tidak lagi berlaku.' },
  ARCHIVED: { label: 'Arsipkan', hint: 'Disimpan untuk riwayat, tidak tampil di mana pun.' },
};

export const providerMoveOptions = (
  next: ProviderVerificationStatus[],
  needsReason: (to: ProviderVerificationStatus) => boolean,
): StatusOption[] =>
  next.map((to) => ({ value: to, needsReason: needsReason(to), ...PROVIDER_MOVE[to] }));

export const packageMoveOptions = (
  next: PackageStatus[],
  needsReason: (to: PackageStatus) => boolean,
): StatusOption[] =>
  next.map((to) => ({ value: to, needsReason: needsReason(to), ...PACKAGE_MOVE[to] }));
