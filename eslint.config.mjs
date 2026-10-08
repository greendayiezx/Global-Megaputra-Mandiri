import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'dist/**',
      'src/db/migrations/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      // App Router only; this rule targets the Pages Router.
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Domain layers stay pure: no framework, DB, or vendor SDK imports.
    files: ['src/modules/*/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['next', 'next/*', 'react', 'react-dom'],
              message: 'Domain code must not depend on the UI framework.',
            },
            {
              group: ['drizzle-orm', 'drizzle-orm/*', 'postgres', 'ioredis'],
              message: 'Domain code must not do I/O.',
            },
            { group: ['@aws-sdk/*'], message: 'Vendor SDKs belong in infrastructure adapters.' },
            {
              group: [
                '@/modules/*/application/*',
                '@/modules/*/infrastructure/*',
                '@/modules/*/api/*',
              ],
              message: 'Domain may only import other modules’ domain code.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
