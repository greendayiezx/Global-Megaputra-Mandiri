import { cn } from '@/lib/utils';

/**
 * GMM lettermark: a geometric "G" whose opening carries a single network node.
 * Works at 16px (favicon/app icon) and in the header.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-8', className)} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0F172A" />
      <path
        d="M21.6 11.4A7.4 7.4 0 1 0 23.4 16.6H16.6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="square"
      />
      <rect x="21.4" y="6.4" width="4.2" height="4.2" rx="1" fill="#2563EB" />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="leading-none">
        <span className="text-navy block text-[19px] font-bold tracking-tight">GMM</span>
        {!compact && (
          <span className="text-fg-muted mt-0.5 hidden text-[10.5px] font-medium tracking-wide sm:block">
            Global Megaputra Mandiri
          </span>
        )}
      </span>
    </span>
  );
}
