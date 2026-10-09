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
