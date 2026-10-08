/**
 * Coverage engine — pure decision rules (brief §5).
 *
 * In production, candidate zones are found by a PostGIS query (ST_Covers / ST_DWithin /
 * region-code match). The geometry helpers here are a reference implementation used by
 * unit tests and as a fallback; `evaluateProviderCoverage` is the single source of truth
 * for turning matched zones into a customer-facing status.
 *
 * A coverage result is a signal, never a guarantee: every status other than NOT_AVAILABLE
 * is shown with the "final installation may require a technical survey" notice.
 */

export const COVERAGE_STATUSES = [
  'AVAILABLE',
  'LIMITED',
  'REQUIRES_SURVEY',
  'NOT_AVAILABLE',
  'UNKNOWN',
] as const;
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export type ZoneResult = 'AVAILABLE' | 'LIMITED' | 'REQUIRES_SURVEY' | 'EXCLUDED';
export type CoverageStrategy = 'POLYGON' | 'RADIUS' | 'ADMIN_AREA' | 'MANUAL_ZONE' | 'CUSTOM';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface InstallationLocation {
  point: GeoPoint;
  /** Region codes from province down to sub-district, when resolved. */
  regionCodes: readonly string[];
  postalCode: string | null;
}

interface ZoneBase {
  id: string;
  providerId: string;
  result: ZoneResult;
  lastVerifiedAt: Date | null;
}

/** Polygon rings: first ring is the outer boundary, following rings are holes. */
export type PolygonRings = readonly (readonly GeoPoint[])[];

export type CoverageZone = ZoneBase &
  (
    | { strategy: 'POLYGON' | 'CUSTOM'; polygons: readonly PolygonRings[] }
    | { strategy: 'RADIUS'; center: GeoPoint; radiusM: number }
    | { strategy: 'ADMIN_AREA'; regionCode: string }
    | { strategy: 'MANUAL_ZONE'; postalCodes: readonly string[] }
  );

const EARTH_RADIUS_M = 6_371_008.8;

export function isValidPoint(p: GeoPoint): boolean {
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lng >= -180 &&
    p.lng <= 180
  );
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Ray casting on lng/lat. Adequate for neighbourhood-sized zones; PostGIS is authoritative. */
function pointInRing(p: GeoPoint, ring: readonly GeoPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]!;
    const b = ring[j]!;
    const crosses =
      a.lat > p.lat !== b.lat > p.lat &&
      p.lng < ((b.lng - a.lng) * (p.lat - a.lat)) / (b.lat - a.lat) + a.lng;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function pointInPolygon(p: GeoPoint, rings: PolygonRings): boolean {
  const [outer, ...holes] = rings;
  if (!outer || !pointInRing(p, outer)) return false;
  return !holes.some((hole) => pointInRing(p, hole));
}

export function zoneMatches(zone: CoverageZone, loc: InstallationLocation): boolean {
  switch (zone.strategy) {
    case 'POLYGON':
    case 'CUSTOM':
      return zone.polygons.some((rings) => pointInPolygon(loc.point, rings));
    case 'RADIUS':
      return haversineMeters(zone.center, loc.point) <= zone.radiusM;
    case 'ADMIN_AREA':
      return loc.regionCodes.includes(zone.regionCode);
    case 'MANUAL_ZONE':
      return loc.postalCode !== null && zone.postalCodes.includes(loc.postalCode);
  }
}

/**
 * More specific evidence wins over broader evidence: a provider's drawn polygon says more
 * about a street than a whole-city administrative entry does.
 */
const SPECIFICITY: Record<CoverageStrategy, number> = {
  CUSTOM: 4,
  POLYGON: 3,
  RADIUS: 3,
  MANUAL_ZONE: 2,
  ADMIN_AREA: 1,
};

/** Lower = more conservative. Ties at the same specificity resolve to the conservative result. */
const CONSERVATISM: Record<Exclude<ZoneResult, 'EXCLUDED'>, number> = {
  REQUIRES_SURVEY: 0,
  LIMITED: 1,
  AVAILABLE: 2,
};

export interface CoverageEvaluationOptions {
  now: Date;
  /** TODO_BUSINESS_DECISION D13 — null disables freshness downgrade. */
  staleAfterDays: number | null;
  /** False when the address could not be resolved to a confirmed point. */
  locationResolved: boolean;
  /** False when the provider has no active coverage data at all. */
  providerHasActiveZones: boolean;
}

export interface ProviderCoverageResult {
  status: CoverageStatus;
  /** Zones that decided the result (for audit/debug, stored in coverage_checks). */
  decidingZoneIds: string[];
  /** The deciding data is older than the freshness threshold. */
  stale: boolean;
}

export function evaluateProviderCoverage(
  matchedZones: readonly Pick<CoverageZone, 'id' | 'strategy' | 'result' | 'lastVerifiedAt'>[],
  opts: CoverageEvaluationOptions,
): ProviderCoverageResult {
  if (!opts.locationResolved || !opts.providerHasActiveZones) {
    return { status: 'UNKNOWN', decidingZoneIds: [], stale: false };
  }

  const exclusions = matchedZones.filter((z) => z.result === 'EXCLUDED');
  if (exclusions.length > 0) {
    return { status: 'NOT_AVAILABLE', decidingZoneIds: exclusions.map((z) => z.id), stale: false };
  }
  if (matchedZones.length === 0) {
    return { status: 'NOT_AVAILABLE', decidingZoneIds: [], stale: false };
  }

  const topSpecificity = Math.max(...matchedZones.map((z) => SPECIFICITY[z.strategy]));
  const candidates = matchedZones.filter((z) => SPECIFICITY[z.strategy] === topSpecificity);
  const minConservatism = Math.min(
    ...candidates.map((z) => CONSERVATISM[z.result as Exclude<ZoneResult, 'EXCLUDED'>]),
  );
  const deciding = candidates.filter(
    (z) => CONSERVATISM[z.result as Exclude<ZoneResult, 'EXCLUDED'>] === minConservatism,
  );
  let status = deciding[0]!.result as CoverageStatus;

  let stale = false;
  if (opts.staleAfterDays !== null) {
    const thresholdMs = opts.now.getTime() - opts.staleAfterDays * 86_400_000;
    stale = deciding.every(
      (z) => z.lastVerifiedAt === null || z.lastVerifiedAt.getTime() < thresholdMs,
    );
    if (stale && status === 'AVAILABLE') status = 'REQUIRES_SURVEY';
  }

  return { status, decidingZoneIds: deciding.map((z) => z.id), stale };
}

/** Statuses for which a customer may start an order (final feasibility is confirmed later). */
export function isOrderableCoverage(status: CoverageStatus): boolean {
  return status === 'AVAILABLE' || status === 'LIMITED' || status === 'REQUIRES_SURVEY';
}

/** Overall result of one search across all providers (stored on coverage_checks). */
export function summarizeCoverage(statuses: readonly CoverageStatus[]): CoverageStatus {
  for (const s of ['AVAILABLE', 'LIMITED', 'REQUIRES_SURVEY'] as const) {
    if (statuses.includes(s)) return s;
  }
  // At least one provider definitively said "no" and none said "yes" → NOT_AVAILABLE.
  return statuses.includes('NOT_AVAILABLE') ? 'NOT_AVAILABLE' : 'UNKNOWN';
}
