import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { providers, providerStatusHistory } from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { authorize, type Actor } from '@/modules/auth/domain/rbac';
import { hmacIdentifier } from '@/modules/auth/infrastructure/crypto';
import { TECHNOLOGIES } from '@/modules/packages/application/catalog-repository';
import { providerStateMachine } from '@/modules/providers/domain/provider-rules';
import { readinessOf, type RequestCtx } from './provider-review';

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, { error: 'Nama tampilan wajib diisi.' }).max(80),
  legalName: z.string().trim().min(2, { error: 'Nama badan usaha wajib diisi.' }).max(160),
  nib: z
    .string()
    .trim()
    .regex(/^(\d{13})?$/, { error: 'NIB terdiri dari 13 digit angka.' })
    .transform((v) => v || null),
  address: optional(300),
  picName: optional(120),
  picPhone: z
    .string()
    .trim()
    .regex(/^(\+?\d[\d\s-]{7,18})?$/, { error: 'Nomor telepon tidak valid.' })
    .transform((v) => v || null),
  picEmail: z
    .union([z.literal(''), z.email({ error: 'Email PIC tidak valid.' }).max(254)])
    .transform((v) => v || null),
  description: z.string().trim().max(1000),
  website: z
    .union([z.literal(''), z.url({ error: 'Alamat situs tidak valid (awali https://).' }).max(200)])
    .transform((v) => v || null),
  supportPhone: optional(30),
  supportEmail: z
    .union([z.literal(''), z.email({ error: 'Email dukungan tidak valid.' }).max(254)])
    .transform((v) => v || null),
  supportHours: z.string().trim().max(120),
  slaSummary: optional(300),
  installationInfo: z.string().trim().max(1000),
  technologies: z.array(z.enum(TECHNOLOGIES)).max(TECHNOLOGIES.length),
  serviceAreaNames: z.array(z.string().trim().min(1).max(80)).max(30),
});
export type ProfileInput = z.input<typeof profileSchema>;

/** Identity fields GMM verified; a verified provider changes them through GMM, not here. */
const LOCKED_WHEN_VERIFIED = ['legalName', 'nib'] as const;
/** PIC data is personal data: the audit log records that it changed, not the values. */
const PERSONAL = new Set(['picName', 'picPhone', 'picEmail']);

/** A verified provider may still fill an empty identity field, but not change a set one. */
const lockedOf = (row: typeof providers.$inferSelect): string[] =>
  row.verificationStatus === 'VERIFIED' ? LOCKED_WHEN_VERIFIED.filter((k) => row[k]) : [];

function guard(actor: Actor, action: 'provider.update' | 'provider.read', providerId: string) {
  const d = authorize(actor, action, { providerId });
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

/** The provider's own record with readiness and the latest GMM decision note. */
export async function getOwnProvider(db: Db, actor: Actor) {
  if (!actor.providerId) throw new AppError('FORBIDDEN', 'Akun ini tidak terhubung ke provider.');
  guard(actor, 'provider.read', actor.providerId);
  const [row] = await db.select().from(providers).where(eq(providers.id, actor.providerId));
  if (!row) return null;
  const [last] = await db
    .select()
    .from(providerStatusHistory)
    .where(eq(providerStatusHistory.providerId, row.id))
    .orderBy(desc(providerStatusHistory.createdAt))
    .limit(1);
  return {
    provider: row,
    readiness: readinessOf(row),
    lastDecision: last ?? null,
    lockedFields: lockedOf(row),
    canResubmit: providerStateMachine.canTransition(row.verificationStatus, 'PENDING', 'PROVIDER'),
  };
}

export async function updateOwnProfile(db: Db, actor: Actor, raw: ProfileInput, ctx: RequestCtx) {
  if (!actor.providerId) throw new AppError('FORBIDDEN', 'Akun ini tidak terhubung ke provider.');
  guard(actor, 'provider.update', actor.providerId);
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    throw new AppError('VALIDATION_ERROR', 'Periksa kembali isian yang ditandai.', {
      fieldErrors,
    });
  }
  const input = parsed.data;

  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(providers).where(eq(providers.id, actor.providerId!));
    if (!row) throw new AppError('PROVIDER_NOT_FOUND', 'Provider tidak ditemukan.');
    for (const k of lockedOf(row) as (typeof LOCKED_WHEN_VERIFIED)[number][]) {
      if ((input[k] ?? null) !== (row[k] ?? null)) {
        throw new AppError(
          'VALIDATION_ERROR',
          'Nama badan usaha dan NIB provider terverifikasi hanya bisa diubah melalui tim GMM.',
        );
      }
    }

    const changed = (Object.keys(input) as (keyof typeof input)[]).filter(
      (k) => JSON.stringify(input[k] ?? null) !== JSON.stringify(row[k] ?? null),
    );
    if (changed.length === 0) return { changed };

    await tx.update(providers).set(input).where(eq(providers.id, row.id));
    const pick = (src: Record<string, unknown>) =>
      Object.fromEntries(changed.map((k) => [k, PERSONAL.has(k) ? '[diubah]' : src[k]]));
    await audit(tx, {
      actorId: actor.userId,
      actorKind: 'PROVIDER',
      action: 'provider_profile_updated',
      entity: 'provider',
      entityId: row.id,
      before: pick(row),
      after: pick(input),
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });
    return { changed };
  });
}

/** After a rejection the provider fixes the data and sends it back to GMM. */
export async function resubmitOwnProvider(db: Db, actor: Actor, ctx: RequestCtx) {
  if (!actor.providerId) throw new AppError('FORBIDDEN', 'Akun ini tidak terhubung ke provider.');
  guard(actor, 'provider.update', actor.providerId);
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(providers).where(eq(providers.id, actor.providerId!));
    if (!row) throw new AppError('PROVIDER_NOT_FOUND', 'Provider tidak ditemukan.');
    if (!providerStateMachine.canTransition(row.verificationStatus, 'PENDING', 'PROVIDER')) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Pengajuan ulang tidak tersedia saat ini.');
    }
    await tx
      .update(providers)
      .set({ verificationStatus: 'PENDING' })
      .where(eq(providers.id, row.id));
    await tx.insert(providerStatusHistory).values({
      providerId: row.id,
      fromStatus: row.verificationStatus,
      toStatus: 'PENDING',
      actorId: actor.userId,
      reason: 'Diajukan ulang oleh provider',
    });
    await audit(tx, {
      actorId: actor.userId,
      actorKind: 'PROVIDER',
      action: 'provider_status_changed',
      entity: 'provider',
      entityId: row.id,
      before: { verificationStatus: row.verificationStatus },
      after: { verificationStatus: 'PENDING' },
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });
  });
}
