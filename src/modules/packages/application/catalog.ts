import 'server-only';

import { appConfig } from '@/config/app';
import {
  evaluateProviderCoverage,
  isOrderableCoverage,
  isValidPoint,
  summarizeCoverage,
  zoneMatches,
  type CoverageStatus,
  type GeoPoint,
} from '@/modules/coverage/domain/coverage';
import { isPackagePubliclyListable } from '@/modules/packages/domain/package-rules';
import { isProviderPubliclyVisible } from '@/modules/providers/domain/provider-rules';
import { demoCatalogRepository } from '../infrastructure/demo-catalog';
import {
  TECHNOLOGY_LABEL,
  type CatalogRepository,
  type PackageRecord,
  type ProviderRecord,
  type Technology,
} from './catalog-repository';

const repo: CatalogRepository = demoCatalogRepository;

export interface ProviderCoverage {
  provider: ProviderRecord;
  status: CoverageStatus;
  lastVerifiedAt: Date | null;
}

export interface CoverageResult {
  point: GeoPoint;
  overall: CoverageStatus;
  providers: ProviderCoverage[];
}

export interface PackageView {
  pkg: PackageRecord;
  provider: ProviderRecord;
  coverage: ProviderCoverage | null;
}

async function publicProviders(): Promise<ProviderRecord[]> {
  const all = await repo.listProviders();
  return all.filter((p) => isProviderPubliclyVisible(p, appConfig.showDemoData));
}

async function publicPackages(): Promise<PackageView[]> {
  const [providers, packages] = await Promise.all([publicProviders(), repo.listPackages()]);
  const byId = new Map(providers.map((p) => [p.id, p]));
  const now = new Date();
  const out: PackageView[] = [];
  for (const pkg of packages) {
    const provider = byId.get(pkg.providerId);
    if (provider && isPackagePubliclyListable(pkg, provider, now, appConfig.showDemoData)) {
      out.push({ pkg, provider, coverage: null });
    }
  }
  return out;
}

export async function listPublicPackages() {
  return publicPackages();
}

export async function listPublicProviders() {
  return publicProviders();
}

export async function getPublicProvider(slug: string) {
  const provider = (await publicProviders()).find((p) => p.slug === slug);
  if (!provider) return null;
  const packages = (await publicPackages()).filter((v) => v.provider.id === provider.id);
  return { provider, packages };
}

export async function getPublicPackage(slug: string) {
  return (await publicPackages()).find((v) => v.pkg.slug === slug) ?? null;
}

export async function getPublicPackagesByIds(ids: readonly string[]) {
  const all = await publicPackages();
  return ids.flatMap((id) => all.filter((v) => v.pkg.id === id));
}

export async function checkCoverage(point: GeoPoint): Promise<CoverageResult> {
  const [providers, zones] = await Promise.all([publicProviders(), repo.listActiveZones()]);
  const location = { point, regionCodes: [], postalCode: null };
  const resolved = isValidPoint(point);
  const now = new Date();

  const results = providers.map((provider): ProviderCoverage => {
    const own = zones.filter((z) => z.providerId === provider.id);
    const matched = resolved ? own.filter((z) => zoneMatches(z, location)) : [];
    const r = evaluateProviderCoverage(matched, {
      now,
      staleAfterDays: null,
      locationResolved: resolved,
      providerHasActiveZones: own.length > 0,
    });
    const deciding = matched.filter((z) => r.decidingZoneIds.includes(z.id));
    const lastVerifiedAt =
      deciding
        .map((z) => z.lastVerifiedAt)
        .filter((x): x is Date => x !== null)
        .sort((a, b) => a.getTime() - b.getTime())[0] ?? null;
    return { provider, status: r.status, lastVerifiedAt };
  });

  const rank: Record<CoverageStatus, number> = {
    AVAILABLE: 0,
    LIMITED: 1,
    REQUIRES_SURVEY: 2,
    NOT_AVAILABLE: 3,
    UNKNOWN: 4,
  };
  results.sort(
    (a, b) =>
      rank[a.status] - rank[b.status] ||
      b.provider.listingPriority - a.provider.listingPriority ||
      a.provider.displayName.localeCompare(b.provider.displayName),
  );

  return { point, overall: summarizeCoverage(results.map((r) => r.status)), providers: results };
}

export const SORTS = [
  'recommended',
  'lowest_price',
  'highest_speed',
  'best_rating',
  'lowest_installation_fee',
  'best_value',
] as const;
export type Sort = (typeof SORTS)[number];

export const SORT_LABEL: Record<Sort, string> = {
  recommended: 'Rekomendasi',
  lowest_price: 'Harga Terendah',
  highest_speed: 'Kecepatan Tertinggi',
  best_rating: 'Rating Terbaik',
  lowest_installation_fee: 'Biaya Instalasi Terendah',
  best_value: 'Nilai Terbaik (Rp/Mbps)',
};

export interface SearchParams {
  point: GeoPoint | null;
  q: string | null;
  technology: Technology | null;
  providerSlug: string | null;
  minDownload: number | null;
  minUpload: number | null;
  maxMonthly: number | null;
  maxInstallation: number | null;
  routerIncluded: boolean;
  noContract: boolean;
  promoOnly: boolean;
  sort: Sort;
  page: number;
}

export const PAGE_SIZE = 9;

const COVERAGE_RANK: Record<CoverageStatus, number> = {
  AVAILABLE: 0,
  LIMITED: 1,
  REQUIRES_SURVEY: 2,
  NOT_AVAILABLE: 3,
  UNKNOWN: 4,
};

/** Free-text match over package, provider, technology, and service-area names. */
function matchesQuery(
  v: PackageView | { provider: ProviderRecord; pkg?: PackageRecord },
  q: string,
) {
  const needle = q.toLowerCase();
  const hay = [
    v.provider.displayName,
    v.provider.serviceAreaNames.join(' '),
    v.provider.technologies.map((t) => TECHNOLOGY_LABEL[t]).join(' '),
    v.pkg?.name ?? '',
    v.pkg ? TECHNOLOGY_LABEL[v.pkg.technology] : '',
  ]
    .join(' ')
    .toLowerCase();
  return needle.split(/\s+/).every((word) => hay.includes(word));
}

export async function searchPackages(params: SearchParams) {
  let views = await publicPackages();
  let coverage: CoverageResult | null = null;

  if (params.point) {
    coverage = await checkCoverage(params.point);
    const byProvider = new Map(coverage.providers.map((c) => [c.provider.id, c]));
    views = views
      .map((v) => ({ ...v, coverage: byProvider.get(v.provider.id) ?? null }))
      .filter((v) => v.coverage && isOrderableCoverage(v.coverage.status));
  }

  views = views.filter(
    (v) =>
      (!params.q || matchesQuery(v, params.q)) &&
      (!params.technology || v.pkg.technology === params.technology) &&
      (!params.providerSlug || v.provider.slug === params.providerSlug) &&
      (params.minDownload === null || v.pkg.downloadMbps >= params.minDownload) &&
      (params.minUpload === null || v.pkg.uploadMbps >= params.minUpload) &&
      (params.maxMonthly === null || v.pkg.monthlyPrice <= params.maxMonthly) &&
      (params.maxInstallation === null || v.pkg.installationFee <= params.maxInstallation) &&
      (!params.routerIncluded || v.pkg.routerIncluded) &&
      (!params.noContract || v.pkg.contractMonths === 0) &&
      // No promotion data exists yet (Phase 2), so "promo only" honestly returns nothing.
      !params.promoOnly,
  );

  const coverageRank = (v: PackageView) => (v.coverage ? COVERAGE_RANK[v.coverage.status] : 0);
  const pricePerMbps = (v: PackageView) => v.pkg.monthlyPrice / v.pkg.downloadMbps;
  // Published formula: coverage certainty → admin listing priority → lowest monthly price.
  const recommended = (a: PackageView, b: PackageView) =>
    coverageRank(a) - coverageRank(b) ||
    b.provider.listingPriority - a.provider.listingPriority ||
    a.pkg.monthlyPrice - b.pkg.monthlyPrice;

  const comparators: Record<Sort, (a: PackageView, b: PackageView) => number> = {
    recommended,
    lowest_price: (a, b) => a.pkg.monthlyPrice - b.pkg.monthlyPrice,
    highest_speed: (a, b) => b.pkg.downloadMbps - a.pkg.downloadMbps,
    // No published reviews yet: every package is "unrated", so order falls back to recommended.
    best_rating: recommended,
    lowest_installation_fee: (a, b) =>
      a.pkg.installationFee + a.pkg.activationFee - (b.pkg.installationFee + b.pkg.activationFee),
    best_value: (a, b) => pricePerMbps(a) - pricePerMbps(b),
  };
  views.sort((a, b) => comparators[params.sort](a, b) || a.pkg.name.localeCompare(b.pkg.name));

  const total = views.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page), pageCount);
  return {
    items: views.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total,
    page,
    pageCount,
    coverage,
  };
}

export interface ProviderSummary {
  provider: ProviderRecord;
  packageCount: number;
  startingPrice: number | null;
  maxDownload: number | null;
  coverage: ProviderCoverage | null;
}

export interface ProviderSearchParams {
  point: GeoPoint | null;
  q: string | null;
  technology: Technology | null;
  maxStartingPrice: number | null;
  minSpeed: number | null;
  slaStated: boolean;
}

export async function searchProviders(params: ProviderSearchParams): Promise<ProviderSummary[]> {
  const [providers, packages] = await Promise.all([publicProviders(), publicPackages()]);
  const coverage = params.point ? await checkCoverage(params.point) : null;

  const summaries = providers.map((provider): ProviderSummary => {
    const own = packages.filter((v) => v.provider.id === provider.id).map((v) => v.pkg);
    return {
      provider,
      packageCount: own.length,
      startingPrice: own.length ? Math.min(...own.map((p) => p.monthlyPrice)) : null,
      maxDownload: own.length ? Math.max(...own.map((p) => p.downloadMbps)) : null,
      coverage: coverage?.providers.find((c) => c.provider.id === provider.id) ?? null,
    };
  });

  return summaries
    .filter(
      (s) =>
        (!params.q || matchesQuery({ provider: s.provider }, params.q)) &&
        (!params.technology || s.provider.technologies.includes(params.technology)) &&
        (params.maxStartingPrice === null ||
          (s.startingPrice !== null && s.startingPrice <= params.maxStartingPrice)) &&
        (params.minSpeed === null ||
          (s.maxDownload !== null && s.maxDownload >= params.minSpeed)) &&
        (!params.slaStated || s.provider.slaSummary !== null) &&
        (!params.point || (s.coverage !== null && isOrderableCoverage(s.coverage.status))),
    )
    .sort(
      (a, b) =>
        (a.coverage ? COVERAGE_RANK[a.coverage.status] : 0) -
          (b.coverage ? COVERAGE_RANK[b.coverage.status] : 0) ||
        b.provider.listingPriority - a.provider.listingPriority ||
        a.provider.displayName.localeCompare(b.provider.displayName),
    );
}

/** All providers including non-public ones — platform staff only (caller must authorize). */
export async function listAllProvidersForStaff() {
  const [providers, packages] = await Promise.all([repo.listProviders(), repo.listPackages()]);
  return providers.map((p) => ({
    provider: p,
    packages: packages.filter((pkg) => pkg.providerId === p.id),
  }));
}

/** All packages of one provider regardless of status — provider members/staff only. */
export async function listPackagesForProvider(providerId: string) {
  return (await repo.listPackages()).filter((p) => p.providerId === providerId);
}

export async function getProviderRecord(providerId: string) {
  return (await repo.listProviders()).find((p) => p.id === providerId) ?? null;
}
