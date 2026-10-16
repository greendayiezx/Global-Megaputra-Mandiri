import { eq } from 'drizzle-orm';
import { cache } from 'react';
import type { Db } from '@/db/client';
import { coverageZones, internetPackages, providers, type ZoneGeometry } from '@/db/schema';
import type { CoverageZone } from '@/modules/coverage/domain/coverage';
import type {
  CatalogRepository,
  PackageRecord,
  ProviderRecord,
  Technology,
} from '../application/catalog-repository';

export type ProviderRow = typeof providers.$inferSelect;
export type PackageRow = typeof internetPackages.$inferSelect;
export type ZoneRow = typeof coverageZones.$inferSelect;

export function toProviderRecord(r: ProviderRow): ProviderRecord {
  return {
    id: r.id,
    slug: r.slug,
    displayName: r.displayName,
    legalName: r.legalName,
    description: r.description,
    technologies: r.technologies as Technology[],
    supportHours: r.supportHours,
    slaSummary: r.slaSummary,
    supportPhone: r.supportPhone,
    supportEmail: r.supportEmail,
    website: r.website,
    serviceAreaNames: r.serviceAreaNames,
    listingPriority: r.listingPriority,
    installationInfo: r.installationInfo,
    verificationStatus: r.verificationStatus,
    verifiedAt: r.verifiedAt,
    deletedAt: r.deletedAt,
    isDemo: r.isDemo,
  };
}

export function toPackageRecord(r: PackageRow): PackageRecord {
  return {
    id: r.id,
    providerId: r.providerId,
    name: r.name,
    slug: r.slug,
    description: r.description,
    downloadMbps: r.downloadMbps,
    uploadMbps: r.uploadMbps,
    technology: r.technology as Technology,
    monthlyPrice: r.monthlyPrice,
    installationFee: r.installationFee,
    activationFee: r.activationFee,
    taxIncluded: r.taxIncluded,
    contractMonths: r.contractMonths,
    routerIncluded: r.routerIncluded,
    fupPolicy: r.fupPolicy,
    slaSummary: r.slaSummary,
    supportHours: r.supportHours,
    estInstallationDaysMin: r.estInstallationDaysMin,
    estInstallationDaysMax: r.estInstallationDaysMax,
    features: r.features,
    status: r.status,
    publishedAt: r.publishedAt,
    lastPriceVerifiedAt: r.lastPriceVerifiedAt,
    validUntil: r.validUntil,
    isDemo: r.isDemo,
  };
}

/** Rebuilds the engine's zone shape from the stored geometry; malformed rows are skipped. */
export function toCoverageZone(r: ZoneRow): CoverageZone | null {
  const base = {
    id: r.id,
    providerId: r.providerId,
    result: r.result,
    lastVerifiedAt: r.lastVerifiedAt,
  };
  const g = r.geometry as ZoneGeometry;
  switch (r.strategy) {
    case 'POLYGON':
    case 'CUSTOM':
      return 'polygons' in g ? { ...base, strategy: r.strategy, polygons: g.polygons } : null;
    case 'RADIUS':
      return 'center' in g
        ? { ...base, strategy: 'RADIUS', center: g.center, radiusM: g.radiusM }
        : null;
    case 'ADMIN_AREA':
      return 'regionCode' in g
        ? { ...base, strategy: 'ADMIN_AREA', regionCode: g.regionCode }
        : null;
    case 'MANUAL_ZONE':
      return 'postalCodes' in g
        ? { ...base, strategy: 'MANUAL_ZONE', postalCodes: g.postalCodes }
        : null;
  }
}

/**
 * Postgres-backed catalog. Reads are memoised per request (`cache`), so a page that asks
 * for providers several times queries once.
 */
export function createDbCatalogRepository(getDb: () => Promise<Db>): CatalogRepository {
  return {
    listProviders: cache(async () => {
      const db = await getDb();
      return (await db.select().from(providers)).map(toProviderRecord);
    }),
    listPackages: cache(async () => {
      const db = await getDb();
      return (await db.select().from(internetPackages)).map(toPackageRecord);
    }),
    listActiveZones: cache(async () => {
      const db = await getDb();
      const rows = await db.select().from(coverageZones).where(eq(coverageZones.status, 'ACTIVE'));
      return rows.map(toCoverageZone).filter((z): z is CoverageZone => z !== null);
    }),
  };
}
