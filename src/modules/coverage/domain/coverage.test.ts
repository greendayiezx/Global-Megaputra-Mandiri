import { describe, expect, it } from 'vitest';
import {
  evaluateProviderCoverage,
  haversineMeters,
  isOrderableCoverage,
  pointInPolygon,
  summarizeCoverage,
  zoneMatches,
  type CoverageZone,
  type InstallationLocation,
} from './coverage';

// Synthetic geometry for tests only — not real coverage data.
const square = [
  [
    { lat: -6.2, lng: 106.8 },
    { lat: -6.2, lng: 106.9 },
    { lat: -6.3, lng: 106.9 },
    { lat: -6.3, lng: 106.8 },
  ],
];
const squareWithHole = [
  square[0]!,
  [
    { lat: -6.24, lng: 106.84 },
    { lat: -6.24, lng: 106.86 },
    { lat: -6.26, lng: 106.86 },
    { lat: -6.26, lng: 106.84 },
  ],
];

const loc = (
  lat: number,
  lng: number,
  extra: Partial<InstallationLocation> = {},
): InstallationLocation => ({
  point: { lat, lng },
  regionCodes: ['31', '31.74', '31.74.01'],
  postalCode: '12345',
  ...extra,
});

const base = { providerId: 'p1', lastVerifiedAt: new Date('2026-09-01') };
const opts = {
  now: new Date('2026-10-01'),
  staleAfterDays: null,
  locationResolved: true,
  providerHasActiveZones: true,
};

describe('geometry helpers', () => {
  it('point in polygon respects holes', () => {
    expect(pointInPolygon({ lat: -6.21, lng: 106.81 }, square)).toBe(true);
    expect(pointInPolygon({ lat: -6.25, lng: 106.85 }, squareWithHole)).toBe(false);
    expect(pointInPolygon({ lat: -6.1, lng: 106.85 }, square)).toBe(false);
  });

  it('haversine is accurate enough for radius zones', () => {
    // ~1 degree of latitude ≈ 111.2 km
    expect(haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111_195, -2);
  });

  it('matches every strategy', () => {
    const zones: CoverageZone[] = [
      { ...base, id: 'poly', strategy: 'POLYGON', result: 'AVAILABLE', polygons: [square] },
      {
        ...base,
        id: 'rad',
        strategy: 'RADIUS',
        result: 'AVAILABLE',
        center: { lat: -6.25, lng: 106.85 },
        radiusM: 500,
      },
      { ...base, id: 'adm', strategy: 'ADMIN_AREA', result: 'LIMITED', regionCode: '31.74' },
      {
        ...base,
        id: 'man',
        strategy: 'MANUAL_ZONE',
        result: 'REQUIRES_SURVEY',
        postalCodes: ['12345'],
      },
    ];
    const here = loc(-6.251, 106.851);
    expect(zones.filter((z) => zoneMatches(z, here)).map((z) => z.id)).toEqual([
      'poly',
      'rad',
      'adm',
      'man',
    ]);
    expect(
      zones.filter((z) => zoneMatches(z, loc(-6.0, 107.5, { regionCodes: [], postalCode: null }))),
    ).toEqual([]);
  });
});

describe('evaluateProviderCoverage', () => {
  it('returns UNKNOWN when the location is unresolved or provider has no coverage data', () => {
    expect(evaluateProviderCoverage([], { ...opts, locationResolved: false }).status).toBe(
      'UNKNOWN',
    );
    expect(evaluateProviderCoverage([], { ...opts, providerHasActiveZones: false }).status).toBe(
      'UNKNOWN',
    );
  });

  it('returns NOT_AVAILABLE when no zone matches', () => {
    expect(evaluateProviderCoverage([], opts).status).toBe('NOT_AVAILABLE');
  });

  it('explicit exclusion zones override everything', () => {
    const r = evaluateProviderCoverage(
      [
        { ...base, id: 'a', strategy: 'POLYGON', result: 'AVAILABLE' },
        { ...base, id: 'x', strategy: 'ADMIN_AREA', result: 'EXCLUDED' },
      ],
      opts,
    );
    expect(r).toEqual({ status: 'NOT_AVAILABLE', decidingZoneIds: ['x'], stale: false });
  });

  it('more specific evidence wins over broad admin-area entries', () => {
    const r = evaluateProviderCoverage(
      [
        { ...base, id: 'city', strategy: 'ADMIN_AREA', result: 'LIMITED' },
        { ...base, id: 'street', strategy: 'POLYGON', result: 'AVAILABLE' },
      ],
      opts,
    );
    expect(r.status).toBe('AVAILABLE');
    expect(r.decidingZoneIds).toEqual(['street']);
  });

  it('conflicting zones at the same specificity resolve conservatively', () => {
    const r = evaluateProviderCoverage(
      [
        { ...base, id: 'a', strategy: 'POLYGON', result: 'AVAILABLE' },
        { ...base, id: 'b', strategy: 'RADIUS', result: 'REQUIRES_SURVEY' },
      ],
      opts,
    );
    expect(r.status).toBe('REQUIRES_SURVEY');
  });

  it('downgrades stale AVAILABLE data to REQUIRES_SURVEY when freshness is configured', () => {
    const zones = [
      { ...base, id: 'a', strategy: 'POLYGON' as const, result: 'AVAILABLE' as const },
    ];
    expect(evaluateProviderCoverage(zones, { ...opts, staleAfterDays: 90 }).status).toBe(
      'AVAILABLE',
    );
    const stale = evaluateProviderCoverage(zones, { ...opts, staleAfterDays: 10 });
    expect(stale).toMatchObject({ status: 'REQUIRES_SURVEY', stale: true });
  });
});

describe('summaries', () => {
  it('only AVAILABLE / LIMITED / REQUIRES_SURVEY are orderable', () => {
    expect(isOrderableCoverage('AVAILABLE')).toBe(true);
    expect(isOrderableCoverage('REQUIRES_SURVEY')).toBe(true);
    expect(isOrderableCoverage('NOT_AVAILABLE')).toBe(false);
    expect(isOrderableCoverage('UNKNOWN')).toBe(false);
  });

  it('summarises a search across providers', () => {
    expect(summarizeCoverage(['NOT_AVAILABLE', 'LIMITED', 'REQUIRES_SURVEY'])).toBe('LIMITED');
    expect(summarizeCoverage(['NOT_AVAILABLE', 'UNKNOWN'])).toBe('NOT_AVAILABLE');
    expect(summarizeCoverage([])).toBe('UNKNOWN');
  });
});
