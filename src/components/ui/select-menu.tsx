'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '@/lib/utils';

export interface SelectMenuOption {
  value: string;
  label: string;
  /** Optional secondary line under the label. */
  hint?: string;
}

/**
 * Styled single-select for GET filter forms (replaces the native `<select>` look).
 * Submits through a hidden input, so it works inside plain `<form method="get">`.
 * Keyboard: Enter/Space/ArrowDown opens; Up/Down/Home/End move; Enter selects; Escape closes.
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
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const selected = options[selectedIndex];

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openList = () => {
    setActive(selectedIndex);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    const changed = option.value !== value;
    // Commit synchronously so the hidden input holds the new value before any submit.
    flushSync(() => {
      setValue(option.value);
      setOpen(false);
    });
    buttonRef.current?.focus();
    if (changed && inputRef.current) onValueChange?.(option.value, inputRef.current);
  };

  const onButtonKey = (e: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openList();
    }
  };

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => Math.min(last, i + 1)),
      ArrowUp: () => setActive((i) => Math.max(0, i - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => choose(active),
      ' ': () => choose(active),
      Escape: () => {
        setOpen(false);
        buttonRef.current?.focus();
      },
      Tab: () => setOpen(false),
    };
    const move = moves[e.key];
    if (move) {
      if (e.key !== 'Tab') e.preventDefault();
      move();
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(inline ? 'flex items-center gap-2' : 'block', 'relative', className)}
    >
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
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label ${id}-value`}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onClick={() => (open ? setOpen(false) : openList())}
          onKeyDown={onButtonKey}
          className={cn(
            'border-line-strong bg-surface text-fg group flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border px-3.5 text-left text-[15px] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow]',
            'hover:border-primary/60 focus-visible:border-primary focus-visible:ring-primary/15 outline-none focus-visible:ring-3',
            open && 'border-primary ring-primary/15 ring-3',
            disabled && 'bg-subtle text-fg-muted hover:border-line-strong cursor-not-allowed',
          )}
        >
          <span id={`${id}-value`} className="truncate">
            {selected?.label}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn(
              'text-fg-muted size-4 shrink-0 transition-transform duration-200',
              open && 'text-primary rotate-180',
            )}
          />
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${id}-label`}
            aria-activedescendant={`${id}-opt-${active}`}
            onKeyDown={onListKey}
            className="border-line bg-surface shadow-pop animate-select-in absolute top-full right-0 left-0 z-50 mt-1.5 max-h-72 min-w-full overflow-y-auto rounded-xl border p-1.5 outline-none"
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    i === active && 'bg-primary-soft',
                    isSelected ? 'text-primary font-semibold' : 'text-fg-secondary',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && (
                      <span className="text-fg-muted block text-xs font-normal">{o.hint}</span>
                    )}
                  </span>
                  {isSelected && <Check aria-hidden="true" className="size-4 shrink-0" />}
                </li>
              );
            })}
          </ul>
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
