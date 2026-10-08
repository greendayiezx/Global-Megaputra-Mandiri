import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { createPgliteDb, type Db } from '@/db/client';
import { auditLogs, rolePermissions, roles, users } from '@/db/schema';
import { createMemoryRateLimiter } from '@/lib/rate-limit';
import {
  login,
  logout,
  registerCustomer,
  resolveSession,
  setPlatformRoles,
  type AuthDeps,
} from '@/modules/auth/application/auth-service';
import { seedDemoAccounts, syncRbac } from '@/modules/auth/application/bootstrap';
import { ROLE_PERMISSIONS } from '@/modules/auth/domain/rbac';

const ctx = { ip: '203.0.113.7', userAgent: 'vitest' };
const strongPassword = 'kopi-pagi-di-teras';

let db: Db;
let clock = new Date('2026-10-08T03:00:00Z');
const deps = (): AuthDeps => ({ db, limiter: createMemoryRateLimiter(), now: () => clock });

beforeAll(async () => {
  db = await createPgliteDb(null); // in-memory Postgres, real migrations
  await syncRbac(db);
}, 60_000);

describe('migrations & RBAC sync', () => {
  it('creates all roles and their permission links, idempotently', async () => {
    await syncRbac(db);
    const roleRows = await db.select().from(roles);
    expect(roleRows).toHaveLength(Object.keys(ROLE_PERMISSIONS).length);
    const customer = roleRows.find((r) => r.key === 'CUSTOMER')!;
    const links = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, customer.id));
    expect(links).toHaveLength(ROLE_PERMISSIONS.CUSTOMER.length);
  });
});

describe('registration & login', () => {
  it('registers a customer, issues a session, and audits it', async () => {
    const d = deps();
    const s = await registerCustomer(
      d,
      {
        fullName: '  Budi   Santoso ',
        email: 'Budi@Example.com',
        phone: '0812-3456-7890',
        password: strongPassword,
      },
      ctx,
    );
    expect(s.token).toHaveLength(43);

    const [u] = await db.select().from(users).where(eq(users.id, s.userId));
    expect(u).toMatchObject({
      email: 'budi@example.com',
      phone: '+6281234567890',
      fullName: 'Budi Santoso',
    });
    expect(u!.passwordHash).toMatch(/^\$argon2id\$/);

    const resolved = await resolveSession(d, s.token);
    expect(resolved?.actor.roles).toEqual(['CUSTOMER']);

    const logs = await db.select().from(auditLogs).where(eq(auditLogs.entityId, s.userId));
    expect(logs.map((l) => l.action)).toContain('user_registered');
    expect(JSON.stringify(logs)).not.toContain(strongPassword);
  });

  it('rejects duplicate email and weak passwords with field errors', async () => {
    await expect(
      registerCustomer(
        deps(),
        {
          fullName: 'Budi Lain',
          email: 'budi@example.com',
          phone: '081299990000',
          password: strongPassword,
        },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(
      registerCustomer(
        deps(),
        { fullName: 'Ani', email: 'ani@example.com', phone: '081299990001', password: 'pendek' },
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fieldErrors: { password: expect.any(String) } },
    });
  });

  it('logs in with the right password and rejects the wrong one generically', async () => {
    const d = deps();
    const s = await login(d, { email: 'BUDI@example.com', password: strongPassword }, ctx);
    expect(await resolveSession(d, s.token)).not.toBeNull();
    await expect(
      login(d, { email: 'budi@example.com', password: 'salah-sekali-123' }, ctx),
    ).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
      message: 'Email atau kata sandi tidak sesuai.',
    });
    await expect(
      login(d, { email: 'tidak-ada@example.com', password: 'apa-saja-123' }, ctx),
    ).rejects.toMatchObject({
      code: 'AUTH_REQUIRED',
      message: 'Email atau kata sandi tidak sesuai.',
    });
  });

  it('locks the account after repeated failures, then unlocks after the window', async () => {
    await registerCustomer(
      deps(),
      {
        fullName: 'Lock Test',
        email: 'lock@example.com',
        phone: '081277770000',
        password: strongPassword,
      },
      ctx,
    );
    const d = deps();
    for (let i = 0; i < 4; i++) {
      await expect(
        login(d, { email: 'lock@example.com', password: `wrong-pass-${i}` }, ctx),
      ).rejects.toMatchObject({
        code: 'AUTH_REQUIRED',
      });
    }
    await expect(
      login(d, { email: 'lock@example.com', password: 'wrong-pass-5' }, ctx),
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    // Even the right password is refused while locked.
    await expect(
      login(d, { email: 'lock@example.com', password: strongPassword }, ctx),
    ).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
    clock = new Date(clock.getTime() + 16 * 60_000);
    await expect(
      login(deps(), { email: 'lock@example.com', password: strongPassword }, ctx),
    ).resolves.toBeTruthy();
    const locked = await db.select().from(auditLogs).where(eq(auditLogs.action, 'login_locked'));
    expect(locked).toHaveLength(1);
  });

  it('rate-limits brute force from one IP', async () => {
    const d = deps();
    let limited = false;
    for (let i = 0; i < 12; i++) {
      try {
        await login(
          d,
          { email: `nobody${i}@example.com`, password: 'x-x-x-x-x-x' },
          { ...ctx, ip: '198.51.100.1' },
        );
      } catch (e) {
        if ((e as { code?: string }).code === 'RATE_LIMITED') limited = true;
      }
    }
    // 30 per IP per window; per-account limits apply to the same email.
    expect(limited).toBe(false);
    for (let i = 0; i < 11; i++) {
      try {
        await login(d, { email: 'target@example.com', password: `guess-${i}-xxxx` }, ctx);
      } catch (e) {
        if ((e as { code?: string }).code === 'RATE_LIMITED') limited = true;
      }
    }
    expect(limited).toBe(true);
  });

  it('logout revokes the session and expired sessions resolve to null', async () => {
    const d = deps();
    const s = await login(d, { email: 'budi@example.com', password: strongPassword }, ctx);
    await logout(d, s.token, ctx);
    expect(await resolveSession(d, s.token)).toBeNull();

    const s2 = await login(deps(), { email: 'budi@example.com', password: strongPassword }, ctx);
    clock = new Date(clock.getTime() + 169 * 3_600_000);
    expect(await resolveSession(deps(), s2.token)).toBeNull();
  });
});

describe('roles', () => {
  it('provider membership grants a provider-scoped actor', async () => {
    await seedDemoAccounts(db);
    const s = await login(
      deps(),
      { email: 'provider@demo.gmm.invalid', password: 'GmmDemo#2026' },
      ctx,
    );
    const r = await resolveSession(deps(), s.token);
    expect(r?.actor).toMatchObject({ roles: ['PROVIDER_OWNER'], providerId: 'demo-prov-001' });
  });

  it('only SUPER_ADMIN can change platform roles, and the change is audited', async () => {
    const [budi] = await db.select().from(users).where(eq(users.email, 'budi@example.com'));
    const admin = { userId: 'x', roles: ['ADMIN' as const], providerId: null };
    await expect(setPlatformRoles(deps(), admin, budi!.id, ['FINANCE'])).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });

    const s = await login(
      deps(),
      { email: 'admin@demo.gmm.invalid', password: 'GmmDemo#2026' },
      ctx,
    );
    const superAdmin = (await resolveSession(deps(), s.token))!.actor;
    await setPlatformRoles(deps(), superAdmin, budi!.id, ['CUSTOMER', 'CUSTOMER_SUPPORT']);
    const [log] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'user_role_changed'));
    expect(log).toMatchObject({
      before: { roles: ['CUSTOMER'] },
      after: { roles: ['CUSTOMER', 'CUSTOMER_SUPPORT'] },
      actorId: superAdmin.userId,
    });
  });
});
