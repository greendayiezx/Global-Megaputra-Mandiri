import { BadgeCheck } from 'lucide-react';
import Link from 'next/link';
import { ProviderAvatar } from './provider-avatar';

/**
 * Slowly scrolling strip of the providers listed on GMM (names from the catalogue, not
 * logos: brand marks need each provider's permission). Pauses on hover/focus; static and
 * wrapped for visitors who prefer reduced motion.
 */
export function ProviderMarquee({
  providers,
}: {
  providers: readonly { slug: string; displayName: string; verified: boolean }[];
}) {
  if (providers.length === 0) return null;
  // Repeat short lists so one copy is wider than the screen, then render it twice for a seamless loop.
  const copies = Math.max(1, Math.ceil(8 / providers.length));
  const row = Array.from({ length: copies }, () => providers).flat();

  const Item = ({ p, hidden }: { p: (typeof providers)[number]; hidden?: boolean }) => (
    <li aria-hidden={hidden || undefined} data-dup={hidden || undefined}>
      <Link
        href={`/provider/${p.slug}`}
        tabIndex={hidden ? -1 : undefined}
        className="border-line bg-surface hover:border-primary/50 flex items-center gap-3 rounded-full border py-2 pr-5 pl-2 whitespace-nowrap transition-colors"
      >
        <ProviderAvatar name={p.displayName} size="sm" />
        <span className="text-sm font-semibold">{p.displayName}</span>
        {p.verified && <BadgeCheck className="text-primary size-4" aria-label="Terverifikasi" />}
      </Link>
    </li>
  );

  return (
    <div className="marquee group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div className="marquee-track flex w-max gap-3 group-focus-within:[animation-play-state:paused] group-hover:[animation-play-state:paused]">
        <ul className="flex gap-3" aria-label="Provider di GMM">
          {row.map((p, i) => (
            <Item key={`a-${p.slug}-${i}`} p={p} hidden={i >= providers.length} />
          ))}
        </ul>
        <ul className="flex gap-3" aria-hidden="true">
          {row.map((p, i) => (
            <Item key={`b-${p.slug}-${i}`} p={p} hidden />
          ))}
        </ul>
      </div>
    </div>
  );
}
