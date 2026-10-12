import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Official GMM emblem (square, black on white), served from `public/images`. */
export const LOGO_SRC = '/images/GMM%20New%20Logo.jpg';
/** White emblem on transparent, for dark photo backgrounds (floating header). */
export const LOGO_WHITE_SRC = '/images/gmm-logo-white.png';
/** Navy emblem on transparent, for the header on white or light photo backgrounds. */
export const LOGO_DARK_SRC = '/images/gmm-logo-dark.png';

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
  inHeader = false,
}: {
  compact?: boolean;
  /**
   * Site header: transparent emblems (navy, or white while floating over a dark photo) instead
   * of the white tile, and no subtitle on laptop widths (lg) where the menu needs the room.
   */
  inHeader?: boolean;
}) {
  return (
    <span className="flex items-center gap-3">
      {inHeader ? (
        <>
          <Image
            src={LOGO_DARK_SRC}
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="overlay:hidden size-12 shrink-0 object-contain lg:size-14"
          />
          <Image
            src={LOGO_WHITE_SRC}
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            className="overlay:block hidden size-12 shrink-0 object-contain lg:size-14"
          />
        </>
      ) : (
        <LogoMark className="size-12 lg:size-14" />
      )}
      <span className="leading-none">
        <span className="text-navy overlay:text-white block text-[22px] font-bold tracking-tight transition-colors lg:text-[26px]">
          GMM
        </span>
        {!compact && (
          <span
            className={cn(
              'text-fg-muted overlay:text-white/75 mt-1 hidden text-[11.5px] font-medium tracking-wide transition-colors sm:block lg:text-[13px]',
              inHeader && 'lg:hidden xl:block',
            )}
          >
            Global Megaputra Mandiri
          </span>
        )}
      </span>
    </span>
  );
}
