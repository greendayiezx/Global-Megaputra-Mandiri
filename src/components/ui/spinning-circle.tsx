'use client';

import { cva } from 'class-variance-authority';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

const spinningCircleVariants = cva('inline-flex items-center justify-center gap-2', {
  variants: {
    messagePlacement: {
      bottom: 'flex-col',
      top: 'flex-col-reverse',
      right: 'flex-row',
      left: 'flex-row-reverse',
    },
  },
  defaultVariants: {
    messagePlacement: 'bottom',
  },
});

export interface SpinningCircleProps {
  message?: string;
  /**
   * Position of the message relative to the spinner.
   * @default bottom
   */
  messagePlacement?: 'top' | 'bottom' | 'left' | 'right';
  /** Screen-reader text when no visible message is shown. */
  label?: string;
}

/**
 * Indeterminate spinner for actions whose result has no known shape yet (submitting a form,
 * loading a map). For content with a known layout, use `Skeleton` instead.
 * `className` styles the circle itself, e.g. `size-4 border-2` inside a button.
 */
export function SpinningCircle({
  className,
  message,
  messagePlacement = 'bottom',
  label = 'Memuat',
  ...props
}: HTMLMotionProps<'span'> & SpinningCircleProps) {
  const reduceMotion = useReducedMotion();
  return (
    // Spans (not divs) so it can sit inside a <button>.
    <span role="status" className={cn(spinningCircleVariants({ messagePlacement }))}>
      <motion.span
        aria-hidden="true"
        className={cn(
          'border-line border-t-primary block size-8 shrink-0 rounded-full border-4',
          className,
        )}
        animate={{ rotate: 360 }}
        transition={{
          // Slower turn for visitors who ask for reduced motion; still shows activity.
          duration: reduceMotion ? 2.5 : 1,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
        {...props}
      />
      {message ? (
        <span className="text-fg-muted text-sm">{message}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}

export default SpinningCircle;
