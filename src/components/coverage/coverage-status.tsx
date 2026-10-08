import {
  CircleCheck,
  CircleHelp,
  CircleMinus,
  ClipboardCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CoverageStatus } from '@/modules/coverage/domain/coverage';

const STATUS: Record<CoverageStatus, { label: string; icon: LucideIcon; className: string }> = {
  AVAILABLE: { label: 'Tersedia', icon: CircleCheck, className: 'bg-success-soft text-success-fg' },
  LIMITED: { label: 'Terbatas', icon: TriangleAlert, className: 'bg-warning-soft text-warning-fg' },
  REQUIRES_SURVEY: {
    label: 'Perlu survei',
    icon: ClipboardCheck,
    className: 'bg-primary-soft text-primary-hover',
  },
  NOT_AVAILABLE: {
    label: 'Belum tersedia',
    icon: CircleMinus,
    className: 'bg-subtle text-fg-secondary',
  },
  UNKNOWN: { label: 'Belum diketahui', icon: CircleHelp, className: 'bg-subtle text-fg-muted' },
};

export const COVERAGE_EXPLANATION: Record<CoverageStatus, string> = {
  AVAILABLE: 'Lokasi Anda berada di area layanan provider.',
  LIMITED: 'Area layanan tersedia dengan kapasitas atau jangkauan terbatas.',
  REQUIRES_SURVEY: 'Provider perlu survei teknis sebelum memastikan pemasangan.',
  NOT_AVAILABLE: 'Provider belum melayani titik ini.',
  UNKNOWN: 'Data area layanan belum cukup untuk memastikan.',
};

/** Icon + text, so status never relies on colour alone. */
export function CoverageStatusBadge({
  status,
  className,
}: {
  status: CoverageStatus;
  className?: string;
}) {
  const s = STATUS[status];
  const Icon = s.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs font-semibold',
        s.className,
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {s.label}
    </span>
  );
}

/** Mandatory notice: a coverage match is never a guarantee of installation. */
export function CoverageNotice({ className }: { className?: string }) {
  return (
    <p className={cn('text-fg-muted flex gap-2 text-[13px] leading-relaxed', className)}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      Coverage berdasarkan data provider. Ketersediaan akhir dapat memerlukan verifikasi teknis.
    </p>
  );
}
