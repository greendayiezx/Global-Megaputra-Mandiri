import { boolean, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';
import { providers } from './catalog';

export const ticketCategory = pgEnum('ticket_category', [
  'INSTALLATION',
  'SERVICE_ISSUE',
  'BILLING',
  'PROVIDER_COMPLAINT',
  'ACCOUNT',
  'OTHER',
]);
export const ticketStatus = pgEnum('ticket_status', [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'RESOLVED',
  'CLOSED',
]);

/** [C] Customer support ticket. Messages live in ticket_messages. */
export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Shown to the customer, e.g. TKT-4H8K2M. */
    refCode: text('ref_code').notNull().unique(),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subject: text('subject').notNull(),
    category: ticketCategory('category').notNull(),
    status: ticketStatus('status').notNull().default('OPEN'),
    /** Optional: the provider the ticket is about (escalation target). */
    providerId: text('provider_id').references(() => providers.id, { onDelete: 'set null' }),
    assigneeId: uuid('assignee_id').references(() => users.id),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('tickets_customer_idx').on(t.customerId, t.lastMessageAt),
    index('tickets_status_idx').on(t.status, t.lastMessageAt),
  ],
);

/** Conversation; `internal` notes are visible to GMM staff only. */
export const ticketMessages = pgTable(
  'ticket_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticketId: uuid('ticket_id')
      .notNull()
      .references(() => tickets.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id').references(() => users.id),
    authorKind: text('author_kind').notNull(),
    body: text('body').notNull(),
    internal: boolean('internal').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ticket_messages_ticket_idx').on(t.ticketId, t.createdAt)],
);
