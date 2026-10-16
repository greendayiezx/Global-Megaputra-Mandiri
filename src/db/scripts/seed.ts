import 'dotenv/config';
import { getDb } from '../client';
import { allowsDemoAccounts } from '../../lib/app-env';
import {
  DEMO_ACCOUNTS,
  seedDemoAccounts,
  syncRbac,
} from '../../modules/auth/application/bootstrap';
import { seedDemoCatalog } from '../../modules/packages/infrastructure/seed-demo-catalog';

if (!allowsDemoAccounts()) {
  console.error(
    'Refusing to seed demo data here (production). Staging needs APP_ENV=staging and APP_SHOW_DEMO_DATA=true.',
  );
  process.exit(1);
}
const db = await getDb();
await syncRbac(db);
await seedDemoCatalog(db);
await seedDemoAccounts(db);
console.warn(`demo catalog and accounts ready: ${DEMO_ACCOUNTS.map((a) => a.email).join(', ')}`);
process.exit(0);
