import 'dotenv/config';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

// Deletes the local PGlite database folder. Never touches a real Postgres server.
if (process.env.NODE_ENV === 'production' || (process.env.DB_DRIVER ?? 'pglite') !== 'pglite') {
  console.error('db:reset only works for the local PGlite database.');
  process.exit(1);
}
const dir = resolve(process.cwd(), process.env.PGLITE_DATA_DIR ?? '.data/pglite');
rmSync(dir, { recursive: true, force: true });
console.warn(`removed ${dir} — it is recreated with migrations on next start`);
