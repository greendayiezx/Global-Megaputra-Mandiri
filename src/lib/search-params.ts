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

/** Builds a query string from defined values only. */
export function qs(values: Record<string, string | number | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(values)) {
    if (v !== null && v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}
