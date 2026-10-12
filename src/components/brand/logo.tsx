import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Official GMM emblem (square, black on white), served from `public/images`. */
export const LOGO_SRC = '/images/GMM%20New%20Logo.jpg';

/** The emblem alone, on a white rounded tile so it reads on light and dark backgrounds. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      className={cn('size-10 shrink-0 rounded-md bg-white object-contain', className)}
    />
  );
}

export function Logo({
  compact = false,
  roomy = false,
}: {
  compact?: boolean;
  /** Header use: drop the subtitle on laptop widths (lg) where the menu needs the room. */
  roomy?: boolean;
}) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className="size-12 lg:size-14" />
      <span className="leading-none">
        <span className="text-navy overlay:text-white block text-[22px] font-bold tracking-tight transition-colors lg:text-[26px]">
          GMM
        </span>
        {!compact && (
          <span
            className={cn(
              'text-fg-muted overlay:text-white/75 mt-1 hidden text-[11.5px] font-medium tracking-wide transition-colors sm:block lg:text-[13px]',
              roomy && 'lg:hidden xl:block',
            )}
          >
            Global Megaputra Mandiri
          </span>
        )}
      </span>
    </span>
  );
}
