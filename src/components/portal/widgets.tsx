import { ArrowRight, BarChart3, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { isPortalPath, PORTAL_EXIT } from '@/lib/portal-paths';
import { cn } from '@/lib/utils';

/** CSS url() list trying common extensions, so a photo works whichever format it was saved in. */
function imageLayers(baseName: string) {
  // Encode per segment so subfolders ("SuperAdmin/…") keep their slash.
  const name = baseName.split('/').map(encodeURIComponent).join('/');
  return ['png', 'jpg', 'jpeg', 'webp'].map((ext) => `url('/images/${name}.${ext}')`).join(', ');
}

/** Blue welcome banner over a full-width illustration (public/images/<image>.*, subfolders allowed). */
export function WelcomeBanner({
  title,
  body,
  cta,
  image,
}: {
  title: ReactNode;
  body: string;
  cta: { href: string; label: string };
  image: string;
}) {
  return (
    <section className="from-primary relative isolate overflow-hidden rounded-2xl bg-gradient-to-r to-[#3b82f6] text-white">
      {/* Decorative rings, visible until the photo loads (or if it is missing). */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 400"
        className="absolute -top-24 -right-16 -z-20 size-96 text-white/10"
      >
        {[60, 110, 160].map((r) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="24"
          />
        ))}
      </svg>
      {/* The banners are drawn with the subject on the right and open space on the left. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-[center_right]"
        style={{ backgroundImage: imageLayers(image) }}
      />
      {/* Keeps the white copy readable on the left; stronger on phones where the photo is behind it. */}
      <div
        aria-hidden="true"
        className="from-primary via-primary/85 to-primary/55 sm:from-primary/90 sm:via-primary/60 absolute inset-0 -z-10 bg-gradient-to-r sm:to-transparent"
      />
      <div className="max-w-xl px-6 py-8 md:px-8 md:py-12">
        <h1 className="text-2xl leading-tight font-bold text-white md:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-blue-100 md:text-base">{body}</p>
        <Link
          href={cta.href}
          transitionTypes={isPortalPath(cta.href) ? undefined : PORTAL_EXIT}
          className="text-primary mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors hover:bg-blue-50"
        >
          {cta.label} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

const TONES = {
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  green: 'bg-emerald-50 text-emerald-600',
  violet: 'bg-violet-50 text-violet-600',
} as const;

const ICON_TONES = {
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  green: 'text-emerald-600',
  violet: 'text-violet-600',
} as const;

/** KPI card. `value = null` renders "—" with the caption explaining why (no faked numbers). */
export function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  caption,
  iconOnly = false,
}: {
  icon: LucideIcon;
  tone: keyof typeof TONES;
  label: string;
  value: string | null;
  caption: string;
  iconOnly?: boolean;
}) {
  return (
    <div className="border-line bg-surface shadow-card flex items-start gap-4 rounded-xl border p-5">
      {iconOnly ? (
        <Icon className={cn('size-5 shrink-0', ICON_TONES[tone])} aria-hidden="true" />
      ) : (
        <span className={cn('grid size-11 shrink-0 place-items-center rounded-full', TONES[tone])}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-fg-muted text-sm">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight">{value ?? '—'}</p>
        <p className="text-fg-muted mt-1 text-xs">{caption}</p>
      </div>
    </div>
  );
}

/** White card with a header row (title + optional action link). */
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'border-line bg-surface shadow-card flex flex-col rounded-xl border',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        <h2 className="text-base font-semibold">{title}</h2>
        {action && (
          <Link href={action.href} className="text-primary text-sm font-medium hover:underline">
            {action.label}
          </Link>
        )}
      </div>
      <div className="flex-1 px-5 pb-5">{children}</div>
    </section>
  );
}

/** Chart frame shown until the data behind it exists — never a made-up series. */
export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="relative h-56">
      <div aria-hidden="true" className="absolute inset-0 flex flex-col justify-between py-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="border-line block border-t border-dashed" />
        ))}
      </div>
      <div className="relative grid h-full place-items-center text-center">
        <div>
          <span className="bg-subtle text-fg-muted mx-auto grid size-11 place-items-center rounded-full">
            <BarChart3 className="size-5" aria-hidden="true" />
          </span>
          <p className="text-fg-secondary mt-3 text-sm font-medium">Belum ada data</p>
          <p className="text-fg-muted mt-1 max-w-xs text-xs">{message}</p>
        </div>
      </div>
    </div>
  );
}

const DONUT_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#64748b'];

/** Donut chart with legend for small categorical breakdowns. */
export function Donut({
  data,
  totalLabel,
}: {
  data: readonly { label: string; value: number }[];
  totalLabel: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = 15.9155; // circumference = 100, so dash lengths are percentages
  let offset = 25;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative size-40 shrink-0">
        <svg viewBox="0 0 42 42" className="size-full" role="img" aria-label={totalLabel}>
          <circle cx="21" cy="21" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          {total > 0 &&
            data.map((d, i) => {
              const pct = (d.value / total) * 100;
              const el = (
                <circle
                  key={d.label}
                  cx="21"
                  cy="21"
                  r={r}
                  fill="none"
                  stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                  strokeWidth="6"
                  strokeDasharray={`${pct} ${100 - pct}`}
                  strokeDashoffset={offset}
                />
              );
              offset -= pct;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-fg-muted text-[11px]">Total</p>
            <p className="text-xl font-bold">{total}</p>
            <p className="text-fg-muted text-[11px]">{totalLabel}</p>
          </div>
        </div>
      </div>
      <ul className="min-w-40 flex-1 space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden="true"
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
              />
              <span className="truncate">{d.label}</span>
            </span>
            <span className="text-fg-muted tabular-nums">
              {total ? Math.round((d.value / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Closing call-to-action banner with an original inline SVG illustration (no stock photo). */
export function CtaBanner({ title, body }: { title: string; body: string }) {
  return (
    <section className="from-primary relative overflow-hidden rounded-2xl bg-gradient-to-r to-[#1e40af] px-6 py-8 text-white md:px-8">
      <div className="relative z-10 max-w-md">
        <h2 className="text-xl leading-snug font-bold text-white md:text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-blue-100">{body}</p>
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 320 180"
        className="absolute right-4 bottom-0 hidden h-full max-h-44 sm:block md:right-10"
      >
        {/* signal waves */}
        <g fill="none" stroke="#93c5fd" strokeLinecap="round" strokeWidth="5" opacity="0.7">
          <path d="M70 52a40 40 0 0 1 56 0" />
          <path d="M80 64a26 26 0 0 1 36 0" />
        </g>
        <circle cx="98" cy="78" r="5" fill="#bfdbfe" />
        {/* laptop */}
        <rect x="120" y="70" width="120" height="76" rx="8" fill="#eff6ff" />
        <rect x="128" y="78" width="104" height="60" rx="4" fill="#1d4ed8" />
        <rect x="104" y="146" width="152" height="10" rx="5" fill="#dbeafe" />
        {/* dashboard bars on screen */}
        <g fill="#93c5fd">
          <rect x="140" y="114" width="12" height="16" rx="2" />
          <rect x="158" y="104" width="12" height="26" rx="2" />
          <rect x="176" y="96" width="12" height="34" rx="2" />
          <rect x="194" y="88" width="12" height="42" rx="2" />
        </g>
        <path d="M140 100l18-8 18 4 30-14" fill="none" stroke="#ffffff" strokeWidth="2.5" />
        {/* chat bubble */}
        <rect x="244" y="34" width="56" height="36" rx="10" fill="#ffffff" />
        <path d="M256 70l-4 12 14-12z" fill="#ffffff" />
        <g fill="#2563eb">
          <circle cx="260" cy="52" r="3.5" />
          <circle cx="272" cy="52" r="3.5" />
          <circle cx="284" cy="52" r="3.5" />
        </g>
        {/* check badge */}
        <circle cx="64" cy="132" r="18" fill="#10b981" />
        <path
          d="M56 132l6 6 11-12"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </section>
  );
}
