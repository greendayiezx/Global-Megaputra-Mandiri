import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineEntry {
  title: string;
  description: string;
  /** Short marker shown in the left column, e.g. "Langkah 01" or a year. */
  date: string;
  image: string;
  imageAlt?: string;
  icon?: LucideIcon;
}

/**
 * Vertical timeline: a sticky marker column on the left, a rail with a dot per entry, and the
 * entry's copy plus an illustration on the right. Adapted from a 21st.dev block to GMM tokens.
 */
export default function Timeline({
  items,
  className,
}: {
  items: readonly TimelineEntry[];
  className?: string;
}) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <li
            key={item.title}
            className="border-line grid gap-6 border-t px-6 py-10 first:border-t-0 md:grid-cols-[220px_1fr] md:gap-10 md:px-10 md:py-14 lg:px-16"
          >
            {/* Marker column — stays in view while the entry scrolls past (desktop). */}
            <div className="md:sticky md:top-44 md:self-start">
              <div className="flex items-center gap-3">
                {Icon && (
                  <span className="border-primary-border bg-primary-soft text-primary grid size-11 shrink-0 place-items-center rounded-lg border">
                    <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                )}
                <span className="text-primary text-sm font-semibold tracking-wide uppercase">
                  {item.date}
                </span>
              </div>
            </div>

            {/* Rail + content */}
            <div className="border-line relative border-l pl-6 md:pl-10">
              <span
                aria-hidden="true"
                className="bg-primary ring-primary-soft absolute top-1.5 -left-[7px] size-3.5 rounded-full ring-4"
              />
              <h3 className="text-xl font-semibold tracking-tight md:text-2xl">{item.title}</h3>
              <p className="text-fg-muted mt-2 max-w-2xl text-base leading-relaxed md:text-[17px]">
                {item.description}
              </p>
              <div className="bg-subtle ring-line mt-6 aspect-[16/9] max-w-3xl overflow-hidden rounded-xl ring-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- remote stock photo */}
                <img
                  src={item.image}
                  alt={item.imageAlt ?? ''}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="size-full object-cover"
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
