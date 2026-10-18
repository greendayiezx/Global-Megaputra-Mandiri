import { randomBytes } from 'node:crypto';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { Db } from '@/db/client';
import { providers, ticketMessages, tickets, users } from '@/db/schema';
import { audit } from '@/lib/audit';
import { AppError } from '@/lib/errors';
import type { RateLimiter } from '@/lib/rate-limit';
import { authorize, authorizePlatform, type Action, type Actor } from '@/modules/auth/domain/rbac';
import { hmacIdentifier } from '@/modules/auth/infrastructure/crypto';
import type { RequestCtx } from '@/modules/providers/application/provider-review';
import { newRefCode } from '@/modules/requests/domain/request-rules';
import { TICKET_CATEGORIES, ticketStateMachine, type TicketStatus } from '../domain/ticket-rules';

function guard(actor: Actor, action: Action, resource?: { ownerUserId: string }) {
  const d = authorize(actor, action, resource);
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

/** Staff side: customers hold ticket.read/reply for their own tickets, which must not count. */
function staffGuard(actor: Actor, action: Action) {
  const d = authorizePlatform(actor, action);
  if (!d.ok) throw new AppError(d.code, 'Akses ditolak.');
}

const body = z
  .string()
  .trim()
  .min(5, { error: 'Tulis pesan minimal 5 karakter.' })
  .max(4000, { error: 'Pesan terlalu panjang.' });

export const newTicketSchema = z.object({
  subject: z.string().trim().min(5, { error: 'Tulis judul singkat.' }).max(120),
  category: z.enum(TICKET_CATEGORIES, { error: 'Pilih kategori.' }),
  body,
});
export type NewTicketInput = z.input<typeof newTicketSchema>;

function invalid(error: z.ZodError): never {
  const fieldErrors: Record<string, string> = {};
  for (const i of error.issues) fieldErrors[String(i.path[0])] ??= i.message;
  throw new AppError('VALIDATION_ERROR', 'Periksa kembali isian yang ditandai.', { fieldErrors });
}

const meta = (ctx: RequestCtx) => ({
  ipHash: ctx.ip ? hmacIdentifier(ctx.ip) : null,
  userAgent: ctx.userAgent,
});

/** Customer opens a ticket with its first message. */
export async function createTicket(
  db: Db,
  limiter: RateLimiter,
  actor: Actor,
  raw: NewTicketInput,
  ctx: RequestCtx,
): Promise<{ id: string; refCode: string }> {
  guard(actor, 'ticket.create');
  const rl = await limiter.hit(`ticket:${actor.userId}`, 10, 3600);
  if (!rl.allowed) throw new AppError('RATE_LIMITED', 'Terlalu banyak tiket dalam satu jam.');
  const parsed = newTicketSchema.safeParse(raw);
  if (!parsed.success) invalid(parsed.error);
  const d = parsed.data;

  return db.transaction(async (tx) => {
    let refCode = '';
    for (let i = 0; i < 5 && !refCode; i++) {
      const c = newRefCode((n) => randomBytes(n), 'TKT');
      const [hit] = await tx.select({ id: tickets.id }).from(tickets).where(eq(tickets.refCode, c));
      if (!hit) refCode = c;
    }
    if (!refCode) throw new AppError('INTERNAL_ERROR', 'Silakan coba lagi.');
    const [t] = await tx
      .insert(tickets)
      .values({ refCode, customerId: actor.userId, subject: d.subject, category: d.category })
      .returning({ id: tickets.id });
    await tx
      .insert(ticketMessages)
      .values({ ticketId: t!.id, authorId: actor.userId, authorKind: 'CUSTOMER', body: d.body });
    await audit(tx, {
      actorId: actor.userId,
      actorKind: 'CUSTOMER',
      action: 'ticket_created',
      entity: 'ticket',
      entityId: t!.id,
      after: { refCode, category: d.category },
      ...meta(ctx),
    });
    return { id: t!.id, refCode };
  });
}

export async function listOwnTickets(db: Db, actor: Actor) {
  guard(actor, 'ticket.read', { ownerUserId: actor.userId });
  return db
    .select({
      id: tickets.id,
      refCode: tickets.refCode,
      subject: tickets.subject,
      category: tickets.category,
      status: tickets.status,
      lastMessageAt: tickets.lastMessageAt,
    })
    .from(tickets)
    .where(eq(tickets.customerId, actor.userId))
    .orderBy(desc(tickets.lastMessageAt));
}

async function messagesOf(db: Pick<Db, 'select'>, ticketId: string, includeInternal: boolean) {
  return db
    .select({
      id: ticketMessages.id,
      authorKind: ticketMessages.authorKind,
      authorName: users.fullName,
      body: ticketMessages.body,
      internal: ticketMessages.internal,
      createdAt: ticketMessages.createdAt,
    })
    .from(ticketMessages)
    .leftJoin(users, eq(users.id, ticketMessages.authorId))
    .where(
      includeInternal
        ? eq(ticketMessages.ticketId, ticketId)
        : and(eq(ticketMessages.ticketId, ticketId), eq(ticketMessages.internal, false)),
    )
    .orderBy(asc(ticketMessages.createdAt));
}

/** The customer's own ticket; internal notes are never returned. Others' tickets → null. */
export async function getOwnTicket(db: Db, actor: Actor, id: string) {
  if (!z.uuid().safeParse(id).success) return null;
  const [t] = await db.select().from(tickets).where(eq(tickets.id, id));
  if (!t || t.customerId !== actor.userId) return null;
  guard(actor, 'ticket.read', { ownerUserId: t.customerId });
  const messages = await messagesOf(db, id, false);
  // Staff names stay private: the customer sees "Tim GMM".
  return {
    ticket: t,
    messages: messages.map((m) => ({
      ...m,
      authorName: m.authorKind === 'CUSTOMER' ? m.authorName : 'Tim GMM',
    })),
  };
}

/** Customer reply; reopens a ticket that was waiting on them or resolved. */
export async function replyAsCustomer(db: Db, actor: Actor, id: string, rawBody: string) {
  const parsed = body.safeParse(rawBody);
  if (!parsed.success) invalid(parsed.error);
  return db.transaction(async (tx) => {
    const [t] = await tx.select().from(tickets).where(eq(tickets.id, id));
    if (!t || t.customerId !== actor.userId)
      throw new AppError('NOT_FOUND', 'Tiket tidak ditemukan.');
    guard(actor, 'ticket.reply', { ownerUserId: t.customerId });
    if (t.status === 'CLOSED') {
      throw new AppError(
        'INVALID_STATE_TRANSITION',
        'Tiket sudah ditutup. Silakan buat tiket baru.',
      );
    }
    const reopen = ticketStateMachine.canTransition(t.status, 'OPEN', 'CUSTOMER');
    await tx.insert(ticketMessages).values({
      ticketId: t.id,
      authorId: actor.userId,
      authorKind: 'CUSTOMER',
      body: parsed.data,
    });
    await tx
      .update(tickets)
      .set({
        lastMessageAt: new Date(),
        ...(reopen ? { status: 'OPEN' as const, resolvedAt: null } : {}),
      })
      .where(eq(tickets.id, t.id));
  });
}

/** Staff queue, oldest activity first among open work so nothing sits forgotten. */
export async function listTicketsForStaff(db: Db, actor: Actor, statuses: TicketStatus[]) {
  staffGuard(actor, 'ticket.read');
  const assignee = users;
  return db
    .select({
      id: tickets.id,
      refCode: tickets.refCode,
      subject: tickets.subject,
      category: tickets.category,
      status: tickets.status,
      lastMessageAt: tickets.lastMessageAt,
      createdAt: tickets.createdAt,
      assigneeName: assignee.fullName,
    })
    .from(tickets)
    .leftJoin(assignee, eq(assignee.id, tickets.assigneeId))
    .where(statuses.length ? inArray(tickets.status, statuses) : undefined)
    .orderBy(statuses.includes('OPEN') ? asc(tickets.lastMessageAt) : desc(tickets.lastMessageAt))
    .limit(200);
}

export async function getTicketForStaff(db: Db, actor: Actor, id: string) {
  staffGuard(actor, 'ticket.read');
  if (!z.uuid().safeParse(id).success) return null;
  const [t] = await db.select().from(tickets).where(eq(tickets.id, id));
  if (!t) return null;
  const [customer] = await db
    .select({ fullName: users.fullName, email: users.email, phone: users.phone })
    .from(users)
    .where(eq(users.id, t.customerId));
  const [assignee] = t.assigneeId
    ? await db.select({ fullName: users.fullName }).from(users).where(eq(users.id, t.assigneeId))
    : [];
  const [provider] = t.providerId
    ? await db
        .select({ displayName: providers.displayName })
        .from(providers)
        .where(eq(providers.id, t.providerId))
    : [];
  return {
    ticket: t,
    customer: customer ?? null,
    assigneeName: assignee?.fullName ?? null,
    providerName: provider?.displayName ?? null,
    messages: await messagesOf(db, id, true),
    allowedNext: ticketStateMachine.allowedNext(t.status, 'PLATFORM'),
  };
}

/**
 * Staff reply and/or status change. Internal notes need ticket.internal_note and are never
 * shown to the customer. Replying to an unassigned ticket assigns it to the replier.
 */
export async function staffUpdateTicket(
  db: Db,
  actor: Actor,
  input: {
    id: string;
    body?: string | null;
    internal?: boolean;
    to?: TicketStatus | null;
    assignToMe?: boolean;
  },
  ctx: RequestCtx,
) {
  staffGuard(actor, 'ticket.reply');
  const text = input.body?.trim() || null;
  if (input.internal) staffGuard(actor, 'ticket.internal_note');
  if (input.assignToMe) staffGuard(actor, 'ticket.assign');
  if (text) {
    const parsed = body.safeParse(text);
    if (!parsed.success) invalid(parsed.error);
  }

  return db.transaction(async (tx) => {
    const [t] = await tx.select().from(tickets).where(eq(tickets.id, input.id));
    if (!t) throw new AppError('NOT_FOUND', 'Tiket tidak ditemukan.');
    const to = input.to && input.to !== t.status ? input.to : null;
    if (to && !ticketStateMachine.canTransition(t.status, to, 'PLATFORM')) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Perubahan status ini tidak diizinkan.');
    }
    if (!text && !to && !input.assignToMe) return { changed: false };
    if (t.status === 'CLOSED' && text && !input.internal) {
      throw new AppError('INVALID_STATE_TRANSITION', 'Tiket sudah ditutup.');
    }

    if (text) {
      await tx.insert(ticketMessages).values({
        ticketId: t.id,
        authorId: actor.userId,
        authorKind: 'PLATFORM',
        body: text,
        internal: Boolean(input.internal),
      });
    }
    const assign = input.assignToMe || (text && !t.assigneeId);
    await tx
      .update(tickets)
      .set({
        ...(to ? { status: to, resolvedAt: to === 'RESOLVED' ? new Date() : t.resolvedAt } : {}),
        ...(assign ? { assigneeId: actor.userId } : {}),
        ...(text && !input.internal ? { lastMessageAt: new Date() } : {}),
      })
      .where(eq(tickets.id, t.id));
    if (to) {
      await audit(tx, {
        actorId: actor.userId,
        actorKind: 'PLATFORM',
        action: 'ticket_status_changed',
        entity: 'ticket',
        entityId: t.id,
        before: { status: t.status },
        after: { status: to },
        ...meta(ctx),
      });
    }
    return { changed: true };
  });
}
