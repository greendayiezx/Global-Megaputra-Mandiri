import { AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

const control =
  'w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-fg placeholder:text-fg-muted/80 transition-colors hover:border-fg-muted focus:border-primary focus:ring-3 focus:ring-primary/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-subtle disabled:text-fg-muted aria-invalid:border-danger-fg aria-invalid:focus:ring-danger/15';

export function Label({
  required,
  className,
  children,
  ...props
}: ComponentProps<'label'> & { required?: boolean }) {
  return (
    <label className={cn('text-fg mb-1.5 block text-sm font-medium', className)} {...props}>
      {children}
      {required && (
        <>
          <span aria-hidden="true" className="text-danger-fg ml-0.5">
            *
          </span>
          <span className="sr-only"> (wajib)</span>
        </>
      )}
    </label>
  );
}

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return <input className={cn(control, 'h-11', className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative">
      <select className={cn(control, 'h-11 appearance-none pr-9', className)} {...props}>
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="text-fg-muted pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}

export function Checkbox({
  className,
  label,
  ...props
}: ComponentProps<'input'> & { label: ReactNode }) {
  return (
    <label className="text-fg-secondary flex cursor-pointer items-start gap-2.5 text-sm">
      <input
        type="checkbox"
        className={cn(
          'border-line-strong accent-primary mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm',
          className,
        )}
        {...props}
      />
      <span>{label}</span>
    </label>
  );
}

export function FieldHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-fg-muted mt-1.5 text-[13px]">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-danger-fg mt-1.5 flex items-start gap-1.5 text-[13px]" role="alert">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function FieldSuccess({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="text-success-fg mt-1.5 flex items-center gap-1.5 text-[13px]">
      <CheckCircle2 className="size-3.5" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Label + control + hint + error wired together with ids for screen readers. */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode;
  error?: string;
  children: (aria: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => ReactNode;
  className?: string;
}) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({
        id,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true as const } : {}),
      })}
      {hint && !error && <FieldHint id={hintId}>{hint}</FieldHint>}
      <FieldError id={errorId}>{error}</FieldError>
    </div>
  );
}
