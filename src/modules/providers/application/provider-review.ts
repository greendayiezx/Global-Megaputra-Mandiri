import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { providers, providerStatusHistory, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { authorize, type Actor } from '@/modules/auth/domain/rbac';
import { hmacIdentifier } from '@/modules/auth/infrastructure/crypto';
import {
  checkVerificationReadiness,
  providerStateMachine,
  type ProviderProfileSummary,
  type ProviderVerificationStatus,
} from '@/modules/providers/domain/provider-rules';

export interface RequestCtx {
  ip: string | null;
  userAgent: string | null;
}

export const PROFILE_FIELD_LABEL: Record<keyof ProviderProfileSummary, string> = {
  legalName: 'Nama badan usaha',
  nib: 'NIB',
  picName: 'Nama PIC',
  picPhone: 'Telepon PIC',
  picEmail: 'Email PIC',
  address: 'Alamat kantor',
};

/**
 * Documents are checked by staff outside the system until uploads land (B6).
 * TODO_BUSINESS_DECISION: the required legal document list (NIB, akta, NPWP, izin ISP, ...).
 */
const REQUIRED_DOCUMENTS = [] as const;

export const profileOf = (p: typeof providers.$inferSelect): ProviderProfileSummary => ({
  legalName: p.legalName,
  nib: p.nib,
  picName: p.picName,
  picPhone: p.picPhone,
  picEmail: p.picEmail,
  address: p.address,
});

export function readinessOf(p: typeof providers.$inferSelect, now = new Date()) {
  return checkVerificationReadiness(profileOf(p), [], REQUIRED_DOCUMENTS, now);
}

function deny(actor: Actor, action: 'provider.verify' | 'provider.suspend' | 'provider.read') {
  const d = authorize(actor, action);
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

/** Provider detail for GMM staff: row, status history (with actor names), readiness. */
export async function getProviderForReview(db: Db, actor: Actor, providerId: string) {
  deny(actor, 'provider.read');
  const [row] = await db.select().from(providers).where(eq(providers.id, providerId));
  if (!row) return null;
  const history = await db
    .select({
      id: providerStatusHistory.id,
      fromStatus: providerStatusHistory.fromStatus,
      toStatus: providerStatusHistory.toStatus,
      reason: providerStatusHistory.reason,
      createdAt: providerStatusHistory.createdAt,
      actorName: users.fullName,
    })
    .from(providerStatusHistory)
    .leftJoin(users, eq(users.id, providerStatusHistory.actorId))
    .where(eq(providerStatusHistory.providerId, providerId))
    .orderBy(desc(providerStatusHistory.createdAt));
  return {
    provider: row,
    history,
    readiness: readinessOf(row),
    allowedNext: providerStateMachine.allowedNext(row.verificationStatus, 'PLATFORM'),
  };
}

/**
 * GMM staff moves a provider through verification. Approving requires a complete profile;
 * exception paths require a reason. Status, history, and audit are written atomically.
 */
export async function changeProviderStatus(
  db: Db,
  actor: Actor,
  input: { providerId: string; to: ProviderVerificationStatus; reason?: string | null },
  ctx: RequestCtx,
  now = new Date(),
) {
  deny(actor, input.to === 'SUSPENDED' ? 'provider.suspend' : 'provider.verify');

  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(providers).where(eq(providers.id, input.providerId));
    if (!row || row.deletedAt)
      throw new AppError('PROVIDER_NOT_FOUND', 'Provider tidak ditemukan.');
    const from = row.verificationStatus;

    if (!providerStateMachine.canTransition(from, input.to, 'PLATFORM')) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Perubahan status ini tidak diizinkan.');
    }
    const reason = input.reason?.trim() || null;
    const t = (() => {
      try {
        return providerStateMachine.validate(
          from,
          input.to,
          { kind: 'PLATFORM', id: actor.userId },
          reason,
        );
      } catch {
        throw new AppError('VALIDATION_ERROR', 'Alasan wajib diisi untuk perubahan status ini.', {
          fieldErrors: { reason: 'Alasan wajib diisi.' },
        });
      }
    })();

    if (input.to === 'VERIFIED') {
      const r = readinessOf(row, now);
      if (!r.ready) {
        throw new AppError(
          'VALIDATION_ERROR',
          `Profil belum lengkap: ${r.missingProfileFields.map((f) => PROFILE_FIELD_LABEL[f]).join(', ')}.`,
        );
      }
    }

    const verified = input.to === 'VERIFIED';
    await tx
      .update(providers)
      .set({
        verificationStatus: input.to,
        // Keep the original verification date across suspend/re-review; clear it on rejection.
        verifiedAt: verified
          ? (row.verifiedAt ?? now)
          : input.to === 'REJECTED' || input.to === 'PENDING'
            ? null
            : row.verifiedAt,
        verifiedBy: verified ? actor.userId : row.verifiedBy,
        lastReviewedAt: now,
      })
      .where(eq(providers.id, row.id));

    await tx.insert(providerStatusHistory).values({
      providerId: row.id,
      fromStatus: from,
      toStatus: input.to,
      actorId: actor.userId,
      reason: t.reason,
      createdAt: now,
    });

    await audit(tx, {
      actorId: actor.userId,
      actorKind: 'PLATFORM',
      action:
        input.to === 'VERIFIED'
          ? 'provider_approved'
          : input.to === 'REJECTED'
            ? 'provider_rejected'
            : 'provider_status_changed',
      entity: 'provider',
      entityId: row.id,
      before: { verificationStatus: from },
      after: { verificationStatus: input.to, reason: t.reason },
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });

    return { from, to: input.to };
  });
}
