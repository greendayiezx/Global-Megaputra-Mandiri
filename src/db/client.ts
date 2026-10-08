import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema';

/**
 * One database type for the whole app, regardless of driver:
 * - `pglite`  : embedded PostgreSQL (WASM) stored in a local folder — no Docker needed (dev/test).
 * - `postgres`: a real PostgreSQL server via DATABASE_URL (staging/production).
 * Same schema, same SQL migrations; switching is a configuration change only.
 */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export { schema };

export const MIGRATIONS_FOLDER = resolve(process.cwd(), 'src/db/migrations');

type Driver = 'pglite' | 'postgres';

function driverFromEnv(): Driver {
  const raw = process.env.DB_DRIVER ?? (process.env.DATABASE_URL ? 'postgres' : 'pglite');
  if (raw !== 'pglite' && raw !== 'postgres')
    throw new Error('DB_DRIVER must be pglite or postgres');
  if (raw === 'pglite' && process.env.NODE_ENV === 'production') {
    throw new Error('PGlite is for local development only; set DB_DRIVER=postgres in production');
  }
  return raw;
}

/** `dataDir` null = in-memory (tests). */
export async function createPgliteDb(dataDir: string | null): Promise<Db> {
  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const { migrate } = await import('drizzle-orm/pglite/migrator');
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const client = dataDir ? new PGlite(dataDir) : new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  return db as unknown as Db;
}

async function createPostgresDb(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required when DB_DRIVER=postgres');
  const postgres = (await import('postgres')).default;
  const { drizzle } = await import('drizzle-orm/postgres-js');
  const db = drizzle(postgres(url, { max: 10 }), { schema });
  if (process.env.DB_AUTO_MIGRATE === 'true') {
    const { migrate } = await import('drizzle-orm/postgres-js/migrator');
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  }
  return db as unknown as Db;
}

// Survive Next.js dev hot reloads: PGlite allows a single open instance per data folder.
const globalForDb = globalThis as unknown as { __gmmDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!globalForDb.__gmmDb) {
    const driver = driverFromEnv();
    globalForDb.__gmmDb = (
      driver === 'pglite'
        ? createPgliteDb(resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? '.data/pglite'))
        : createPostgresDb()
    ).catch((err) => {
      globalForDb.__gmmDb = undefined;
      throw err;
    });
  }
  return globalForDb.__gmmDb;
}

export async function pingDb(db: Db): Promise<boolean> {
  const { sql } = await import('drizzle-orm');
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch {
    return false;
  }
}
