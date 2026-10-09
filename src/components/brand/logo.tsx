import Image from 'next/image';
import { cn } from '@/lib/utils';

/** Official GMM logo, served from `public/images`. */
export const LOGO_SRC = '/images/GMM New Logo.png';

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt="GMM — Global Megaputra Mandiri"
      width={200}
      height={60}
      priority
      className={cn('h-10 w-auto object-contain lg:h-12', className)}
    />
  );
}

/** Small logo for tight spots (badges, banners); same artwork as `Logo`. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={LOGO_SRC}
      alt=""
      aria-hidden="true"
      width={120}
      height={36}
      className={cn('h-8 w-auto object-contain', className)}
    />
  );
}
