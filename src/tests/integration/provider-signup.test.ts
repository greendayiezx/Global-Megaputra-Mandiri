import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { createPgliteDb, type Db } from '@/db/client';
import { auditLogs, providers, providerUsers, userRoles, users } from '@/db/schema';
import { createMemoryRateLimiter } from '@/lib/rate-limit';
import {
  registerProvider,
  resolveSession,
  type AuthDeps,
  type ProviderRegistrationInput,
} from '@/modules/auth/application/auth-service';
import { syncRbac } from '@/modules/auth/application/bootstrap';
import { isProviderPubliclyVisible } from '@/modules/providers/domain/provider-rules';

const ctx = { ip: '203.0.113.50', userAgent: 'vitest' };
let db: Db;
const deps = (): AuthDeps => ({ db, limiter: createMemoryRateLimiter() });

const input = (over: Partial<ProviderRegistrationInput> = {}): ProviderRegistrationInput => ({
  fullName: 'Rina Wijaya',
  email: 'rina@contohnet.invalid',
  phone: '081311112222',
  password: 'jaringan-kencang-sekali',
  company: {
    displayName: 'Contoh Net',
    legalName: 'PT Contoh Net Indonesia',
    nib: '1234567890123',
    address: 'Jl. Melati No. 10, Bandung',
    technologies: ['FIBER'],
    serviceAreaNames: ['Bandung'],
  },
  ...over,
});

beforeAll(async () => {
  db = await createPgliteDb(null);
  await syncRbac(db);
}, 60_000);

describe('provider self sign-up', () => {
  it('creates owner account, pending provider, membership, audit and a session', async () => {
    const s = await registerProvider(deps(), input(), ctx);
    const [p] = await db.select().from(providers).where(eq(providers.id, s.providerId));
    expect(p).toMatchObject({
      slug: 'contoh-net',
      verificationStatus: 'PENDING',
      picEmail: 'rina@contohnet.invalid',
      isDemo: false,
    });
    expect(isProviderPubliclyVisible(p!, true)).toBe(false);

    const [m] = await db.select().from(providerUsers).where(eq(providerUsers.userId, s.userId));
    expect(m!.providerId).toBe(s.providerId);
    // Not a customer account.
    expect(await db.select().from(userRoles).where(eq(userRoles.userId, s.userId))).toHaveLength(0);

    const session = await resolveSession(deps(), s.token);
    expect(session?.actor).toMatchObject({ providerId: s.providerId, roles: ['PROVIDER_OWNER'] });
    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'provider_registered'));
    expect(logs).toHaveLength(1);
  });

  it('gives a second provider with the same brand a distinct slug', async () => {
    const s = await registerProvider(
      deps(),
      input({ email: 'lain@contoh.invalid', phone: '081399998888' }),
      ctx,
    );
    const [p] = await db.select().from(providers).where(eq(providers.id, s.providerId));
    expect(p!.slug).toBe('contoh-net-2');
  });

  it('refuses a registered email without creating anything', async () => {
    const before = (await db.select().from(users)).length;
    await expect(
      registerProvider(deps(), input({ phone: '081377776666' }), ctx),
    ).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await db.select().from(users)).toHaveLength(before);
  });

  it('validates company data and password', async () => {
    await expect(
      registerProvider(
        deps(),
        input({
          email: 'x@y.invalid',
          phone: '081355554444',
          password: 'pendek',
          company: { ...input().company, nib: '12', technologies: [] },
        }),
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: {
        fieldErrors: {
          nib: expect.any(String),
          technologies: expect.any(String),
          password: expect.any(String),
        },
      },
    });
  });
});
