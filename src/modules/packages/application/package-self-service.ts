import { and, eq, like } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { internetPackages, packagePriceHistory, providers } from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { authorize, type Actor } from '@/modules/auth/domain/rbac';
import { hmacIdentifier } from '@/modules/auth/infrastructure/crypto';
import {
  canProviderPublishPackage,
  packageStateMachine,
  type PackageStatus,
} from '@/modules/packages/domain/package-rules';
import type { RequestCtx } from '@/modules/providers/application/provider-review';
import { toPackageRecord } from '../infrastructure/db-catalog';
import { TECHNOLOGIES } from './catalog-repository';

const int = (label: string, min = 0, max = 1_000_000_000) =>
  z.coerce
    .number({ error: `${label} harus berupa angka.` })
    .int({ error: `${label} harus angka bulat.` })
    .min(min, { error: `${label} minimal ${min}.` })
    .max(max, { error: `${label} terlalu besar.` });

const nullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null);

export const packageSchema = z
  .object({
    name: z.string().trim().min(2, { error: 'Nama paket wajib diisi.' }).max(80),
    description: z.string().trim().max(600),
    downloadMbps: int('Kecepatan download', 1, 100_000),
    uploadMbps: int('Kecepatan upload', 1, 100_000),
    technology: z.enum(TECHNOLOGIES, { error: 'Pilih teknologi.' }),
    monthlyPrice: int('Harga bulanan', 1, 100_000_000),
    installationFee: int('Biaya instalasi', 0, 100_000_000),
    activationFee: int('Biaya aktivasi', 0, 100_000_000),
    taxIncluded: z.boolean(),
    contractMonths: int('Masa kontrak', 0, 60),
    routerIncluded: z.boolean(),
    fupPolicy: nullableText(300),
    slaSummary: nullableText(300),
    supportHours: z.string().trim().min(1, { error: 'Jam dukungan wajib diisi.' }).max(120),
    estInstallationDaysMin: int('Perkiraan instalasi minimum', 0, 90),
    estInstallationDaysMax: int('Perkiraan instalasi maksimum', 0, 90),
    features: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(60),
          value: z.string().trim().min(1).max(200),
        }),
      )
      .max(12),
  })
  .refine((d) => d.estInstallationDaysMax >= d.estInstallationDaysMin, {
    path: ['estInstallationDaysMax'],
    error: 'Maksimum tidak boleh lebih kecil dari minimum.',
  });
export type PackageInput = z.input<typeof packageSchema>;

/** Facts that change what the customer buys; editing them on a live package needs GMM again. */
const MATERIAL = [
  'downloadMbps',
  'uploadMbps',
  'technology',
  'monthlyPrice',
  'installationFee',
  'activationFee',
  'taxIncluded',
  'contractMonths',
  'routerIncluded',
  'fupPolicy',
] as const;
const PRICE = ['monthlyPrice', 'installationFee', 'activationFee', 'taxIncluded'] as const;
const EDITABLE = new Set<PackageStatus>(['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'EXPIRED']);

const kebab = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

function guard(actor: Actor, action: 'package.manage' | 'package.submit', providerId: string) {
  const d = authorize(actor, action, { providerId });
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

function parse(raw: PackageInput) {
  const parsed = packageSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    throw new AppError('VALIDATION_ERROR', 'Periksa kembali isian yang ditandai.', {
      fieldErrors,
    });
  }
  return parsed.data;
}

const ownProviderId = (actor: Actor) => {
  if (!actor.providerId) throw new AppError('FORBIDDEN', 'Akun ini tidak terhubung ke provider.');
  return actor.providerId;
};

async function loadOwn(db: Pick<Db, 'select'>, actor: Actor, packageId: string) {
  const providerId = ownProviderId(actor);
  const [row] = await db
    .select({ pkg: internetPackages, provider: providers })
    .from(internetPackages)
    .innerJoin(providers, eq(providers.id, internetPackages.providerId))
    .where(and(eq(internetPackages.id, packageId), eq(internetPackages.providerId, providerId)));
  // Another provider's package looks exactly like a missing one.
  if (!row) throw new AppError('PACKAGE_NOT_FOUND', 'Paket tidak ditemukan.');
  return row;
}

export async function getOwnPackage(db: Db, actor: Actor, packageId: string) {
  guard(actor, 'package.manage', ownProviderId(actor));
  const row = await loadOwn(db, actor, packageId).catch(() => null);
  if (!row) return null;
  const pkg = toPackageRecord(row.pkg);
  return {
    pkg,
    reviewNote: row.pkg.reviewNote,
    provider: row.provider,
    editable: EDITABLE.has(pkg.status),
    canSubmit:
      packageStateMachine.canTransition(pkg.status, 'PENDING_REVIEW', 'PROVIDER') &&
      pkg.status !== 'PUBLISHED',
    canArchive: packageStateMachine.canTransition(pkg.status, 'ARCHIVED', 'PROVIDER'),
  };
}

const audited = (actor: Actor, ctx: RequestCtx) => ({
  actorId: actor.userId,
  actorKind: 'PROVIDER' as const,
  ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
  userAgent: ctx.userAgent,
});

/** Creates a draft package owned by the actor's provider. */
export async function createOwnPackage(db: Db, actor: Actor, raw: PackageInput, ctx: RequestCtx) {
  const providerId = ownProviderId(actor);
  guard(actor, 'package.manage', providerId);
  const input = parse(raw);
  return db.transaction(async (tx) => {
    const [provider] = await tx.select().from(providers).where(eq(providers.id, providerId));
    if (!provider) throw new AppError('PROVIDER_NOT_FOUND', 'Provider tidak ditemukan.');
    const base = `${provider.slug}-${kebab(input.name)}`.replace(/-+$/, '');
    const taken = new Set(
      (
        await tx
          .select({ slug: internetPackages.slug })
          .from(internetPackages)
          .where(like(internetPackages.slug, `${base}%`))
      ).map((r) => r.slug),
    );
    let slug = base;
    for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;

    const [created] = await tx
      .insert(internetPackages)
      .values({ ...input, providerId, slug, status: 'DRAFT', isDemo: provider.isDemo })
      .returning({ id: internetPackages.id });
    await tx.insert(packagePriceHistory).values({
      packageId: created!.id,
      monthlyPrice: input.monthlyPrice,
      installationFee: input.installationFee,
      activationFee: input.activationFee,
      taxIncluded: input.taxIncluded,
      changedBy: actor.userId,
    });
    await audit(tx, {
      ...audited(actor, ctx),
      action: 'package_created',
      entity: 'package',
      entityId: created!.id,
      after: { name: input.name, slug, monthlyPrice: input.monthlyPrice, status: 'DRAFT' },
    });
    return { id: created!.id };
  });
}

/**
 * Edits a package. Price changes are written to the price history; any material change to
 * a live package takes it off the marketplace until GMM reviews it again.
 */
export async function updateOwnPackage(
  db: Db,
  actor: Actor,
  packageId: string,
  raw: PackageInput,
  ctx: RequestCtx,
) {
  guard(actor, 'package.manage', ownProviderId(actor));
  const input = parse(raw);
  return db.transaction(async (tx) => {
    const { pkg: row } = await loadOwn(tx, actor, packageId);
    if (!EDITABLE.has(row.status)) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Paket dengan status ini tidak bisa diubah.');
    }
    const same = (k: keyof typeof input) =>
      JSON.stringify(input[k] ?? null) === JSON.stringify(row[k] ?? null);
    const changed = (Object.keys(input) as (keyof typeof input)[]).filter((k) => !same(k));
    if (changed.length === 0) return { changed, backToReview: false };

    const material = MATERIAL.some((k) => !same(k));
    const priceChanged = PRICE.some((k) => !same(k));
    const backToReview = row.status === 'PUBLISHED' && material;

    await tx
      .update(internetPackages)
      .set({ ...input, ...(backToReview ? { status: 'PENDING_REVIEW' as const } : {}) })
      .where(eq(internetPackages.id, row.id));

    if (priceChanged) {
      await tx.insert(packagePriceHistory).values({
        packageId: row.id,
        monthlyPrice: input.monthlyPrice,
        installationFee: input.installationFee,
        activationFee: input.activationFee,
        taxIncluded: input.taxIncluded,
        changedBy: actor.userId,
      });
    }
    const pick = (src: Record<string, unknown>) =>
      Object.fromEntries(changed.map((k) => [k, src[k]]));
    await audit(tx, {
      ...audited(actor, ctx),
      action: priceChanged ? 'package_price_changed' : 'package_updated',
      entity: 'package',
      entityId: row.id,
      before: { ...pick(row), status: row.status },
      after: { ...pick(input), status: backToReview ? 'PENDING_REVIEW' : row.status },
    });
    return { changed, backToReview };
  });
}

/** Draft (or expired) → waiting for GMM review. Requires a verified provider and all facts. */
export async function submitOwnPackage(db: Db, actor: Actor, packageId: string, ctx: RequestCtx) {
  guard(actor, 'package.submit', ownProviderId(actor));
  return db.transaction(async (tx) => {
    const { pkg: row, provider } = await loadOwn(tx, actor, packageId);
    if (
      row.status === 'PUBLISHED' ||
      !packageStateMachine.canTransition(row.status, 'PENDING_REVIEW', 'PROVIDER')
    ) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Paket ini tidak bisa diajukan saat ini.');
    }
    const d = canProviderPublishPackage(provider, toPackageRecord(row));
    if (!d.ok) throw new AppError(d.code, `Belum bisa diajukan: ${d.reasons.join('; ')}.`);
    await tx
      .update(internetPackages)
      .set({ status: 'PENDING_REVIEW' })
      .where(eq(internetPackages.id, row.id));
    await audit(tx, {
      ...audited(actor, ctx),
      action: 'package_submitted',
      entity: 'package',
      entityId: row.id,
      before: { status: row.status },
      after: { status: 'PENDING_REVIEW' },
    });
  });
}

export async function archiveOwnPackage(db: Db, actor: Actor, packageId: string, ctx: RequestCtx) {
  guard(actor, 'package.manage', ownProviderId(actor));
  return db.transaction(async (tx) => {
    const { pkg: row } = await loadOwn(tx, actor, packageId);
    if (!packageStateMachine.canTransition(row.status, 'ARCHIVED', 'PROVIDER')) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Paket ini tidak bisa diarsipkan.');
    }
    await tx
      .update(internetPackages)
      .set({ status: 'ARCHIVED' })
      .where(eq(internetPackages.id, row.id));
    await audit(tx, {
      ...audited(actor, ctx),
      action: 'package_status_changed',
      entity: 'package',
      entityId: row.id,
      before: { status: row.status },
      after: { status: 'ARCHIVED' },
    });
  });
}
