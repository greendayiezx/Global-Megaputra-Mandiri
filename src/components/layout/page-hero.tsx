import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { HeroCurve } from '@/components/layout/hero-curve';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Full-bleed photo header for public inner pages (Tentang, Jadi Mitra, Cek Coverage):
 * the same language as the homepage hero — edge-to-edge photo with a slow zoom, navy
 * gradient, copy that rises in, and a soft curve into the page — at a shorter height.
 */
export function PageHero({
  image,
  imagePosition = 'object-center',
  crumb,
  eyebrow,
  title,
  description,
  children,
  compact = false,
}: {
  /** Path under /public, already URL-encoded (e.g. "/images/GMM%20Login.png"). */
  image: string;
  imagePosition?: string;
  crumb: string;
  eyebrow?: string;
  title: string;
  description?: string;
  /** Buttons or notes under the description. */
  children?: ReactNode;
  /** Shorter band for task pages where the tool should stay near the top. */
  compact?: boolean;
}) {
  return (
    <section
      aria-labelledby="page-hero-title"
      className="relative isolate overflow-hidden bg-[#05122b]"
    >
      <div aria-hidden="true" className="hero-zoom absolute inset-0 -z-20">
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="100vw"
          className={cn('object-cover', imagePosition)}
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,18,43,0.95)_0%,rgba(5,28,65,0.82)_55%,rgba(5,28,65,0.4)_100%)] sm:bg-[linear-gradient(90deg,rgba(5,18,43,0.94)_0%,rgba(5,28,65,0.72)_45%,rgba(5,28,65,0.1)_100%)]"
      />

      {/* Keeps the floating header's white text legible over bright parts of the photo. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-[#05122b]/70 to-transparent"
      />
      <div
        className={cn(
          'container-page flex flex-col justify-center',
          compact
            ? 'min-h-[calc(var(--site-header-h)+300px)] pt-[calc(var(--site-header-h)+2rem)] pb-24 md:min-h-[calc(var(--site-header-h)+340px)]'
            : 'min-h-[calc(var(--site-header-h)+420px)] pt-[calc(var(--site-header-h)+2.5rem)] pb-24 md:min-h-[calc(var(--site-header-h)+480px)] md:pb-28',
        )}
      >
        <nav aria-label="Breadcrumb" className="hero-rise text-sm text-blue-100/75">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-white">
                Beranda
              </Link>
            </li>
            <li className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <span aria-current="page" className="text-white">
                {crumb}
              </span>
            </li>
          </ol>
        </nav>
        <div className="mt-6 max-w-[640px]">
          {eyebrow && (
            <p className="hero-rise inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-200 uppercase backdrop-blur-sm [animation-delay:60ms]">
              {eyebrow}
            </p>
          )}
          <h1
            id="page-hero-title"
            className={cn(
              'hero-rise mt-4 leading-[1.08] font-bold tracking-tight text-white [animation-delay:120ms]',
              compact
                ? 'text-[30px] sm:text-[38px] lg:text-[44px]'
                : 'text-[34px] sm:text-[44px] lg:text-[52px]',
            )}
          >
            {title}
          </h1>
          {description && (
            <p className="hero-rise mt-4 max-w-[540px] text-[15px] leading-relaxed text-blue-100/90 [animation-delay:200ms] md:text-lg">
              {description}
            </p>
          )}
          {children && <div className="hero-rise mt-7 [animation-delay:280ms]">{children}</div>}
        </div>
      </div>
      <HeroCurve />
    </section>
  );
}
