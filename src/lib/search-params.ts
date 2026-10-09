import { isValidPoint, type GeoPoint } from '@/modules/coverage/domain/coverage';

export type RawSearchParams = Record<string, string | string[] | undefined>;

export function str(params: RawSearchParams, key: string): string | null {
  const v = params[key];
  const s = (Array.isArray(v) ? v[0] : v)?.trim();
  return s ? s.slice(0, 200) : null;
}

export function int(params: RawSearchParams, key: string): number | null {
  const s = str(params, key);
  if (s === null) return null;
  const n = Number(s);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}

/** Checkbox semantics: present with "1"/"on"/"true" → true. */
export function bool(params: RawSearchParams, key: string): boolean {
  const s = str(params, key);
  return s === '1' || s === 'on' || s === 'true';
}

/** Every non-empty value of a repeated key (e.g. `?provider=a&provider=b`), de-duplicated. */
export function all(params: RawSearchParams, key: string): string[] {
  const v = params[key];
  const list = (Array.isArray(v) ? v : v === undefined ? [] : [v])
    .map((s) => s.trim().slice(0, 200))
    .filter(Boolean);
  return [...new Set(list)].slice(0, 50);
}

/** Like `all`, keeping only allowed values. */
export function allOf<T extends string>(
  params: RawSearchParams,
  key: string,
  allowed: readonly T[],
): T[] {
  return all(params, key).filter((s): s is T => (allowed as readonly string[]).includes(s));
}

export function oneOf<T extends string>(
  params: RawSearchParams,
  key: string,
  allowed: readonly T[],
): T | null {
  const s = str(params, key);
  return s !== null && (allowed as readonly string[]).includes(s) ? (s as T) : null;
}

/** Parses `lat`/`lng`; returns null when absent or out of range. */
export function point(params: RawSearchParams): GeoPoint | null {
  const lat = Number(str(params, 'lat'));
  const lng = Number(str(params, 'lng'));
  if (str(params, 'lat') === null || str(params, 'lng') === null) return null;
  const p = { lat, lng };
  return isValidPoint(p) ? p : null;
}

type QueryValue = string | number | null | undefined;

/** Builds a query string from defined values only; arrays become repeated keys. */
export function qs(values: Record<string, QueryValue | readonly QueryValue[]>): string {
  const sp = new URLSearchParams();
  for (const [k, raw] of Object.entries(values)) {
    for (const v of Array.isArray(raw) ? raw : [raw]) {
      if (v !== null && v !== undefined && v !== '') sp.append(k, String(v));
    }
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
