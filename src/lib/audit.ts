import type { Db } from '@/db/client';
import { auditLogs } from '@/db/schema';

/** Audit actions from brief §27 plus authentication events. */
export type AuditAction =
  | 'user_registered'
  | 'login_succeeded'
  | 'login_failed'
  | 'login_locked'
  | 'logout'
  | 'user_role_changed'
  | 'provider_registered'
  | 'provider_approved'
  | 'provider_rejected'
  | 'provider_status_changed'
  | 'provider_profile_updated'
  | 'package_created'
  | 'package_updated'
  | 'package_submitted'
  | 'package_published'
  | 'package_status_changed'
  | 'package_price_changed'
  | 'coverage_changed'
  | 'service_request_created'
  | 'service_request_updated'
  | 'ticket_created'
  | 'ticket_status_changed'
  | 'order_created'
  | 'order_status_changed'
  | 'payment_updated'
  | 'refund_created'
  | 'commission_created'
  | 'payout_approved'
  | 'data_exported'
  | 'settings_changed';

export interface AuditEntry {
  actorId: string | null;
  actorKind: 'CUSTOMER' | 'PROVIDER' | 'PLATFORM' | 'SYSTEM' | 'ANONYMOUS';
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ipHash?: string | null;
  userAgent?: string | null;
}

const REDACT = /pass(word)?|token|secret|hash|cvv|card|account_number/i;

function redact(value: Record<string, unknown> | null | undefined) {
  if (!value) return null;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, REDACT.test(k) ? '[REDACTED]' : v]),
  );
}

/** Write inside the same transaction as the change it records (pass the tx as `db`). */
export async function audit(db: Pick<Db, 'insert'>, entry: AuditEntry): Promise<void> {
  await db.insert(auditLogs).values({
    actorId: entry.actorId,
    actorKind: entry.actorKind,
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId ?? null,
    before: redact(entry.before),
    after: redact(entry.after),
    ipHash: entry.ipHash ?? null,
    userAgent: entry.userAgent?.slice(0, 300) ?? null,
  });
}
