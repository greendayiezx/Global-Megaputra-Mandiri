'use client';

import { useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  ListboxPopover,
  SEARCH_THRESHOLD,
  TriggerChevron,
  triggerClass,
  type ListboxOption,
} from './listbox';

export type SelectMenuOption = ListboxOption;

/**
 * Styled single-select for GET filter forms.
 * Submits through a hidden input, so it works inside plain `<form method="get">`.
 */
export function SelectMenu({
  name,
  form,
  label,
  options,
  defaultValue = '',
  disabled = false,
  hint,
  onValueChange,
  className,
  labelClassName,
  inline = false,
}: {
  name?: string;
  /** Id of the form the hidden input belongs to, when rendered outside it. */
  form?: string;
  label: string;
  options: readonly SelectMenuOption[];
  defaultValue?: string;
  disabled?: boolean;
  hint?: string;
  /** Called after the hidden input holds the new value (e.g. to submit the form). */
  onValueChange?: (value: string, input: HTMLInputElement) => void;
  className?: string;
  labelClassName?: string;
  /** Label beside the control instead of above it. */
  inline?: boolean;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  const choose = (next: string) => {
    const changed = next !== value;
    // Commit synchronously so the hidden input holds the new value before any submit.
    flushSync(() => {
      setValue(next);
      setOpen(false);
    });
    buttonRef.current?.focus();
    if (changed && inputRef.current) onValueChange?.(next, inputRef.current);
  };

  return (
    <div className={cn(inline ? 'flex items-center gap-2' : 'block', 'relative', className)}>
      <span
        id={`${id}-label`}
        className={cn(
          'text-fg-secondary block text-sm font-medium',
          inline ? 'text-fg-muted shrink-0' : 'mb-1.5',
          labelClassName,
        )}
      >
        {label}
      </span>
      <input ref={inputRef} type="hidden" name={name} form={form} value={value} readOnly />
      <div className="relative min-w-0 flex-1">
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? `${id}-list` : undefined}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
              e.preventDefault();
              setOpen(true);
            }
          }}
          className={triggerClass(open)}
        >
          <span id={`${id}-value`} className="truncate">
            {selected?.label}
          </span>
          <TriggerChevron open={open} />
        </button>
        {open && (
          <ListboxPopover
            id={id}
            anchorRef={buttonRef}
            label={label}
            options={options}
            value={value}
            searchable={options.length > SEARCH_THRESHOLD}
            onChoose={choose}
            onClose={(refocus) => {
              setOpen(false);
              if (refocus) buttonRef.current?.focus();
            }}
          />
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-fg-muted mt-1.5 text-[13px]">
          {hint}
        </p>
      )}
    </div>
  );
}
