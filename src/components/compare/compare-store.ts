'use client';

import { useSyncExternalStore } from 'react';

export const MAX_COMPARE = 4;
const KEY = 'gmm.compare';
const EVENT = 'gmm-compare-change';

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string').slice(0, MAX_COMPARE)
      : [];
  } catch {
    return [];
  }
}

let cache: string[] = [];
let cacheKey = '';

function snapshot(): string[] {
  const next = read();
  const key = next.join(',');
  if (key !== cacheKey) {
    cache = next;
    cacheKey = key;
  }
  return cache;
}

const EMPTY: string[] = [];

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', cb);
  };
}

export function useCompareIds(): string[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

export function writeCompareIds(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)));
  } catch {
    // Storage unavailable (private mode): comparison still works via the URL.
  }
  window.dispatchEvent(new Event(EVENT));
}
