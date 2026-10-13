import 'dotenv/config';

// Migrations go over a direct connection when one is given (Neon/Vercel set DATABASE_URL to the
// pooler and DATABASE_URL_UNPOOLED to the direct host); must run before the client is created.
if (process.env.DATABASE_URL_UNPOOLED) process.env.DATABASE_URL = process.env.DATABASE_URL_UNPOOLED;
// This script exists to migrate: the Postgres client only migrates on open when asked to.
process.env.DB_AUTO_MIGRATE = 'true';
const { getDb } = await import('../client');
const { syncRbac } = await import('../../modules/auth/application/bootstrap');

// Applies SQL migrations (getDb migrates on open) and syncs RBAC tables from code.
// With PGlite, stop `npm run dev` first: one process may open the data folder at a time.
const db = await getDb();
await syncRbac(db);
console.warn('migrations applied and RBAC synced');
process.exit(0);
