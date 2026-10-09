/** Package-search filter vocabularies. Pure data, safe to import from client components. */

/** Download-speed buckets offered as checkboxes; a package matches any selected bucket. */
export const SPEED_RANGES = [
  { key: '10-50', min: 10, max: 50 },
  { key: '51-100', min: 51, max: 100 },
  { key: '101-200', min: 101, max: 200 },
  { key: '201-500', min: 201, max: 500 },
] as const;
export type SpeedRangeKey = (typeof SPEED_RANGES)[number]['key'];
export const SPEED_RANGE_KEYS = SPEED_RANGES.map((r) => r.key);

/** Bounds of the monthly-price slider; a value at a bound means "no limit on that side". */
export const PRICE_RANGE = { min: 0, max: 1_000_000, step: 25_000 } as const;
