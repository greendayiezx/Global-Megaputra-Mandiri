# GMM — Global Megaputra Mandiri

Independent internet provider marketplace: customers find providers that actually serve
their location, compare full costs, and order; providers get qualified customers.

## Run locally (no Docker needed)

```bash
npm install
npm run dev          # http://localhost:3000
```

On first start the app creates an embedded PostgreSQL database (PGlite) in `.data/pglite`,
applies the SQL migrations, syncs roles/permissions, and creates demo accounts.

### Demo accounts (development only — never created in production)

| Email                        | Role                                                       |
| ---------------------------- | ---------------------------------------------------------- |
| `pelanggan@demo.gmm.invalid` | CUSTOMER → `/dashboard`                                    |
| `provider@demo.gmm.invalid`  | PROVIDER_OWNER (Demo Provider 001) → `/provider-dashboard` |
| `admin@demo.gmm.invalid`     | SUPER_ADMIN → `/admin`                                     |

Password for all: `GmmDemo#2026`. All providers, packages, prices and coverage zones are
labelled **DEMO** and are not real offers.

## Scripts

| Command                                       | Purpose                                                               |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `npm run verify`                              | format check, lint, typecheck, unit + integration tests               |
| `npm test` / `npm run test:integration`       | unit tests / database tests (in-memory PGlite)                        |
| `npm run db:generate`                         | generate a SQL migration from schema changes (review & commit it)     |
| `npm run db:migrate` / `db:seed` / `db:reset` | stop `npm run dev` first when using PGlite                            |
| `npm run docs:rbac`                           | regenerate `docs/06-rbac-matrix.md` from code (a test fails if stale) |

## Documentation

`docs/00` scope & open business decisions (`TODO_BUSINESS_DECISION`) · `01` architecture ·
`02` ERD · `03` business rules · `04` route map · `05` user flows · `06` RBAC matrix ·
`GMM-Dokumentasi-Setup-Docker.docx` (Docker setup, on hold).

## Current status

- STEP 1 — architecture, ERD, business rules (pure, tested domain code) ✅
- STEP 2 — authentication (argon2id, DB sessions, HttpOnly cookies, lockout, rate limit) and
  RBAC (11 roles, scoped permissions, server-side guards, audit log) ✅
- Public marketplace UI on demo data (coverage map, search, compare, provider pages) ✅
- Not yet: provider/package/coverage persistence (STEP 3), orders (5), payments (6), installations (7).

Known limits while Docker is on hold: rate limiting is in-memory (single process); address
text is not geocoded — the map pin decides coverage.
