import { beforeAll, describe, expect, it } from 'vitest';
import { createPgliteDb, type Db } from '@/db/client';
import { users } from '@/db/schema';
import { createMemoryRateLimiter } from '@/lib/rate-limit';
import { syncRbac } from '@/modules/auth/application/bootstrap';
import type { Actor } from '@/modules/auth/domain/rbac';
import {
  createTicket,
  getOwnTicket,
  getTicketForStaff,
  listOwnTickets,
  listTicketsForStaff,
  replyAsCustomer,
  staffUpdateTicket,
} from '@/modules/support/application/tickets';

const ctx = { ip: '203.0.113.77', userAgent: 'vitest' };
let db: Db;
let alice: Actor;
let bob: Actor;
let cs: Actor;
let finance: Actor;

beforeAll(async () => {
  db = await createPgliteDb(null);
  await syncRbac(db);
  const rows = await db
    .insert(users)
    .values(
      ['alice', 'bob', 'cs', 'fin'].map((n) => ({
        email: `${n}@test.invalid`,
        fullName: n === 'cs' ? 'Citra CS' : n,
        passwordHash: 'x',
      })),
    )
    .returning({ id: users.id });
  alice = { userId: rows[0]!.id, roles: ['CUSTOMER'], providerId: null };
  bob = { userId: rows[1]!.id, roles: ['CUSTOMER'], providerId: null };
  cs = { userId: rows[2]!.id, roles: ['CUSTOMER_SUPPORT'], providerId: null };
  finance = { userId: rows[3]!.id, roles: ['FINANCE'], providerId: null };
}, 60_000);

describe('support tickets', () => {
  let id = '';

  it('validates and creates a ticket with a reference code', async () => {
    await expect(
      createTicket(
        db,
        createMemoryRateLimiter(),
        alice,
        { subject: 'x', category: 'OTHER', body: 'y' },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    const t = await createTicket(
      db,
      createMemoryRateLimiter(),
      alice,
      {
        subject: 'Teknisi belum datang',
        category: 'INSTALLATION',
        body: 'Jadwal kemarin pukul 10.',
      },
      ctx,
    );
    id = t.id;
    expect(t.refCode).toMatch(/^TKT-/);
    expect(await listOwnTickets(db, alice)).toHaveLength(1);
  });

  it("a customer cannot see someone else's ticket", async () => {
    expect(await getOwnTicket(db, bob, id)).toBeNull();
    expect(await listOwnTickets(db, bob)).toHaveLength(0);
    await expect(replyAsCustomer(db, bob, id, 'Halo halo')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('internal notes and staff names stay hidden from the customer', async () => {
    await staffUpdateTicket(db, cs, { id, body: 'Cek ke provider dulu', internal: true }, ctx);
    await staffUpdateTicket(
      db,
      cs,
      { id, body: 'Kami sedang menghubungi provider.', to: 'WAITING_CUSTOMER' },
      ctx,
    );
    const mine = await getOwnTicket(db, alice, id);
    expect(mine!.messages.map((m) => m.body)).toEqual([
      'Jadwal kemarin pukul 10.',
      'Kami sedang menghubungi provider.',
    ]);
    expect(mine!.messages[1]!.authorName).toBe('Tim GMM');
    const staff = await getTicketForStaff(db, cs, id);
    expect(staff!.messages).toHaveLength(3);
    expect(staff!.assigneeName).toBe('Citra CS');
  });

  it('a customer reply reopens a ticket waiting on them; closed tickets accept no reply', async () => {
    await replyAsCustomer(db, alice, id, 'Baik, saya tunggu kabarnya.');
    expect((await getOwnTicket(db, alice, id))!.ticket.status).toBe('OPEN');
    await staffUpdateTicket(db, cs, { id, to: 'CLOSED' }, ctx);
    await expect(replyAsCustomer(db, alice, id, 'Masih ada kendala')).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
  });

  it('only support-capable staff see the queue', async () => {
    expect((await listTicketsForStaff(db, cs, [])).length).toBe(1);
    await expect(listTicketsForStaff(db, finance, [])).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(listTicketsForStaff(db, alice, [])).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(getTicketForStaff(db, alice, id)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      staffUpdateTicket(db, alice, { id, body: 'Saya staf palsu', to: 'RESOLVED' }, ctx),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
