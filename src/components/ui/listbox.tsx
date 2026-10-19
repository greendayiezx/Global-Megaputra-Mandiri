'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface ListboxOption {
  value: string;
  label: string;
  /** Optional secondary line under the label. */
  hint?: string;
  disabled?: boolean;
}

/** Lists longer than this get a search box. */
export const SEARCH_THRESHOLD = 10;

/** Trigger look shared by every custom dropdown, so forms and filters match. */
export function triggerClass(open: boolean, extra?: string) {
  return cn(
    'group border-line-strong bg-surface text-fg flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg border pr-2 pl-3.5 text-left text-[15px]',
    'shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-[border-color,box-shadow,background-color] duration-150',
    'hover:border-primary/50 hover:shadow-[0_2px_6px_rgba(15,23,42,0.06)] outline-none',
    'focus-visible:border-primary focus-visible:ring-primary/15 focus-visible:ring-3',
    'aria-invalid:border-danger-fg aria-invalid:focus-visible:ring-danger/15',
    'disabled:bg-subtle disabled:text-fg-muted disabled:hover:border-line-strong disabled:cursor-not-allowed disabled:shadow-none',
    open && 'border-primary ring-primary/15 ring-3',
    extra,
  );
}

/** The chevron at the end of a trigger: a small tile that turns when the list is open. */
export function TriggerChevron({ open }: { open: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-7 shrink-0 place-items-center rounded-md transition-colors duration-150',
        open
          ? 'bg-primary-soft text-primary'
          : 'text-fg-muted group-hover:bg-subtle group-disabled:bg-transparent',
      )}
    >
      <ChevronDown
        className={cn('size-4 transition-transform duration-200', open && 'rotate-180')}
      />
    </span>
  );
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

interface Position {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

/**
 * The open list of a custom dropdown. Rendered in a portal so cards with overflow-hidden
 * never clip it; a floating panel on wider screens, a bottom sheet on phones.
 * Keyboard: Up/Down/Home/End move, Enter selects, Escape closes, typing jumps (or filters
 * when the list has a search box).
 */
export function ListboxPopover({
  id,
  anchorRef,
  label,
  options,
  value,
  searchable,
  onChoose,
  onClose,
}: {
  id: string;
  anchorRef: RefObject<HTMLElement | null>;
  /** Shown as the sheet title on phones and used to name the list. */
  label: string;
  options: readonly ListboxOption[];
  value: string;
  searchable: boolean;
  onChoose: (value: string) => void;
  /** `refocus` is false when focus is moving elsewhere on its own (Tab, outside click). */
  onClose: (refocus: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [sheet] = useState(() => window.matchMedia('(max-width: 639px)').matches);
  const [pos, setPos] = useState<Position | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const shown = useMemo(() => {
    const q = fold(query.trim());
    return q ? options.filter((o) => fold(o.label).includes(q)) : options;
  }, [options, query]);

  const [active, setActive] = useState(() =>
    Math.max(
      0,
      options.findIndex((o) => o.value === value),
    ),
  );
  const current = Math.min(active, shown.length - 1);

  // Place the floating panel under the trigger, or above it when there is more room there.
  useLayoutEffect(() => {
    if (sheet) return;
    const place = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const gap = 6;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      const up = below < 240 && above > below;
      const width = Math.min(Math.max(r.width, 260), window.innerWidth - 16);
      setPos({
        left: Math.max(8, Math.min(r.left, window.innerWidth - width - 8)),
        width,
        ...(up ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
        maxHeight: Math.min(360, (up ? above : below) - gap),
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [anchorRef, sheet]);

  // The floating panel mounts after it is placed, so focus once it exists.
  const mounted = sheet || pos !== null;
  useEffect(() => {
    if (!mounted) return;
    // On phones a focused search box would pop the keyboard over the list; focus the sheet.
    const target = sheet ? panelRef.current : searchable ? searchRef.current : listRef.current;
    target?.focus({ preventScroll: true });
  }, [mounted, searchable, sheet]);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !anchorRef.current?.contains(t)) onClose(false);
    };
    window.addEventListener('pointerdown', onPointer);
    let unlock = () => {};
    if (sheet) {
      const html = document.documentElement;
      const prev = html.style.overflow;
      html.style.overflow = 'hidden';
      unlock = () => {
        html.style.overflow = prev;
      };
    }
    return () => {
      window.removeEventListener('pointerdown', onPointer);
      unlock();
    };
    // Run once per opening.
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${current}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [current, pos]);

  const step = (from: number, dir: 1 | -1) => {
    for (let i = from + dir; i >= 0 && i < shown.length; i += dir) {
      if (!shown[i]!.disabled) return i;
    }
    return from;
  };

  const pick = (i: number) => {
    const o = shown[i];
    if (o && !o.disabled) onChoose(o.value);
  };

  const onKey = (e: KeyboardEvent) => {
    const last = shown.length - 1;
    const keys: Record<string, () => void> = {
      ArrowDown: () => setActive(step(current, 1)),
      ArrowUp: () => setActive(step(current, -1)),
      Home: () => setActive(step(-1, 1)),
      End: () => setActive(step(last + 1, -1)),
      PageDown: () => setActive(Math.min(last, current + 8)),
      PageUp: () => setActive(Math.max(0, current - 8)),
      Enter: () => pick(current),
      Escape: () => onClose(true),
    };
    if (!searchable) keys[' '] = () => pick(current);
    if (e.key === 'Tab') return onClose(false);
    const run = keys[e.key];
    if (run) {
      e.preventDefault();
      run();
      return;
    }
    // Typeahead for short lists without a search box.
    if (!searchable && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = Date.now();
      const t = typed.current;
      t.text = (now - t.at > 600 ? '' : t.text) + fold(e.key);
      t.at = now;
      const hit = shown.findIndex((o) => !o.disabled && fold(o.label).startsWith(t.text));
      if (hit >= 0) setActive(hit);
    }
  };

  const activeId = shown[current] ? `${id}-opt-${current}` : undefined;

  const list = (
    <ul
      ref={listRef}
      id={`${id}-list`}
      role="listbox"
      aria-label={label}
      tabIndex={searchable ? -1 : 0}
      aria-activedescendant={searchable ? undefined : activeId}
      onKeyDown={searchable ? undefined : onKey}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none"
    >
      {shown.length === 0 && (
        <li className="text-fg-muted px-3 py-6 text-center text-sm">
          Tidak ada yang cocok dengan “{query.trim()}”.
        </li>
      )}
      {shown.map((o, i) => {
        const selected = o.value === value;
        return (
          <li
            key={o.value}
            id={`${id}-opt-${i}`}
            data-index={i}
            role="option"
            aria-selected={selected}
            aria-disabled={o.disabled || undefined}
            onPointerMove={() => !o.disabled && i !== current && setActive(i)}
            onClick={() => pick(i)}
            className={cn(
              'relative flex items-center gap-3 rounded-lg py-2.5 pr-3 pl-3 text-[15px] transition-colors duration-100 sm:text-sm',
              o.disabled ? 'text-fg-muted cursor-not-allowed' : 'cursor-pointer',
              i === current && !o.disabled && 'bg-primary-soft/70',
              selected ? 'text-primary font-semibold' : !o.disabled && 'text-fg-secondary',
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block">{o.label}</span>
              {o.hint && (
                <span className="text-fg-muted mt-0.5 block text-xs font-normal">{o.hint}</span>
              )}
            </span>
            <span
              aria-hidden="true"
              className={cn(
                'grid size-5 shrink-0 place-items-center rounded-full transition-[opacity,transform] duration-150',
                selected ? 'bg-primary scale-100 text-white opacity-100' : 'scale-75 opacity-0',
              )}
            >
              <Check className="size-3" strokeWidth={3} />
            </span>
          </li>
        );
      })}
    </ul>
  );

  const search = searchable && (
    <div className="border-line relative border-b p-2">
      <Search
        aria-hidden="true"
        className="text-fg-muted pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2"
      />
      <input
        ref={searchRef}
        type="search"
        role="combobox"
        aria-expanded="true"
        aria-controls={`${id}-list`}
        aria-activedescendant={activeId}
        aria-autocomplete="list"
        aria-label={`Cari ${label.toLowerCase()}`}
        placeholder="Ketik untuk mencari…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onKey}
        autoComplete="off"
        className="bg-subtle placeholder:text-fg-muted focus:bg-surface focus:ring-primary/30 h-10 w-full rounded-md pr-3 pl-9 text-base outline-none focus:ring-2 sm:text-sm [&::-webkit-search-cancel-button]:hidden"
      />
    </div>
  );

  const footer = searchable && (
    <p className="border-line text-fg-muted border-t px-3.5 py-2 text-xs">
      {shown.length} dari {options.length} pilihan
    </p>
  );

  if (sheet) {
    return createPortal(
      <div className="fixed inset-0 z-[70]">
        <div aria-hidden="true" className="animate-fade-in absolute inset-0 bg-slate-950/40" />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          onKeyDown={(e) => e.key === 'Escape' && onClose(true)}
          className="bg-surface animate-sheet-in absolute inset-x-0 bottom-0 flex max-h-[78dvh] flex-col rounded-t-2xl pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_40px_rgba(15,23,42,0.18)] outline-none"
        >
          <div aria-hidden="true" className="bg-line-strong mx-auto mt-2.5 h-1 w-10 rounded-full" />
          <div className="flex items-center justify-between gap-3 px-4 pt-2 pb-2.5">
            <p className="text-fg truncate text-base font-semibold">{label}</p>
            <button
              type="button"
              onClick={() => onClose(true)}
              aria-label="Tutup"
              className="text-fg-muted hover:bg-subtle grid size-9 place-items-center rounded-full"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>
          {search}
          {list}
          {footer}
        </div>
      </div>,
      document.body,
    );
  }

  if (!pos) return null;
  return createPortal(
    <div
      ref={panelRef}
      style={{
        left: pos.left,
        width: pos.width,
        top: pos.top,
        bottom: pos.bottom,
        maxHeight: pos.maxHeight,
      }}
      className={cn(
        'border-line bg-surface/95 fixed z-[70] flex flex-col overflow-hidden rounded-xl border shadow-[0_12px_32px_-4px_rgba(15,23,42,0.16),0_2px_6px_rgba(15,23,42,0.06)] backdrop-blur-md',
        pos.bottom === undefined
          ? 'animate-select-in origin-top'
          : 'animate-select-up origin-bottom',
      )}
    >
      {search}
      {list}
      {footer}
    </div>,
    document.body,
  );
}
