import { defineConfig } from 'drizzle-kit';

// Migrations are generated from the schema and committed; never edited by hand after merge.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  strict: true,
});
