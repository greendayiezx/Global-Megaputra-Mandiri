import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Info,
  Star,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ---------- Card ---------- */

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-line bg-surface shadow-card rounded-lg border', className)}
      {...props}
    />
  );
}

/* ---------- Badge ---------- */

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-subtle text-fg-secondary',
        primary: 'bg-primary-soft text-primary-hover',
        success: 'bg-success-soft text-success-fg',
        warning: 'bg-warning-soft text-warning-fg',
        danger: 'bg-danger-soft text-danger-fg',
        outline: 'border border-line text-fg-secondary',
        demo: 'border border-warning/40 bg-warning-soft text-[11px] font-semibold tracking-wide text-warning-fg uppercase',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export function DemoBadge() {
  return (
    <Badge tone="demo" title="Data contoh, bukan penawaran nyata">
      Demo
    </Badge>
  );
}

/* ---------- Alert ---------- */

const ALERT: Record<
  'info' | 'success' | 'warning' | 'danger',
  { icon: LucideIcon; className: string }
> = {
  info: { icon: Info, className: 'border-primary-border bg-primary-soft text-primary-dark' },
  success: { icon: CheckCircle2, className: 'border-success/30 bg-success-soft text-success-fg' },
  warning: { icon: AlertTriangle, className: 'border-warning/40 bg-warning-soft text-warning-fg' },
  danger: { icon: AlertCircle, className: 'border-danger/30 bg-danger-soft text-danger-fg' },
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: keyof typeof ALERT;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, className: toneClass } = ALERT[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-md border px-4 py-3 text-sm', toneClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-0.5">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}

/* ---------- Empty / Skeleton ---------- */

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-line-strong bg-surface flex flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <span className="bg-subtle text-fg-muted grid size-11 place-items-center rounded-md">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && <p className="text-fg-muted mt-1.5 max-w-md text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('bg-subtle animate-pulse rounded-md', className)} />;
}

/* ---------- Breadcrumb ---------- */

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-fg-muted text-sm">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="size-3.5" aria-hidden="true" />}
            {item.href ? (
              <Link href={item.href} className="hover:text-fg">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-fg">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ---------- Pagination ---------- */

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const item =
    'grid size-10 place-items-center rounded-md border text-sm font-medium transition-colors';
  return (
    <nav aria-label="Halaman" className="flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(item, 'border-line bg-surface hover:bg-subtle')}
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : null}
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            item,
            p === page
              ? 'border-primary bg-primary text-white'
              : 'border-line bg-surface hover:bg-subtle',
          )}
        >
          {p}
        </Link>
      ))}
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(item, 'border-line bg-surface hover:bg-subtle')}
          aria-label="Berikutnya"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}

/* ---------- Rating ---------- */

/** Shows real review data only. With zero reviews it says so — never a placeholder score. */
export function RatingSummary({
  average,
  count,
  className,
}: {
  average: number | null;
  count: number;
  className?: string;
}) {
  if (count === 0 || average === null) {
    return (
      <span className={cn('text-fg-muted inline-flex items-center gap-1 text-[13px]', className)}>
        <Star className="size-3.5" aria-hidden="true" />
        Belum ada ulasan
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-[13px]', className)}>
      <Star className="fill-warning text-warning size-3.5" aria-hidden="true" />
      <span className="text-fg font-semibold">{average.toFixed(1)}</span>
      <span className="text-fg-muted">({count} ulasan)</span>
    </span>
  );
}

/* ---------- Section header ---------- */

export function SectionHeader({
  title,
  description,
  action,
  as: Heading = 'h2',
  id,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  as?: 'h1' | 'h2';
  id?: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <Heading
          id={id}
          className={
            Heading === 'h1'
              ? 'text-[28px] font-bold md:text-[32px]'
              : 'text-2xl font-bold md:text-[28px]'
          }
        >
          {title}
        </Heading>
        {description && <p className="text-fg-muted mt-2">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Metric (dashboards) ---------- */

export function Metric({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  caption?: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-fg-muted text-sm">{label}</p>
        <Icon className="text-fg-muted size-4" aria-hidden="true" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value ?? '—'}</p>
      {caption && <p className="text-fg-muted mt-1 text-xs">{caption}</p>}
    </Card>
  );
}
