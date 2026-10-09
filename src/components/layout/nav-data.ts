import 'server-only';
import { NEEDS } from '@/content/needs';
import { listPublicPackages, listPublicProviders } from '@/modules/packages/application/catalog';
import type { Technology } from '@/modules/packages/application/catalog-repository';

export interface NavProvider {
  slug: string;
  name: string;
  technologies: Technology[];
  serviceAreas: string[];
  packageCount: number;
  startingPrice: number | null;
}

/** Serializable data for the header menus. Prices come from real listed packages only. */
export interface NavData {
  /** Lowest monthly price per need key; null when no package matches yet. */
  needPrices: Record<string, number | null>;
  providers: NavProvider[];
}

export async function getNavData(): Promise<NavData> {
  const [views, providers] = await Promise.all([listPublicPackages(), listPublicProviders()]);
  const min = (prices: number[]) => (prices.length ? Math.min(...prices) : null);

  const needPrices = Object.fromEntries(
    NEEDS.map((n) => [
      n.key,
      min(
        views
          .filter(
            (v) =>
              (n.minDownload === undefined || v.pkg.downloadMbps >= n.minDownload) &&
              (n.minUpload === undefined || v.pkg.uploadMbps >= n.minUpload),
          )
          .map((v) => v.pkg.monthlyPrice),
      ),
    ]),
  );

  return {
    needPrices,
    // Same ordering intent as the directory: admin priority first, then name.
    providers: [...providers]
      .sort(
        (a, b) =>
          b.listingPriority - a.listingPriority || a.displayName.localeCompare(b.displayName),
      )
      .map((p) => {
        const own = views.filter((v) => v.provider.id === p.id).map((v) => v.pkg.monthlyPrice);
        return {
          slug: p.slug,
          name: p.displayName,
          technologies: p.technologies,
          serviceAreas: p.serviceAreaNames,
          packageCount: own.length,
          startingPrice: min(own),
        };
      }),
  };
}
