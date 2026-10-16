import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { createPgliteDb, type Db } from '@/db/client';
import { auditLogs, internetPackages, providers, providerStatusHistory, users } from '@/db/schema';
import { syncRbac } from '@/modules/auth/application/bootstrap';
import type { Actor } from '@/modules/auth/domain/rbac';
import { changePackageStatus } from '@/modules/packages/application/package-review';
import { seedDemoCatalog } from '@/modules/packages/infrastructure/seed-demo-catalog';
import { changeProviderStatus } from '@/modules/providers/application/provider-review';

const ctx = { ip: '203.0.113.9', userAgent: 'vitest' };
let db: Db;
let admin: Actor;
let support: Actor;

const providerRow = async (id: string) =>
  (await db.select().from(providers).where(eq(providers.id, id)))[0]!;
const packageRow = async (id: string) =>
  (await db.select().from(internetPackages).where(eq(internetPackages.id, id)))[0]!;

beforeAll(async () => {
  db = await createPgliteDb(null);
  await syncRbac(db);
  await seedDemoCatalog(db);
  const [a, s] = await db
    .insert(users)
    .values([
      { email: 'admin@test.invalid', fullName: 'Admin Uji', passwordHash: 'x' },
      { email: 'cs@test.invalid', fullName: 'CS Uji', passwordHash: 'x' },
    ])
    .returning({ id: users.id });
  admin = { userId: a!.id, roles: ['ADMIN'], providerId: null };
  support = { userId: s!.id, roles: ['CUSTOMER_SUPPORT'], providerId: null };
}, 60_000);

describe('provider verification by GMM staff', () => {
  it('refuses to approve a provider whose profile is incomplete', async () => {
    await expect(
      changeProviderStatus(db, admin, { providerId: 'demo-prov-003', to: 'VERIFIED' }, ctx),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', message: expect.stringContaining('NIB') });
    expect((await providerRow('demo-prov-003')).verificationStatus).toBe('UNDER_REVIEW');
  });

  it('does not let customer support make verification decisions', async () => {
    await expect(
      changeProviderStatus(db, support, { providerId: 'demo-prov-003', to: 'VERIFIED' }, ctx),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('requires a reason to reject', async () => {
    await expect(
      changeProviderStatus(db, admin, { providerId: 'demo-prov-003', to: 'REJECTED' }, ctx),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('approves a complete provider with history and audit in one go', async () => {
    await db
      .update(providers)
      .set({
        nib: '1234567890123',
        picName: 'Budi',
        picPhone: '0811000000',
        picEmail: 'budi@demo-provider-003.invalid',
        address: 'Jl. Contoh No. 1, Jakarta',
      })
      .where(eq(providers.id, 'demo-prov-003'));
    await changeProviderStatus(db, admin, { providerId: 'demo-prov-003', to: 'VERIFIED' }, ctx);

    const row = await providerRow('demo-prov-003');
    expect(row.verificationStatus).toBe('VERIFIED');
    expect(row.verifiedAt).not.toBeNull();
    expect(row.verifiedBy).toBe(admin.userId);
    const history = await db
      .select()
      .from(providerStatusHistory)
      .where(eq(providerStatusHistory.providerId, 'demo-prov-003'));
    expect(history).toMatchObject([{ fromStatus: 'UNDER_REVIEW', toStatus: 'VERIFIED' }]);
    const logs = await db
      .select()
      .from(auditLogs)
      .where(
        and(eq(auditLogs.entityId, 'demo-prov-003'), eq(auditLogs.action, 'provider_approved')),
      );
    expect(logs).toHaveLength(1);
    expect(logs[0]!.ipHash).not.toBe(ctx.ip);
  });

  it('suspends with a reason and keeps the original verification date', async () => {
    const before = await providerRow('demo-prov-003');
    await changeProviderStatus(
      db,
      admin,
      { providerId: 'demo-prov-003', to: 'SUSPENDED', reason: 'Keluhan pelanggan berulang' },
      ctx,
    );
    const after = await providerRow('demo-prov-003');
    expect(after.verificationStatus).toBe('SUSPENDED');
    expect(after.verifiedAt).toEqual(before.verifiedAt);
  });

  it('rejects moves the state machine does not allow', async () => {
    await expect(
      changeProviderStatus(db, admin, { providerId: 'demo-prov-001', to: 'PENDING' }, ctx),
    ).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION' });
  });
});

describe('package review by GMM staff', () => {
  it('will not publish a package of an unverified provider', async () => {
    // demo-prov-003 is suspended by the previous suite.
    await db
      .update(internetPackages)
      .set({ status: 'PENDING_REVIEW' })
      .where(eq(internetPackages.id, 'demo-pkg-301'));
    await expect(
      changePackageStatus(db, admin, { packageId: 'demo-pkg-301', to: 'PUBLISHED' }, ctx),
    ).rejects.toMatchObject({ code: 'PROVIDER_NOT_VERIFIED' });
  });

  it('sends a package back to draft only with a reason, which the provider can read', async () => {
    await expect(
      changePackageStatus(db, admin, { packageId: 'demo-pkg-301', to: 'DRAFT' }, ctx),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await changePackageStatus(
      db,
      admin,
      { packageId: 'demo-pkg-301', to: 'DRAFT', reason: 'Lengkapi jam dukungan' },
      ctx,
    );
    const row = await packageRow('demo-pkg-301');
    expect(row.status).toBe('DRAFT');
    expect(row.reviewNote).toBe('Lengkapi jam dukungan');
  });

  it('publishes a complete package of a verified provider and stamps the price check', async () => {
    await db
      .update(internetPackages)
      .set({ status: 'PENDING_REVIEW', reviewNote: 'lama' })
      .where(eq(internetPackages.id, 'demo-pkg-103'));
    const now = new Date('2026-10-16T05:00:00Z');
    await changePackageStatus(db, admin, { packageId: 'demo-pkg-103', to: 'PUBLISHED' }, ctx, now);
    const row = await packageRow('demo-pkg-103');
    expect(row).toMatchObject({ status: 'PUBLISHED', reviewNote: null });
    expect(row.publishedAt).toEqual(now);
    expect(row.lastPriceVerifiedAt).toEqual(now);
  });

  it('does not let customer support publish', async () => {
    await expect(
      changePackageStatus(
        db,
        support,
        { packageId: 'demo-pkg-101', to: 'SUSPENDED', reason: 'x' },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
