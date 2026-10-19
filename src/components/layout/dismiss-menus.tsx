'use client';

import { useEffect } from 'react';

/**
 * Header menus are plain `<details>`; this closes an open one on an outside click or
 * Escape, which `<details>` does not do by itself.
 */
export function DismissMenus({ scope }: { scope: string }) {
  useEffect(() => {
    const openMenus = () =>
      Array.from(document.querySelectorAll<HTMLDetailsElement>(`${scope} details[open]`));
    const onPointer = (e: PointerEvent) => {
      for (const d of openMenus()) if (!d.contains(e.target as Node)) d.open = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      for (const d of openMenus()) {
        d.open = false;
        d.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [scope]);
  return null;
}
