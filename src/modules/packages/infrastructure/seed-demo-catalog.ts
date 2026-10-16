import type { Db } from '@/db/client';
import {
  coverageZones,
  internetPackages,
  packagePriceHistory,
  providers,
  type ZoneGeometry,
} from '@/db/schema';
import type { CoverageZone } from '@/modules/coverage/domain/coverage';
import { DEMO_CATALOG } from './demo-catalog';

function geometryOf(z: CoverageZone): ZoneGeometry {
  switch (z.strategy) {
    case 'POLYGON':
    case 'CUSTOM':
      return { polygons: z.polygons.map((rings) => rings.map((ring) => [...ring])) };
    case 'RADIUS':
      return { center: z.center, radiusM: z.radiusM };
    case 'ADMIN_AREA':
      return { regionCode: z.regionCode };
    case 'MANUAL_ZONE':
      return { postalCodes: [...z.postalCodes] };
  }
}

/**
 * Inserts the demo providers, packages, and zones that are missing. Existing rows are left
 * alone, so edits made through the portals survive restarts. Caller must only run this
 * where demo data is allowed (dev/staging).
 */
export async function seedDemoCatalog(db: Db): Promise<void> {
  const { providers: provs, packages: pkgs, zones } = DEMO_CATALOG;
  await db.transaction(async (tx) => {
    await tx
      .insert(providers)
      .values(
        provs.map((p) => ({
          id: p.id,
          slug: p.slug,
          displayName: p.displayName,
          legalName: p.legalName,
          description: p.description,
          website: p.website,
          supportPhone: p.supportPhone,
          supportEmail: p.supportEmail,
          supportHours: p.supportHours,
          slaSummary: p.slaSummary,
          installationInfo: p.installationInfo,
          technologies: [...p.technologies],
          serviceAreaNames: [...p.serviceAreaNames],
          verificationStatus: p.verificationStatus,
          verifiedAt: p.verifiedAt,
          listingPriority: p.listingPriority,
          isDemo: true,
        })),
      )
      .onConflictDoNothing();

    const inserted = await tx
      .insert(internetPackages)
      .values(
        pkgs.map((k) => ({
          id: k.id,
          providerId: k.providerId,
          name: k.name,
          slug: k.slug,
          description: k.description,
          downloadMbps: k.downloadMbps,
          uploadMbps: k.uploadMbps,
          technology: k.technology,
          monthlyPrice: k.monthlyPrice,
          installationFee: k.installationFee,
          activationFee: k.activationFee,
          taxIncluded: k.taxIncluded,
          contractMonths: k.contractMonths,
          routerIncluded: k.routerIncluded,
          fupPolicy: k.fupPolicy,
          slaSummary: k.slaSummary,
          supportHours: k.supportHours,
          estInstallationDaysMin: k.estInstallationDaysMin,
          estInstallationDaysMax: k.estInstallationDaysMax,
          features: k.features,
          status: k.status,
          publishedAt: k.publishedAt,
          lastPriceVerifiedAt: k.lastPriceVerifiedAt,
          validUntil: k.validUntil,
          isDemo: true,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: internetPackages.id });

    // Starting price row for packages created just now.
    const fresh = new Set(inserted.map((r) => r.id));
    const priceRows = pkgs
      .filter((k) => fresh.has(k.id))
      .map((k) => ({
        packageId: k.id,
        monthlyPrice: k.monthlyPrice,
        installationFee: k.installationFee,
        activationFee: k.activationFee,
        taxIncluded: k.taxIncluded,
        effectiveAt: k.publishedAt ?? new Date(),
      }));
    if (priceRows.length) await tx.insert(packagePriceHistory).values(priceRows);

    await tx
      .insert(coverageZones)
      .values(
        zones.map((z) => ({
          id: z.id,
          providerId: z.providerId,
          name: `Area ${z.id} (demo)`,
          strategy: z.strategy,
          geometry: geometryOf(z),
          result: z.result,
          lastVerifiedAt: z.lastVerifiedAt,
          source: 'IMPORT',
        })),
      )
      .onConflictDoNothing();
  });
}
