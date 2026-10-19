'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import {
  ListboxPopover,
  SEARCH_THRESHOLD,
  TriggerChevron,
  triggerClass,
  type ListboxOption,
} from './listbox';

const textOf = (node: ReactNode): string =>
  Children.toArray(node)
    .map((c) =>
      typeof c === 'string' || typeof c === 'number'
        ? String(c)
        : isValidElement<{ children?: ReactNode }>(c)
          ? textOf(c.props.children)
          : '',
    )
    .join('');

function optionsOf(children: ReactNode): ListboxOption[] {
  return Children.toArray(children).flatMap((c) => {
    // `<option hidden>` is a placeholder: shown on the closed control, not offered in the list.
    if (!isValidElement<ComponentProps<'option'>>(c) || c.type !== 'option') return [];
    if (c.props.hidden) return [];
    const label = textOf(c.props.children);
    return [
      {
        value: String(c.props.value ?? label),
        label,
        disabled: c.props.disabled,
      },
    ];
  });
}

/**
 * Drop-in replacement for `<select>`: same props and `<option>` children, a styled list.
 * A visually hidden native select stays in the form, so names, `required`, form resets and
 * `onChange` handlers behave exactly as before. Lists longer than ten get a search box.
 */
export function Select({
  className,
  children,
  id,
  value,
  defaultValue,
  onChange,
  disabled,
  searchable,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
  'aria-label': ariaLabel,
  ...rest
}: ComponentProps<'select'> & { searchable?: boolean }) {
  const autoId = useId();
  const baseId = id ?? autoId;
  const options = optionsOf(children);
  const controlled = value !== undefined;
  const initial = String(defaultValue ?? options[0]?.value ?? '');
  const [inner, setInner] = useState(initial);
  const current = controlled ? String(value) : inner;
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('Pilih');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const initialRef = useRef(initial);

  // form.reset() puts the native select back; mirror that in the custom control.
  useEffect(() => {
    const form = nativeRef.current?.form;
    if (!form || controlled) return;
    const onReset = () =>
      setTimeout(() => {
        setInner(initialRef.current);
        if (nativeRef.current) nativeRef.current.value = initialRef.current;
      });
    form.addEventListener('reset', onReset);
    return () => form.removeEventListener('reset', onReset);
  }, [controlled]);

  const placeholder = Children.toArray(children).find(
    (c): c is ReactElement<ComponentProps<'option'>> =>
      isValidElement<ComponentProps<'option'>>(c) && c.type === 'option' && !!c.props.hidden,
  );
  const selected = options.find((o) => o.value === current) ?? {
    value: '',
    label: placeholder ? textOf(placeholder.props.children) : (options[0]?.label ?? ''),
  };

  const openList = () => {
    const text =
      ariaLabel ??
      (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent) ??
      'Pilih';
    setLabel(text.replace(/\s*\*?\s*\(wajib\)$/, '').trim() || 'Pilih');
    setOpen(true);
  };

  const choose = (next: string) => {
    setOpen(false);
    buttonRef.current?.focus();
    const el = nativeRef.current;
    if (!el || next === current) return;
    // Let React's onChange see a real change event from the native select.
    el.value = next;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };

  return (
    <div className="relative">
      <select
        {...rest}
        ref={nativeRef}
        id={`${baseId}-native`}
        tabIndex={-1}
        aria-hidden="true"
        disabled={disabled}
        value={current}
        onChange={(e) => {
          if (!controlled) setInner(e.target.value);
          onChange?.(e);
        }}
        className="pointer-events-none absolute inset-0 size-full opacity-0"
      >
        {children}
      </select>
      <button
        ref={buttonRef}
        id={baseId}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${baseId}-list` : undefined}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            openList();
          }
        }}
        className={triggerClass(open, cn('relative', className))}
      >
        <span className={cn('truncate', !selected?.value && 'text-fg-muted')}>
          {selected?.label}
        </span>
        <TriggerChevron open={open} />
      </button>
      {open && (
        <ListboxPopover
          id={baseId}
          anchorRef={buttonRef}
          label={label}
          options={options}
          value={current}
          searchable={searchable ?? options.length > SEARCH_THRESHOLD}
          onChoose={choose}
          onClose={(refocus) => {
            setOpen(false);
            if (refocus) buttonRef.current?.focus();
          }}
        />
      )}
    </div>
  );
}
