import { eq } from 'drizzle-orm';
import { beforeAll, describe, expect, it } from 'vitest';
import { createPgliteDb, type Db } from '@/db/client';
import { internetPackages, packagePriceHistory } from '@/db/schema';
import { createDbCatalogRepository } from '@/modules/packages/infrastructure/db-catalog';
import { demoCatalogRepository } from '@/modules/packages/infrastructure/demo-catalog';
import { seedDemoCatalog } from '@/modules/packages/infrastructure/seed-demo-catalog';

let db: Db;
const repo = () => createDbCatalogRepository(async () => db);
const byId = <T extends { id: string }>(xs: T[]) =>
  [...xs].sort((a, b) => a.id.localeCompare(b.id));

beforeAll(async () => {
  db = await createPgliteDb(null);
  await seedDemoCatalog(db);
}, 60_000);

describe('database catalog', () => {
  it('reads back exactly the demo catalog the site used before', async () => {
    const r = repo();
    expect(byId(await r.listProviders())).toEqual(
      byId(await demoCatalogRepository.listProviders()),
    );
    expect(byId(await r.listPackages())).toEqual(byId(await demoCatalogRepository.listPackages()));
    expect(byId(await r.listActiveZones())).toEqual(
      byId(await demoCatalogRepository.listActiveZones()),
    );
  });

  it('records a starting price for every seeded package', async () => {
    const prices = await db.select().from(packagePriceHistory);
    expect(prices).toHaveLength((await demoCatalogRepository.listPackages()).length);
  });

  it('re-seeding keeps edits made through the portals', async () => {
    await db
      .update(internetPackages)
      .set({ monthlyPrice: 211_000 })
      .where(eq(internetPackages.id, 'demo-pkg-101'));
    await seedDemoCatalog(db);
    const [row] = await db
      .select({ price: internetPackages.monthlyPrice })
      .from(internetPackages)
      .where(eq(internetPackages.id, 'demo-pkg-101'));
    expect(row!.price).toBe(211_000);
    // No duplicate price rows from the second run.
    const prices = await db.select().from(packagePriceHistory);
    expect(prices).toHaveLength((await demoCatalogRepository.listPackages()).length);
  });
});
