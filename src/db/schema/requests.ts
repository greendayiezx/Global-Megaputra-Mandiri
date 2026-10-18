import {
  doublePrecision,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './auth';
import { internetPackages, providers } from './catalog';

export const serviceRequestKind = pgEnum('service_request_kind', ['SURVEY', 'INSTALLATION']);
export const serviceRequestStatus = pgEnum('service_request_status', [
  'NEW',
  'CONTACTED',
  'SURVEY_SCHEDULED',
  'FORWARDED',
  'DONE',
  'CANCELLED',
]);

/**
 * [C] A visitor asking GMM to survey a location or to be contacted about a package.
 * Personal data kept only with recorded consent (consent_at + consent_version);
 * retention follows TODO_BUSINESS_DECISION D9.
 */
export const serviceRequests = pgTable(
  'service_requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Given to the visitor to track progress, e.g. GMM-7K3Q9P. */
    refCode: text('ref_code').notNull().unique(),
    kind: serviceRequestKind('kind').notNull(),
    status: serviceRequestStatus('status').notNull().default('NEW'),
    name: text('name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    address: text('address').notNull(),
    lat: doublePrecision('lat'),
    lng: doublePrecision('lng'),
    providerId: text('provider_id').references(() => providers.id, { onDelete: 'set null' }),
    packageId: text('package_id').references(() => internetPackages.id, { onDelete: 'set null' }),
    note: text('note'),
    consentAt: timestamp('consent_at', { withTimezone: true }).notNull(),
    consentVersion: text('consent_version').notNull(),
    /** Internal only, never shown to the visitor. */
    adminNote: text('admin_note'),
    handledBy: uuid('handled_by').references(() => users.id),
    ipHash: text('ip_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index('service_requests_status_idx').on(t.status, t.createdAt)],
);

/** Progress the visitor can see (public_note), newest last. */
export const serviceRequestEvents = pgTable(
  'service_request_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    requestId: uuid('request_id')
      .notNull()
      .references(() => serviceRequests.id, { onDelete: 'cascade' }),
    status: serviceRequestStatus('status').notNull(),
    publicNote: text('public_note'),
    actorId: uuid('actor_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('service_request_events_request_idx').on(t.requestId, t.createdAt)],
);
