import { and, asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { coverageZones } from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import { authorize, type Actor } from '@/modules/auth/domain/rbac';
import { hmacIdentifier } from '@/modules/auth/infrastructure/crypto';
import { REGION_CODE } from '@/lib/wilayah/codes';
import type { RequestCtx } from '@/modules/providers/application/provider-review';

/**
 * Self-service zones are circles (centre + radius) for now: the coverage check matches
 * points, and polygons need a map editor (planned). Indonesia's bounding box guards typos.
 */
export const radiusZoneSchema = z.object({
  name: z.string().trim().min(2, { error: 'Nama area wajib diisi.' }).max(80),
  lat: z.coerce
    .number({ error: 'Latitude harus angka.' })
    .min(-11.5, { error: 'Titik di luar Indonesia.' })
    .max(6.5, { error: 'Titik di luar Indonesia.' }),
  lng: z.coerce
    .number({ error: 'Longitude harus angka.' })
    .min(94.5, { error: 'Titik di luar Indonesia.' })
    .max(141.5, { error: 'Titik di luar Indonesia.' }),
  radiusM: z.coerce
    .number({ error: 'Radius harus angka.' })
    .int()
    .min(100, { error: 'Radius minimal 100 meter.' })
    .max(30_000, { error: 'Radius maksimal 30 km; pecah menjadi beberapa area.' }),
  result: z.enum(['AVAILABLE', 'LIMITED', 'REQUIRES_SURVEY', 'EXCLUDED'], {
    error: 'Pilih status layanan.',
  }),
});
export type RadiusZoneInput = z.input<typeof radiusZoneSchema>;

function own(actor: Actor) {
  if (!actor.providerId) throw new AppError('FORBIDDEN', 'Akun ini tidak terhubung ke provider.');
  const d = authorize(actor, 'coverage.manage', { providerId: actor.providerId });
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
  return actor.providerId;
}

const meta = (actor: Actor, ctx: RequestCtx) => ({
  actorId: actor.userId,
  actorKind: 'PROVIDER' as const,
  ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
  userAgent: ctx.userAgent,
});

export async function listOwnZones(db: Db, actor: Actor) {
  const providerId = own(actor);
  return db
    .select()
    .from(coverageZones)
    .where(eq(coverageZones.providerId, providerId))
    .orderBy(asc(coverageZones.status), asc(coverageZones.name));
}

export async function addOwnRadiusZone(
  db: Db,
  actor: Actor,
  raw: RadiusZoneInput,
  ctx: RequestCtx,
  now = new Date(),
) {
  const providerId = own(actor);
  const parsed = radiusZoneSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    throw new AppError('VALIDATION_ERROR', 'Periksa kembali isian yang ditandai.', {
      fieldErrors,
    });
  }
  const z0 = parsed.data;
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(coverageZones)
      .values({
        providerId,
        name: z0.name,
        strategy: 'RADIUS',
        geometry: { center: { lat: z0.lat, lng: z0.lng }, radiusM: z0.radiusM },
        result: z0.result,
        lastVerifiedAt: now,
        source: 'PROVIDER',
        createdBy: actor.userId,
      })
      .returning({ id: coverageZones.id });
    await audit(tx, {
      ...meta(actor, ctx),
      action: 'coverage_changed',
      entity: 'coverage_zone',
      entityId: row!.id,
      after: { name: z0.name, strategy: 'RADIUS', radiusM: z0.radiusM, result: z0.result },
    });
    return { id: row!.id };
  });
}

export const adminAreaZoneSchema = z.object({
  regionCode: z
    .string()
    .regex(REGION_CODE, { error: 'Pilih wilayah.' })
    .refine((c) => c.split('.').length >= 3, { error: 'Pilih sampai kecamatan atau kelurahan.' }),
  name: z.string().trim().min(2).max(160),
  result: z.enum(['AVAILABLE', 'LIMITED', 'REQUIRES_SURVEY', 'EXCLUDED'], {
    error: 'Pilih status layanan.',
  }),
});
export type AdminAreaZoneInput = z.input<typeof adminAreaZoneSchema>;

/**
 * A whole kecamatan or kelurahan. Broad by nature: a drawn or radius zone of the same
 * provider wins over it at the same location (coverage engine specificity).
 */
export async function addOwnAdminAreaZone(
  db: Db,
  actor: Actor,
  raw: AdminAreaZoneInput,
  ctx: RequestCtx,
  now = new Date(),
) {
  const providerId = own(actor);
  const parsed = adminAreaZoneSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    throw new AppError('VALIDATION_ERROR', 'Periksa kembali isian yang ditandai.', {
      fieldErrors,
    });
  }
  const z0 = parsed.data;
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(coverageZones)
      .values({
        providerId,
        name: z0.name,
        strategy: 'ADMIN_AREA',
        geometry: { regionCode: z0.regionCode },
        result: z0.result,
        lastVerifiedAt: now,
        source: 'PROVIDER',
        createdBy: actor.userId,
      })
      .returning({ id: coverageZones.id });
    await audit(tx, {
      ...meta(actor, ctx),
      action: 'coverage_changed',
      entity: 'coverage_zone',
      entityId: row!.id,
      after: {
        name: z0.name,
        strategy: 'ADMIN_AREA',
        regionCode: z0.regionCode,
        result: z0.result,
      },
    });
    return { id: row!.id };
  });
}

/** Turn a zone off (it stops counting in coverage checks) or back on. */
export async function setOwnZoneStatus(
  db: Db,
  actor: Actor,
  zoneId: string,
  status: 'ACTIVE' | 'INACTIVE',
  ctx: RequestCtx,
) {
  const providerId = own(actor);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(coverageZones)
      .where(and(eq(coverageZones.id, zoneId), eq(coverageZones.providerId, providerId)));
    if (!row) throw new AppError('NOT_FOUND', 'Area tidak ditemukan.');
    if (row.status === status) return;
    await tx.update(coverageZones).set({ status }).where(eq(coverageZones.id, row.id));
    await audit(tx, {
      ...meta(actor, ctx),
      action: 'coverage_changed',
      entity: 'coverage_zone',
      entityId: row.id,
      before: { status: row.status },
      after: { status },
    });
  });
}

/** Active zone count for dashboards; the caller has already authorised provider access. */
export async function countActiveZones(db: Db, providerId: string): Promise<number> {
  const rows = await db
    .select({ id: coverageZones.id })
    .from(coverageZones)
    .where(and(eq(coverageZones.providerId, providerId), eq(coverageZones.status, 'ACTIVE')));
  return rows.length;
}
