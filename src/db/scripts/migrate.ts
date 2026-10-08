import 'dotenv/config';
import { getDb } from '../client';
import { syncRbac } from '../../modules/auth/application/bootstrap';

// Applies SQL migrations (getDb migrates on open) and syncs RBAC tables from code.
// With PGlite, stop `npm run dev` first: one process may open the data folder at a time.
const db = await getDb();
await syncRbac(db);
console.warn('migrations applied and RBAC synced');
process.exit(0);
