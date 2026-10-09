import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import Timeline, { type TimelineEntry } from './timeline-01-utils/timeline';

/**
 * Framed timeline block: a header panel (badge, title, intro) above the vertical timeline,
 * all inside thin vertical rules. Adapted from a 21st.dev block to GMM tokens; the page
 * provides the outer container.
 */
export default function TimelineBlock01({
  badge,
  title,
  description,
  items,
  footer,
  className,
}: {
  badge?: string;
  title: ReactNode;
  description?: ReactNode;
  items: readonly TimelineEntry[];
  /** Optional content in the closing panel (e.g. a call to action). */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('bg-surface border-line overflow-hidden rounded-xl border', className)}>
      <div className="border-line border-b px-6 py-10 md:px-10 md:py-14 lg:px-16">
        <div className="max-w-2xl space-y-4">
          {badge && (
            <Badge tone="outline" className="rounded-full px-3 py-1 font-normal">
              {badge}
            </Badge>
          )}
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
            {description && (
              <p className="text-fg-muted text-base leading-relaxed md:text-lg">{description}</p>
            )}
          </div>
        </div>
      </div>
      <Timeline items={items} />
      <div className="border-line bg-canvas border-t px-6 py-8 md:px-10 lg:px-16">{footer}</div>
    </section>
  );
}

export type { TimelineEntry };
