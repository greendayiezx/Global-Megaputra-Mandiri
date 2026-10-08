import { cn } from '@/lib/utils';

/**
 * Placeholder mark built from the provider's name until the provider uploads its own logo.
 * Deliberately plain so it is never mistaken for a real brand logo.
 */
export function ProviderAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const digits = name.match(/\d+$/)?.[0];
  return (
    <span
      aria-hidden="true"
      className={cn(
        'border-line bg-subtle text-fg-secondary grid shrink-0 place-items-center rounded-md border font-semibold',
        size === 'sm' && 'size-9 text-xs',
        size === 'md' && 'size-11 text-sm',
        size === 'lg' && 'size-16 text-lg',
      )}
    >
      {digits ? `${initials[0] ?? ''}${digits.slice(-2)}` : initials}
    </span>
  );
}
