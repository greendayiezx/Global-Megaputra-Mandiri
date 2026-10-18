import { desc, eq } from 'drizzle-orm';
import type { Db } from '@/db/client';
import { internetPackages, packagePriceHistory, providers, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { authorizePlatform, type Actor } from '@/modules/auth/domain/rbac';
import { hmacIdentifier } from '@/modules/auth/infrastructure/crypto';
import {
  canProviderPublishPackage,
  packageCompletenessIssues,
  packageStateMachine,
  type PackageStatus,
} from '@/modules/packages/domain/package-rules';
import type { RequestCtx } from '@/modules/providers/application/provider-review';
import { toPackageRecord } from '../infrastructure/db-catalog';

/** Moves only GMM can make (publishing is never self-service). */
const PUBLISH_MOVES = new Set<PackageStatus>(['PUBLISHED', 'SUSPENDED', 'EXPIRED']);

function deny(actor: Actor, action: 'package.publish' | 'package.manage' | 'provider.read') {
  const d = authorizePlatform(actor, action);
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

export async function priceHistoryOf(db: Db, packageId: string) {
  return db
    .select({
      id: packagePriceHistory.id,
      monthlyPrice: packagePriceHistory.monthlyPrice,
      installationFee: packagePriceHistory.installationFee,
      activationFee: packagePriceHistory.activationFee,
      taxIncluded: packagePriceHistory.taxIncluded,
      effectiveAt: packagePriceHistory.effectiveAt,
      changedByName: users.fullName,
    })
    .from(packagePriceHistory)
    .leftJoin(users, eq(users.id, packagePriceHistory.changedBy))
    .where(eq(packagePriceHistory.packageId, packageId))
    .orderBy(desc(packagePriceHistory.effectiveAt));
}

/** Package detail for GMM staff: record, provider, price history, completeness, next moves. */
export async function getPackageForReview(db: Db, actor: Actor, packageId: string) {
  deny(actor, 'provider.read');
  const [row] = await db
    .select({ pkg: internetPackages, provider: providers })
    .from(internetPackages)
    .innerJoin(providers, eq(providers.id, internetPackages.providerId))
    .where(eq(internetPackages.id, packageId));
  if (!row) return null;
  const pkg = toPackageRecord(row.pkg);
  return {
    pkg,
    reviewNote: row.pkg.reviewNote,
    provider: row.provider,
    prices: await priceHistoryOf(db, packageId),
    issues: packageCompletenessIssues(pkg),
    allowedNext: packageStateMachine.allowedNext(pkg.status, 'PLATFORM'),
  };
}

/**
 * GMM staff reviews a package: publish (only for a verified provider and a complete
 * package), send back to draft, suspend, or archive. Reasons are stored on the package so
 * the provider sees why.
 */
export async function changePackageStatus(
  db: Db,
  actor: Actor,
  input: { packageId: string; to: PackageStatus; reason?: string | null },
  ctx: RequestCtx,
  now = new Date(),
) {
  deny(actor, PUBLISH_MOVES.has(input.to) ? 'package.publish' : 'package.manage');

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ pkg: internetPackages, provider: providers })
      .from(internetPackages)
      .innerJoin(providers, eq(providers.id, internetPackages.providerId))
      .where(eq(internetPackages.id, input.packageId));
    if (!row) throw new AppError('PACKAGE_NOT_FOUND', 'Paket tidak ditemukan.');
    const from = row.pkg.status;

    if (!packageStateMachine.canTransition(from, input.to, 'PLATFORM')) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Perubahan status ini tidak diizinkan.');
    }
    const reason = input.reason?.trim() || null;
    try {
      packageStateMachine.validate(from, input.to, { kind: 'PLATFORM', id: actor.userId }, reason);
    } catch {
      throw new AppError('VALIDATION_ERROR', 'Alasan wajib diisi untuk perubahan status ini.', {
        fieldErrors: { reason: 'Alasan wajib diisi.' },
      });
    }

    if (input.to === 'PUBLISHED') {
      const d = canProviderPublishPackage(row.provider, toPackageRecord(row.pkg));
      if (!d.ok) {
        throw new AppError(d.code, `Belum bisa diterbitkan: ${d.reasons.join('; ')}.`);
      }
    }

    const publishing = input.to === 'PUBLISHED';
    await tx
      .update(internetPackages)
      .set({
        status: input.to,
        reviewNote: publishing ? null : (reason ?? row.pkg.reviewNote),
        publishedAt: publishing ? now : row.pkg.publishedAt,
        // Publishing is GMM confirming the price shown matches what the provider charges.
        lastPriceVerifiedAt: publishing ? now : row.pkg.lastPriceVerifiedAt,
      })
      .where(eq(internetPackages.id, row.pkg.id));

    await audit(tx, {
      actorId: actor.userId,
      actorKind: 'PLATFORM',
      action: publishing ? 'package_published' : 'package_status_changed',
      entity: 'package',
      entityId: row.pkg.id,
      before: { status: from },
      after: { status: input.to, reason },
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });
    return { from, to: input.to };
  });
}
