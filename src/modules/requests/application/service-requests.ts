import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import {
  internetPackages,
  providers,
  serviceRequestEvents,
  serviceRequests,
  users,
} from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import type { RateLimiter } from '@/lib/rate-limit';
import { normalizeIndonesianPhone } from '@/modules/auth/domain/credentials';
import { authorizePlatform, type Actor } from '@/modules/auth/domain/rbac';
import { hmacIdentifier } from '@/modules/auth/infrastructure/crypto';
import type { RequestCtx } from '@/modules/providers/application/provider-review';
import {
  newRefCode,
  normalizeRefCode,
  REQUEST_CONSENT_VERSION,
  requestStateMachine,
  type RequestStatus,
} from '../domain/request-rules';

const TOO_MANY = 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.';

export const requestSchema = z.object({
  kind: z.enum(['SURVEY', 'INSTALLATION']),
  name: z.string().trim().min(2, { error: 'Isi nama Anda.' }).max(80),
  phone: z.string().trim().max(20),
  email: z
    .union([z.literal(''), z.email({ error: 'Email tidak valid.' }).max(254)])
    .transform((v) => v || null),
  address: z.string().trim().min(10, { error: 'Tulis alamat pemasangan lengkap.' }).max(300),
  lat: z.coerce.number().min(-11.5).max(6.5).nullable(),
  lng: z.coerce.number().min(94.5).max(141.5).nullable(),
  packageSlug: z.string().max(120).nullable(),
  note: z
    .string()
    .trim()
    .max(600)
    .transform((v) => v || null),
  consent: z.literal(true, { error: 'Centang persetujuan agar kami bisa menghubungi Anda.' }),
});
export type RequestInput = z.input<typeof requestSchema>;

function fieldErrorsOf(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const i of error.issues) out[String(i.path[0])] ??= i.message;
  return out;
}

/** Public: a visitor asks for a survey or to be contacted about a package. */
export async function submitServiceRequest(
  db: Db,
  limiter: RateLimiter,
  raw: RequestInput,
  ctx: RequestCtx,
  now = new Date(),
): Promise<{ refCode: string }> {
  const ipHash = ctx.ip ? hmacIdentifier(ctx.ip) : null;
  const rl = await limiter.hit(`request:${ipHash ?? 'unknown'}`, 5, 3600);
  if (!rl.allowed) throw new AppError('RATE_LIMITED', TOO_MANY);

  const parsed = requestSchema.safeParse(raw);
  const fieldErrors = parsed.success ? {} : fieldErrorsOf(parsed.error);
  const phone = normalizeIndonesianPhone(raw.phone);
  if (!phone) fieldErrors.phone = 'Gunakan nomor ponsel Indonesia, mis. 0812xxxxxxx.';
  if (!parsed.success || Object.keys(fieldErrors).length) {
    throw new AppError('VALIDATION_ERROR', 'Periksa kembali isian yang ditandai.', { fieldErrors });
  }
  const d = parsed.data;

  return db.transaction(async (tx) => {
    let providerId: string | null = null;
    let packageId: string | null = null;
    if (d.packageSlug) {
      const [pkg] = await tx
        .select({ id: internetPackages.id, providerId: internetPackages.providerId })
        .from(internetPackages)
        .where(eq(internetPackages.slug, d.packageSlug));
      if (pkg) ({ id: packageId, providerId } = pkg);
    }

    // Collisions in a 31^6 space are rare; retry a few times rather than fail.
    let refCode = '';
    for (let i = 0; i < 5; i++) {
      const candidate = newRefCode((n) => randomBytes(n));
      const [hit] = await tx
        .select({ id: serviceRequests.id })
        .from(serviceRequests)
        .where(eq(serviceRequests.refCode, candidate));
      if (!hit) {
        refCode = candidate;
        break;
      }
    }
    if (!refCode) throw new AppError('INTERNAL_ERROR', 'Silakan coba lagi.');

    const [row] = await tx
      .insert(serviceRequests)
      .values({
        refCode,
        kind: d.kind,
        name: d.name,
        phone: phone!,
        email: d.email,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        providerId,
        packageId,
        note: d.note,
        consentAt: now,
        consentVersion: REQUEST_CONSENT_VERSION,
        ipHash,
      })
      .returning({ id: serviceRequests.id });
    await tx.insert(serviceRequestEvents).values({ requestId: row!.id, status: 'NEW' });
    await audit(tx, {
      actorId: null,
      actorKind: 'ANONYMOUS',
      action: 'service_request_created',
      entity: 'service_request',
      entityId: row!.id,
      after: { refCode, kind: d.kind, packageId },
      ipHash,
      userAgent: ctx.userAgent,
    });
    return { refCode };
  });
}

/**
 * Public status lookup. Needs the code AND the last 4 digits of the phone, so a guessed
 * code alone reveals nothing. Returns no personal data beyond a masked first name.
 */
export async function lookupServiceRequest(
  db: Db,
  limiter: RateLimiter,
  rawRef: string,
  phoneLast4: string,
  ctx: RequestCtx,
) {
  const ipHash = ctx.ip ? hmacIdentifier(ctx.ip) : null;
  const rl = await limiter.hit(`request-lookup:${ipHash ?? 'unknown'}`, 20, 900);
  if (!rl.allowed) throw new AppError('RATE_LIMITED', TOO_MANY);

  const refCode = normalizeRefCode(rawRef);
  const [row] = await db
    .select({
      id: serviceRequests.id,
      refCode: serviceRequests.refCode,
      kind: serviceRequests.kind,
      status: serviceRequests.status,
      name: serviceRequests.name,
      phone: serviceRequests.phone,
      createdAt: serviceRequests.createdAt,
      packageName: internetPackages.name,
    })
    .from(serviceRequests)
    .leftJoin(internetPackages, eq(internetPackages.id, serviceRequests.packageId))
    .where(eq(serviceRequests.refCode, refCode));
  if (!row || !/^\d{4}$/.test(phoneLast4) || !row.phone.endsWith(phoneLast4)) return null;

  const events = await db
    .select({
      status: serviceRequestEvents.status,
      publicNote: serviceRequestEvents.publicNote,
      createdAt: serviceRequestEvents.createdAt,
    })
    .from(serviceRequestEvents)
    .where(eq(serviceRequestEvents.requestId, row.id))
    .orderBy(asc(serviceRequestEvents.createdAt));
  const first = row.name.split(' ')[0] ?? '';
  return {
    refCode: row.refCode,
    kind: row.kind,
    status: row.status,
    createdAt: row.createdAt,
    packageName: row.packageName,
    maskedName: `${first.slice(0, 1)}${'*'.repeat(Math.max(2, first.length - 1))}`,
    events,
  };
}

function guard(actor: Actor, action: 'lead.read' | 'lead.manage') {
  // Platform-wide only: a provider's sales staff hold lead.read for their own provider.
  const d = authorizePlatform(actor, action);
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

/** Staff: requests, newest first, optionally filtered by status. */
export async function listServiceRequests(db: Db, actor: Actor, statuses?: RequestStatus[]) {
  guard(actor, 'lead.read');
  return db
    .select({
      id: serviceRequests.id,
      refCode: serviceRequests.refCode,
      kind: serviceRequests.kind,
      status: serviceRequests.status,
      name: serviceRequests.name,
      address: serviceRequests.address,
      createdAt: serviceRequests.createdAt,
      packageName: internetPackages.name,
      providerName: providers.displayName,
    })
    .from(serviceRequests)
    .leftJoin(internetPackages, eq(internetPackages.id, serviceRequests.packageId))
    .leftJoin(providers, eq(providers.id, serviceRequests.providerId))
    .where(statuses?.length ? inArray(serviceRequests.status, statuses) : undefined)
    .orderBy(desc(serviceRequests.createdAt))
    .limit(200);
}

export async function getServiceRequest(db: Db, actor: Actor, id: string) {
  guard(actor, 'lead.read');
  if (!z.uuid().safeParse(id).success) return null;
  const [row] = await db
    .select({
      request: serviceRequests,
      packageName: internetPackages.name,
      packageSlug: internetPackages.slug,
      providerName: providers.displayName,
      handlerName: users.fullName,
    })
    .from(serviceRequests)
    .leftJoin(internetPackages, eq(internetPackages.id, serviceRequests.packageId))
    .leftJoin(providers, eq(providers.id, serviceRequests.providerId))
    .leftJoin(users, eq(users.id, serviceRequests.handledBy))
    .where(eq(serviceRequests.id, id));
  if (!row) return null;
  const events = await db
    .select({
      id: serviceRequestEvents.id,
      status: serviceRequestEvents.status,
      publicNote: serviceRequestEvents.publicNote,
      createdAt: serviceRequestEvents.createdAt,
      actorName: users.fullName,
    })
    .from(serviceRequestEvents)
    .leftJoin(users, eq(users.id, serviceRequestEvents.actorId))
    .where(eq(serviceRequestEvents.requestId, id))
    .orderBy(asc(serviceRequestEvents.createdAt));
  return {
    ...row,
    events,
    allowedNext: requestStateMachine.allowedNext(row.request.status, 'PLATFORM'),
  };
}

/**
 * Staff: move a request forward and/or update the internal note. The public note goes to
 * the visitor's tracking page; the internal note never leaves the admin portal.
 */
export async function updateServiceRequest(
  db: Db,
  actor: Actor,
  input: {
    id: string;
    to?: RequestStatus | null;
    publicNote?: string | null;
    adminNote?: string | null;
  },
  ctx: RequestCtx,
) {
  guard(actor, 'lead.manage');
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(serviceRequests).where(eq(serviceRequests.id, input.id));
    if (!row) throw new AppError('NOT_FOUND', 'Permintaan tidak ditemukan.');
    const publicNote = input.publicNote?.trim() || null;
    const adminNote =
      input.adminNote === undefined ? row.adminNote : input.adminNote?.trim() || null;
    const to = input.to && input.to !== row.status ? input.to : null;

    if (to) {
      if (!requestStateMachine.canTransition(row.status, to, 'PLATFORM')) {
        throw new AppError('INVALID_STATE_TRANSITION', 'Perubahan status ini tidak diizinkan.');
      }
      if (requestStateMachine.requiresReason(row.status, to) && !publicNote) {
        throw new AppError('VALIDATION_ERROR', 'Tulis alasan pembatalan untuk pelanggan.', {
          fieldErrors: { publicNote: 'Alasan wajib diisi.' },
        });
      }
    }
    if (!to && adminNote === row.adminNote && !publicNote) return { changed: false };

    await tx
      .update(serviceRequests)
      .set({ status: to ?? row.status, adminNote, handledBy: actor.userId })
      .where(and(eq(serviceRequests.id, row.id)));
    if (to || publicNote) {
      await tx.insert(serviceRequestEvents).values({
        requestId: row.id,
        status: to ?? row.status,
        publicNote,
        actorId: actor.userId,
      });
    }
    await audit(tx, {
      actorId: actor.userId,
      actorKind: 'PLATFORM',
      action: 'service_request_updated',
      entity: 'service_request',
      entityId: row.id,
      before: { status: row.status },
      after: {
        status: to ?? row.status,
        publicNote,
        adminNoteChanged: adminNote !== row.adminNote,
      },
      ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
      userAgent: ctx.userAgent,
    });
    return { changed: true };
  });
}
