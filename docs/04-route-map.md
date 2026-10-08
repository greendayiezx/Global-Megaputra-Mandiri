# 04 — Route Map

Legend — Render: `SSG` static, `ISR` incremental, `SSR` per request, `CSR` client island.
Auth: `public`, `customer`, `provider:<perm>`, `platform:<perm>`. Phase in brackets.

## Public website

| Route                                                                                         | Render        | Purpose / primary CTA                                                                                                             | Phase |
| --------------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `/`                                                                                           | ISR           | Hero + coverage search. CTA **"Cek Ketersediaan di Lokasi Saya"**, secondary **"Bandingkan Paket Internet"**                      | 1     |
| `/coverage`                                                                                   | SSR + CSR map | Address search / geolocation / pin → confirm location → results per provider with status + disclaimer                             | 1     |
| `/packages`                                                                                   | SSR           | Server-side filtered, paginated search (`?lat&lng&check=<coverageCheckId>&sort&...`)                                              | 1     |
| `/packages/[slug]`                                                                            | ISR           | Full package facts, full price breakdown, CTA "Pesan Paket Ini" (goes to coverage first if no location)                           | 1     |
| `/compare`                                                                                    | SSR           | Up to 4 packages (`?ids=a,b,c,d`), highlights with metric shown                                                                   | 1     |
| `/provider`                                                                                   | ISR           | Verified provider directory                                                                                                       | 1     |
| `/provider/[slug]`                                                                            | ISR           | Provider profile, badge (only if verified), service areas, packages, reviews                                                      | 1     |
| `/promotions`                                                                                 | ISR           | Active promotions with real dates/terms                                                                                           | 2     |
| `/about`, `/how-it-works`                                                                     | SSG           | Includes the published ranking formula                                                                                            | 1     |
| `/faq`                                                                                        | SSG           | CMS                                                                                                                               | 1     |
| `/blog`, `/blog/[slug]`                                                                       | ISR           | CMS                                                                                                                               | 2     |
| `/contact`                                                                                    | SSG + action  | Contact form (rate-limited, consent text)                                                                                         | 1     |
| `/terms`, `/privacy`, `/refund-policy`                                                        | SSG           | Versioned legal pages; "draft — pending legal review" banner until D15                                                            | 1     |
| `/internet/[province]`, `/internet/[city]`, `/wifi/[city]`, `/provider/[providerSlug]/[city]` | ISR           | SEO landing pages — generated **only** when ≥1 verified provider has published packages there; otherwise 404 (no thin/fake pages) | 2     |
| `/login`, `/register`, `/forgot-password`, `/verify`                                          | SSR           | Auth                                                                                                                              | 1     |
| `/mitra/daftar`                                                                               | SSR           | Provider application form                                                                                                         | 1     |

## Checkout

| Route                                             | Purpose                                                                                                                                                                                       | Phase |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| `/checkout/[packageSlug]?check=<coverageCheckId>` | Steps: review package → customer data → installation address (pre-filled from coverage) → coverage confirmation + disclaimer → preferred install dates → review & accept terms → create order | 1     |
| `/checkout/order/[orderNumber]/pay`               | Shows breakdown + "Bayar" → gateway hosted page                                                                                                                                               | 1     |
| `/checkout/order/[orderNumber]/result`            | Return URL; displays status read from server (never trusts query params)                                                                                                                      | 1     |

## Customer dashboard (`customer`)

`/dashboard`, `/dashboard/orders`, `/dashboard/orders/[id]`, `/dashboard/subscriptions`,
`/dashboard/invoices`, `/dashboard/payments`, `/dashboard/support`, `/dashboard/reviews`,
`/dashboard/profile`, `/dashboard/notifications` — Phase 1 for orders/order detail, rest Phase 2.

## Provider portal (`provider:*`)

`/provider-dashboard` (+ `/profile`, `/packages`, `/coverage`, `/orders`, `/installations`,
`/customers`, `/tickets`, `/leads`, `/commissions`, `/analytics`, `/users`, `/documents`).
Phase 1 minimum: profile, documents, packages, coverage, orders, installations. Rest Phase 2/3.

## Admin portal (`platform:*`)

`/admin` dashboard, then `/admin/providers`, `/admin/packages`, `/admin/coverage`,
`/admin/customers`, `/admin/orders`, `/admin/payments`, `/admin/refunds`,
`/admin/installations`, `/admin/tickets`, `/admin/reviews`, `/admin/promotions`,
`/admin/referrals`, `/admin/leads`, `/admin/cms`, `/admin/analytics`, `/admin/audit-logs`,
`/admin/settings`, `/admin/users`.

## REST API (contract detail in `docs/07-api-spec.md`, STEP 2+)

| Method & path                                             | Auth                                          | Phase |
| --------------------------------------------------------- | --------------------------------------------- | ----- |
| `GET /api/health`                                         | public                                        | 1     |
| `POST /api/coverage/check`                                | public, rate-limited                          | 1     |
| `GET /api/providers`, `GET /api/providers/:slug`          | public                                        | 1     |
| `GET /api/packages`, `GET /api/packages/:slug`            | public                                        | 1     |
| `POST /api/orders` (Idempotency-Key)                      | customer                                      | 1     |
| `GET /api/orders/:id`                                     | owner customer / assigned provider / platform | 1     |
| `POST /api/orders/:id/transitions`                        | per transition actor + RBAC                   | 1     |
| `POST /api/payments` (Idempotency-Key)                    | customer (own order)                          | 1     |
| `POST /api/payments/webhook/:gateway`                     | signature only                                | 1     |
| `POST /api/provider/apply`                                | authenticated user                            | 1     |
| `GET /api/provider/orders`, `GET /api/provider/analytics` | provider                                      | 1 / 2 |
| `POST /api/tickets`                                       | customer                                      | 2     |
| `POST /api/uploads/presign`                               | authenticated, per purpose                    | 1     |

All responses: `{ success: true, data }` or `{ success: false, error: { code, message } }`.
