import { and, eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { createPgliteDb, type Db } from '@/db/client';
import { auditLogs, internetPackages, packagePriceHistory, providers, users } from '@/db/schema';
import { syncRbac } from '@/modules/auth/application/bootstrap';
import type { Actor } from '@/modules/auth/domain/rbac';
import {
  addOwnAdminAreaZone,
  addOwnRadiusZone,
  setOwnZoneStatus,
} from '@/modules/coverage/application/zone-self-service';
import { zoneMatches } from '@/modules/coverage/domain/coverage';
import { regionChain } from '@/lib/wilayah/codes';
import {
  createOwnPackage,
  submitOwnPackage,
  updateOwnPackage,
  type PackageInput,
} from '@/modules/packages/application/package-self-service';
import { createDbCatalogRepository } from '@/modules/packages/infrastructure/db-catalog';
import { seedDemoCatalog } from '@/modules/packages/infrastructure/seed-demo-catalog';
import {
  updateOwnProfile,
  type ProfileInput,
} from '@/modules/providers/application/provider-self-service';

const ctx = { ip: '198.51.100.4', userAgent: 'vitest' };
let db: Db;
let owner: Actor;
let sales: Actor;

const pkgInput = (over: Partial<PackageInput> = {}): PackageInput => ({
  name: 'Rumah 50',
  description: 'Paket uji',
  downloadMbps: 50,
  uploadMbps: 50,
  technology: 'FIBER',
  monthlyPrice: 250_000,
  installationFee: 0,
  activationFee: 0,
  taxIncluded: false,
  contractMonths: 0,
  routerIncluded: true,
  fupPolicy: '',
  slaSummary: '',
  supportHours: '24 jam',
  estInstallationDaysMin: 1,
  estInstallationDaysMax: 3,
  features: [],
  ...over,
});

const profileFrom = (p: typeof providers.$inferSelect): ProfileInput => ({
  displayName: p.displayName,
  legalName: p.legalName,
  nib: p.nib ?? '',
  address: p.address ?? '',
  picName: p.picName ?? '',
  picPhone: p.picPhone ?? '',
  picEmail: p.picEmail ?? '',
  description: p.description,
  website: p.website ?? '',
  supportPhone: p.supportPhone ?? '',
  supportEmail: p.supportEmail ?? '',
  supportHours: p.supportHours,
  slaSummary: p.slaSummary ?? '',
  installationInfo: p.installationInfo,
  technologies: p.technologies as ProfileInput['technologies'],
  serviceAreaNames: p.serviceAreaNames,
});

beforeAll(async () => {
  db = await createPgliteDb(null);
  await syncRbac(db);
  await seedDemoCatalog(db);
  const [o, s] = await db
    .insert(users)
    .values([
      { email: 'owner@test.invalid', fullName: 'Owner', passwordHash: 'x' },
      { email: 'sales@test.invalid', fullName: 'Sales', passwordHash: 'x' },
    ])
    .returning({ id: users.id });
  owner = { userId: o!.id, roles: ['PROVIDER_OWNER'], providerId: 'demo-prov-001' };
  sales = { userId: s!.id, roles: ['PROVIDER_SALES'], providerId: 'demo-prov-001' };
}, 60_000);

describe('provider profile', () => {
  it('saves contact details and keeps PIC values out of the audit log', async () => {
    const [row] = await db.select().from(providers).where(eq(providers.id, 'demo-prov-001'));
    await updateOwnProfile(
      db,
      owner,
      { ...profileFrom(row!), picName: 'Siti Aminah', picPhone: '081234567890' },
      ctx,
    );
    const [after] = await db.select().from(providers).where(eq(providers.id, 'demo-prov-001'));
    expect(after).toMatchObject({ picName: 'Siti Aminah', picPhone: '081234567890' });
    const [log] = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.action, 'provider_profile_updated'));
    expect(JSON.stringify(log!.after)).not.toContain('Siti');
    expect(log!.after).toMatchObject({ picName: '[diubah]' });
  });

  it('locks the verified legal identity', async () => {
    const [row] = await db.select().from(providers).where(eq(providers.id, 'demo-prov-001'));
    await expect(
      updateOwnProfile(db, owner, { ...profileFrom(row!), legalName: 'PT Lain' }, ctx),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('validates the NIB format', async () => {
    const [row] = await db.select().from(providers).where(eq(providers.id, 'demo-prov-001'));
    await expect(
      updateOwnProfile(db, owner, { ...profileFrom(row!), nib: '12' }, ctx),
    ).rejects.toMatchObject({ details: { fieldErrors: { nib: expect.any(String) } } });
  });
});

describe('provider packages', () => {
  let newId: string;

  it('creates a draft with a unique slug and a starting price row', async () => {
    newId = (await createOwnPackage(db, owner, pkgInput(), ctx)).id;
    const second = (await createOwnPackage(db, owner, pkgInput(), ctx)).id;
    const rows = await db
      .select()
      .from(internetPackages)
      .where(eq(internetPackages.providerId, 'demo-prov-001'));
    const a = rows.find((r) => r.id === newId)!;
    const b = rows.find((r) => r.id === second)!;
    expect(a).toMatchObject({ status: 'DRAFT', slug: 'demo-provider-001-rumah-50', isDemo: true });
    expect(b.slug).toBe('demo-provider-001-rumah-50-2');
    const prices = await db
      .select()
      .from(packagePriceHistory)
      .where(eq(packagePriceHistory.packageId, newId));
    expect(prices).toHaveLength(1);
  });

  it('submits a complete draft for GMM review', async () => {
    await submitOwnPackage(db, owner, newId, ctx);
    const [row] = await db.select().from(internetPackages).where(eq(internetPackages.id, newId));
    expect(row!.status).toBe('PENDING_REVIEW');
  });

  it('a price change on a live package takes it off the marketplace and logs the price', async () => {
    const r = await updateOwnPackage(
      db,
      owner,
      'demo-pkg-102',
      pkgInput({
        name: 'Demo Rumah 75',
        description: 'Paket demo untuk keluarga dengan banyak perangkat dan video call.',
        downloadMbps: 75,
        uploadMbps: 75,
        monthlyPrice: 319_000,
        installationFee: 150_000,
        supportHours: '08.00–22.00 WIB',
        estInstallationDaysMin: 2,
        estInstallationDaysMax: 5,
        features: [{ label: 'Router', value: 'Dual-band, dipinjamkan (demo)' }],
      }),
      ctx,
    );
    expect(r.backToReview).toBe(true);
    const [row] = await db
      .select()
      .from(internetPackages)
      .where(eq(internetPackages.id, 'demo-pkg-102'));
    expect(row).toMatchObject({ status: 'PENDING_REVIEW', monthlyPrice: 319_000 });
    const prices = await db
      .select()
      .from(packagePriceHistory)
      .where(eq(packagePriceHistory.packageId, 'demo-pkg-102'));
    expect(prices.map((p) => p.monthlyPrice).sort()).toEqual([299_000, 319_000]);
  });

  it('a wording change on a live package keeps it live', async () => {
    const [row] = await db
      .select()
      .from(internetPackages)
      .where(eq(internetPackages.id, 'demo-pkg-101'));
    const r = await updateOwnPackage(
      db,
      owner,
      'demo-pkg-101',
      pkgInput({
        name: row!.name,
        description: 'Deskripsi baru',
        downloadMbps: row!.downloadMbps,
        uploadMbps: row!.uploadMbps,
        monthlyPrice: row!.monthlyPrice,
        installationFee: row!.installationFee,
        activationFee: row!.activationFee,
        routerIncluded: row!.routerIncluded,
        supportHours: row!.supportHours!,
        estInstallationDaysMin: row!.estInstallationDaysMin!,
        estInstallationDaysMax: row!.estInstallationDaysMax!,
        features: row!.features,
      }),
      ctx,
    );
    expect(r).toMatchObject({ changed: ['description'], backToReview: false });
  });

  it("cannot see or touch another provider's package", async () => {
    await expect(
      updateOwnPackage(db, owner, 'demo-pkg-201', pkgInput(), ctx),
    ).rejects.toMatchObject({ code: 'PACKAGE_NOT_FOUND' });
  });

  it('sales staff cannot manage packages', async () => {
    await expect(createOwnPackage(db, sales, pkgInput(), ctx)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});

describe('provider coverage zones', () => {
  it('adds a radius zone that the coverage engine uses, and can switch it off', async () => {
    const repo = createDbCatalogRepository(async () => db);
    const { id } = await addOwnRadiusZone(
      db,
      owner,
      { name: 'Uji Bogor', lat: -6.595, lng: 106.8166, radiusM: 2000, result: 'AVAILABLE' },
      ctx,
    );
    expect((await repo.listActiveZones()).some((z) => z.id === id)).toBe(true);
    await setOwnZoneStatus(db, owner, id, 'INACTIVE', ctx);
    expect((await repo.listActiveZones()).some((z) => z.id === id)).toBe(false);
    const logs = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.entityId, id), eq(auditLogs.action, 'coverage_changed')));
    expect(logs).toHaveLength(2);
  });

  it('matches a kecamatan zone for an address in one of its kelurahan', async () => {
    const repo = createDbCatalogRepository(async () => db);
    const { id } = await addOwnAdminAreaZone(
      db,
      owner,
      { regionCode: '32.73.01', name: 'Kec. Sukasari, Kota Bandung', result: 'REQUIRES_SURVEY' },
      ctx,
    );
    const zone = (await repo.listActiveZones()).find((z) => z.id === id)!;
    const at = (code: string) => ({
      point: { lat: -6.87, lng: 107.59 },
      regionCodes: regionChain(code),
      postalCode: null,
    });
    expect(zoneMatches(zone, at('32.73.01.1001'))).toBe(true);
    expect(zoneMatches(zone, at('32.73.02.1001'))).toBe(false);
  });

  it('only accepts a kecamatan or kelurahan for area zones', async () => {
    await expect(
      addOwnAdminAreaZone(
        db,
        owner,
        { regionCode: '32', name: 'Jawa Barat', result: 'AVAILABLE' },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('rejects points outside Indonesia', async () => {
    await expect(
      addOwnRadiusZone(
        db,
        owner,
        { name: 'Salah', lat: 40.7, lng: -74, radiusM: 1000, result: 'AVAILABLE' },
        ctx,
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
