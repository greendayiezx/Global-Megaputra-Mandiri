import 'dotenv/config';
import { getDb } from '../client';
import {
  DEMO_ACCOUNTS,
  seedDemoAccounts,
  syncRbac,
} from '../../modules/auth/application/bootstrap';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed demo data in production.');
  process.exit(1);
}
const db = await getDb();
await syncRbac(db);
await seedDemoAccounts(db);
console.warn(`demo accounts ready: ${DEMO_ACCOUNTS.map((a) => a.email).join(', ')}`);
process.exit(0);
