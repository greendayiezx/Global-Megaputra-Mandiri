import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Text ids keep the demo ids (`demo-prov-001`) stable; new rows get a random UUID. */
const textId = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

export const providerVerificationStatus = pgEnum('provider_verification_status', [
  'PENDING',
  'UNDER_REVIEW',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
]);
export const packageStatus = pgEnum('package_status', [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'SUSPENDED',
  'EXPIRED',
  'ARCHIVED',
]);
export const coverageStrategy = pgEnum('coverage_strategy', [
  'POLYGON',
  'RADIUS',
  'ADMIN_AREA',
  'MANUAL_ZONE',
  'CUSTOM',
]);
export const coverageResult = pgEnum('coverage_result', [
  'AVAILABLE',
  'LIMITED',
  'REQUIRES_SURVEY',
  'EXCLUDED',
]);
export const coverageZoneStatus = pgEnum('coverage_zone_status', ['ACTIVE', 'INACTIVE']);

/** [P] Provider business data. PIC fields are personal data of the provider's contact. */
export const providers = pgTable(
  'providers',
  {
    id: textId(),
    slug: text('slug').notNull().unique(),
    displayName: text('display_name').notNull(),
    legalName: text('legal_name').notNull(),
    nib: text('nib'),
    description: text('description').notNull().default(''),
    website: text('website'),
    address: text('address'),
    picName: text('pic_name'),
    picPhone: text('pic_phone'),
    picEmail: text('pic_email'),
    supportPhone: text('support_phone'),
    supportEmail: text('support_email'),
    supportHours: text('support_hours').notNull().default(''),
    slaSummary: text('sla_summary'),
    installationInfo: text('installation_info').notNull().default(''),
    technologies: text('technologies').array().notNull().default([]),
    serviceAreaNames: text('service_area_names').array().notNull().default([]),
    verificationStatus: providerVerificationStatus('verification_status')
      .notNull()
      .default('PENDING'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by').references(() => users.id),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
    listingPriority: integer('listing_priority').notNull().default(0),
    isDemo: boolean('is_demo').notNull().default(false),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [index('providers_status_idx').on(t.verificationStatus)],
);

/** Every verification decision, with the reason for exception paths. */
export const providerStatusHistory = pgTable(
  'provider_status_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    providerId: text('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    fromStatus: providerVerificationStatus('from_status').notNull(),
    toStatus: providerVerificationStatus('to_status').notNull(),
    actorId: uuid('actor_id').references(() => users.id),
    reason: text('reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('provider_status_history_provider_idx').on(t.providerId, t.createdAt)],
);

/** Package facts shown to customers. Prices are whole rupiah. */
export const internetPackages = pgTable(
  'internet_packages',
  {
    id: textId(),
    providerId: text('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    // Globally unique: the public URL is /packages/[slug].
    slug: text('slug').notNull().unique(),
    description: text('description').notNull().default(''),
    downloadMbps: integer('download_mbps').notNull(),
    uploadMbps: integer('upload_mbps').notNull(),
    technology: text('technology').notNull(),
    monthlyPrice: bigint('monthly_price', { mode: 'number' }).notNull(),
    installationFee: bigint('installation_fee', { mode: 'number' }).notNull(),
    activationFee: bigint('activation_fee', { mode: 'number' }).notNull(),
    taxIncluded: boolean('tax_included').notNull().default(false),
    contractMonths: integer('contract_months').notNull().default(0),
    routerIncluded: boolean('router_included').notNull().default(false),
    fupPolicy: text('fup_policy'),
    slaSummary: text('sla_summary'),
    supportHours: text('support_hours'),
    estInstallationDaysMin: integer('est_installation_days_min'),
    estInstallationDaysMax: integer('est_installation_days_max'),
    features: jsonb('features').$type<{ label: string; value: string }[]>().notNull().default([]),
    status: packageStatus('status').notNull().default('DRAFT'),
    /** Reason given the last time GMM sent the package back or suspended it. */
    reviewNote: text('review_note'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    lastPriceVerifiedAt: timestamp('last_price_verified_at', { withTimezone: true }),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    isDemo: boolean('is_demo').notNull().default(false),
    ...timestamps,
  },
  (t) => [
    index('internet_packages_provider_idx').on(t.providerId),
    index('internet_packages_status_idx').on(t.status),
  ],
);

/** [F] Every price the customer could have seen, for disputes and audits. */
export const packagePriceHistory = pgTable(
  'package_price_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    packageId: text('package_id')
      .notNull()
      .references(() => internetPackages.id, { onDelete: 'cascade' }),
    monthlyPrice: bigint('monthly_price', { mode: 'number' }).notNull(),
    installationFee: bigint('installation_fee', { mode: 'number' }).notNull(),
    activationFee: bigint('activation_fee', { mode: 'number' }).notNull(),
    taxIncluded: boolean('tax_included').notNull(),
    changedBy: uuid('changed_by').references(() => users.id),
    effectiveAt: timestamp('effective_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('package_price_history_package_idx').on(t.packageId, t.effectiveAt)],
);

export type ZoneGeometry =
  | { polygons: { lat: number; lng: number }[][][] }
  | { center: { lat: number; lng: number }; radiusM: number }
  | { regionCode: string }
  | { postalCodes: string[] };

/**
 * Coverage zones. Geometry is JSON evaluated by the coverage engine for now; it moves to
 * PostGIS `geography` columns (GiST-indexed) when zone counts grow (see docs/02-erd.md).
 */
export const coverageZones = pgTable(
  'coverage_zones',
  {
    id: textId(),
    providerId: text('provider_id')
      .notNull()
      .references(() => providers.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    strategy: coverageStrategy('strategy').notNull(),
    geometry: jsonb('geometry').$type<ZoneGeometry>().notNull(),
    result: coverageResult('result').notNull(),
    status: coverageZoneStatus('status').notNull().default('ACTIVE'),
    lastVerifiedAt: timestamp('last_verified_at', { withTimezone: true }),
    source: text('source').notNull().default('PROVIDER'),
    createdBy: uuid('created_by').references(() => users.id),
    ...timestamps,
  },
  (t) => [index('coverage_zones_provider_idx').on(t.providerId, t.status)],
);
