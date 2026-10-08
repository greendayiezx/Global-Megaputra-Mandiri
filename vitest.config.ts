import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/tests/integration/**', 'src/tests/e2e/**'],
          environment: 'node',
        },
      },
      {
        resolve: { alias },
        test: {
          name: 'integration',
          include: ['src/tests/integration/**/*.test.ts'],
          environment: 'node',
          // Integration tests share one Postgres; run files serially.
          fileParallelism: false,
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/domain/**', 'src/lib/**'],
    },
  },
});
