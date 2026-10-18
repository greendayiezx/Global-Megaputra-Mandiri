import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { createPgliteDb, type Db } from '@/db/client';
import { serviceRequests, users } from '@/db/schema';
import { createMemoryRateLimiter } from '@/lib/rate-limit';
import { syncRbac } from '@/modules/auth/application/bootstrap';
import type { Actor } from '@/modules/auth/domain/rbac';
import { seedDemoCatalog } from '@/modules/packages/infrastructure/seed-demo-catalog';
import {
  getServiceRequest,
  listServiceRequests,
  lookupServiceRequest,
  submitServiceRequest,
  updateServiceRequest,
  type RequestInput,
} from '@/modules/requests/application/service-requests';

const ctx = { ip: '198.51.100.20', userAgent: 'vitest' };
let db: Db;
let admin: Actor;
let support: Actor;

const input = (over: Partial<RequestInput> = {}): RequestInput => ({
  kind: 'SURVEY',
  name: 'Sari Lestari',
  phone: '0812 3456 7890',
  email: '',
  address: 'Jl. Kenanga No. 5, Cilandak, Jakarta Selatan',
  lat: -6.29,
  lng: 106.8,
  packageSlug: null,
  note: '',
  consent: true,
  ...over,
});

beforeAll(async () => {
  db = await createPgliteDb(null);
  await syncRbac(db);
  await seedDemoCatalog(db);
  const [a, s] = await db
    .insert(users)
    .values([
      { email: 'a@test.invalid', fullName: 'Admin', passwordHash: 'x' },
      { email: 's@test.invalid', fullName: 'CS', passwordHash: 'x' },
    ])
    .returning({ id: users.id });
  admin = { userId: a!.id, roles: ['ADMIN'], providerId: null };
  support = { userId: s!.id, roles: ['CUSTOMER_SUPPORT'], providerId: null };
}, 60_000);

describe('service requests', () => {
  let ref = '';
  let id = '';

  it('requires consent and a valid phone', async () => {
    await expect(
      submitServiceRequest(
        db,
        createMemoryRateLimiter(),
        input({ consent: false as true, phone: '123' }),
        ctx,
      ),
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      details: { fieldErrors: { consent: expect.any(String), phone: expect.any(String) } },
    });
  });

  it('stores the request with consent, links the package, and returns a reference code', async () => {
    ({ refCode: ref } = await submitServiceRequest(
      db,
      createMemoryRateLimiter(),
      input({ kind: 'INSTALLATION', packageSlug: 'demo-provider-001-rumah-30' }),
      ctx,
    ));
    expect(ref).toMatch(/^GMM-[A-HJ-NP-Z2-9]{6}$/);
    const [row] = await db.select().from(serviceRequests).where(eq(serviceRequests.refCode, ref));
    id = row!.id;
    expect(row).toMatchObject({
      status: 'NEW',
      phone: '+6281234567890',
      packageId: 'demo-pkg-101',
      providerId: 'demo-prov-001',
      consentVersion: 'permintaan-v1',
    });
  });

  it('shows status only with the right last 4 digits, without internal notes', async () => {
    const limiter = createMemoryRateLimiter();
    expect(await lookupServiceRequest(db, limiter, ref, '0000', ctx)).toBeNull();
    await updateServiceRequest(
      db,
      admin,
      { id, to: 'CONTACTED', publicNote: 'Kami sudah menelepon Anda.', adminNote: 'rahasia' },
      ctx,
    );
    const r = await lookupServiceRequest(db, limiter, ref.toLowerCase(), '7890', ctx);
    expect(r).toMatchObject({ status: 'CONTACTED', maskedName: 'S***' });
    expect(r!.events.map((e) => e.status)).toEqual(['NEW', 'CONTACTED']);
    expect(JSON.stringify(r)).not.toContain('rahasia');
    expect(JSON.stringify(r)).not.toContain('Kenanga');
  });

  it('cancelling needs a note for the visitor; closed requests stay closed', async () => {
    await expect(
      updateServiceRequest(db, admin, { id, to: 'CANCELLED' }, ctx),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await updateServiceRequest(
      db,
      admin,
      { id, to: 'CANCELLED', publicNote: 'Belum ada provider di area ini.' },
      ctx,
    );
    await expect(updateServiceRequest(db, admin, { id, to: 'DONE' }, ctx)).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
    });
    const detail = await getServiceRequest(db, admin, id);
    expect(detail!.allowedNext).toEqual([]);
  });

  it('is limited to staff with lead permissions', async () => {
    await expect(listServiceRequests(db, support)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await listServiceRequests(db, admin)).length).toBe(1);
  });

  it('rate-limits submissions per IP', async () => {
    const limiter = createMemoryRateLimiter();
    for (let i = 0; i < 5; i++) await submitServiceRequest(db, limiter, input(), ctx);
    await expect(submitServiceRequest(db, limiter, input(), ctx)).rejects.toMatchObject({
      code: 'RATE_LIMITED',
    });
  });
});
