import type { CoverageZone } from '@/modules/coverage/domain/coverage';
import type { PackageForRules } from '@/modules/packages/domain/package-rules';
import type { ProviderVisibility } from '@/modules/providers/domain/provider-rules';

export const TECHNOLOGIES = ['FIBER', 'FIXED_WIRELESS', 'CABLE', 'SATELLITE'] as const;
export type Technology = (typeof TECHNOLOGIES)[number];

export const TECHNOLOGY_LABEL: Record<Technology, string> = {
  FIBER: 'Fiber optik',
  FIXED_WIRELESS: 'Fixed wireless',
  CABLE: 'Kabel coaxial',
  SATELLITE: 'Satelit',
};

export interface ProviderRecord extends ProviderVisibility {
  id: string;
  slug: string;
  displayName: string;
  legalName: string;
  description: string;
  technologies: Technology[];
  supportHours: string;
  slaSummary: string | null;
  supportPhone: string | null;
  supportEmail: string | null;
  website: string | null;
  serviceAreaNames: string[];
  listingPriority: number;
  installationInfo: string;
}

export interface PackageRecord extends PackageForRules {
  id: string;
  providerId: string;
  description: string;
  technology: Technology;
  taxIncluded: boolean;
  routerIncluded: boolean;
  fupPolicy: string | null;
  slaSummary: string | null;
  features: { label: string; value: string }[];
  lastPriceVerifiedAt: Date | null;
}

/**
 * Read port for the public catalog. The demo adapter serves in-memory data until the
 * Postgres adapter lands (STEP 3); callers never know which one is active.
 */
export interface CatalogRepository {
  listProviders(): Promise<ProviderRecord[]>;
  listPackages(): Promise<PackageRecord[]>;
  listActiveZones(): Promise<CoverageZone[]>;
}
