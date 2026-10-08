# 00 — Product Scope, Assumptions & Open Business Decisions

Status: **STEP 1 (foundation)** — living document. Every item marked
`TODO_BUSINESS_DECISION` must be resolved by GMM management/legal before the
corresponding module goes to production. Until then, the code reads the value
from `system_settings` (or a typed config) and **never hardcodes a guessed value**.

## 1. Product statement

GMM (Global Megaputra Mandiri) is an independent marketplace that answers two questions:

| Audience | Core question                                                                                                  | What the system must prove                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Customer | "Provider internet apa yang benar-benar bisa dipasang di lokasi saya, berapa total biayanya, dan kapan aktif?" | Location-based availability (with honest uncertainty), full price transparency, tracked order → activation lifecycle |
| Provider | "Berapa pelanggan berkualitas yang GMM bisa berikan kepada saya?"                                              | Attributable leads/orders, conversion funnel, activation & MRR reporting                                             |

GMM is **not** affiliated with any other marketplace. The business model (location
search → compare → order → install) is a common industry pattern; all branding,
copy, data model, and implementation in this repository are original.

## 2. Tech stack decision

| Concern                    | Choice                                                                            | Why                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| App framework              | Next.js (App Router) + React Server Components, TypeScript strict                 | SSR/SSG for SEO pages, server-only code by default, one deployable            |
| Architecture               | Modular monolith (`src/modules/<domain>/{domain,application,infrastructure,api}`) | Clear boundaries without microservice overhead at MVP scale                   |
| Database                   | PostgreSQL 17 + **PostGIS**                                                       | Polygon/radius coverage queries need spatial indexes (GiST)                   |
| ORM / migrations           | Drizzle ORM + drizzle-kit SQL migrations (committed, reviewed)                    | Typed queries, raw SQL escape hatch for PostGIS, no uncontrolled schema drift |
| Validation                 | Zod at every boundary (HTTP, server actions, webhooks, env)                       | Single source for request/response schemas                                    |
| Cache / rate limit / queue | Redis                                                                             | Rate limiting, cached coverage results, job queue                             |
| Object storage             | S3-compatible (MinIO locally)                                                     | Private buckets + signed URLs for documents                                   |
| Auth                       | First-party session auth (argon2id, HttpOnly cookies, DB-backed sessions)         | Full control over RBAC + audit; no third-party PII sharing                    |
| Tests                      | Vitest (unit, integration) + Playwright (E2E)                                     | Test pyramid                                                                  |
| Logging                    | pino (structured JSON, PII redaction)                                             | Observability                                                                 |

## 3. Scope by phase (from the brief, condensed)

- **Phase 0** — spec, architecture, ERD, flows, technical setup ← _this step_
- **Phase 1** — public marketplace, provider, package, coverage, customer, order, payment, installation, admin
- **Phase 2** — provider portal, customer portal, support, reviews, notifications, promotions
- **Phase 3** — referral, lead management, analytics funnel, recurring billing
- **Phase 4** — advanced coverage, AI recommendation/support, PWA, provider API integration

Phase 3/4 tables appear in the ERD so the model is coherent, but their migrations
are **not** created until Phase 1 is stable.

## 4. Assumptions (made explicitly, reversible)

| #   | Assumption                                                                                                                                                                                   | Impact if wrong                                                                              |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A1  | All money is IDR, stored as **integer rupiah** (no sub-unit).                                                                                                                                | Multi-currency would need a currency column per amount (already present on orders/payments). |
| A2  | GMM collects the customer's initial payment through its own payment gateway account (GMM is the merchant on the checkout).                                                                   | If providers collect directly, the payment module becomes "payment link relay" only. See D1. |
| A3  | Recurring monthly billing after activation is handled by the **provider** in Phase 1; GMM shows it as information. GMM-managed recurring billing is Phase 3.                                 | Subscription/invoice tables exist but are informational in Phase 1.                          |
| A4  | A coverage match is a **probability signal, never a guarantee**. Every coverage result in the UI carries the survey disclaimer.                                                              | — (this is a hard product rule, not really an assumption)                                    |
| A5  | Customer data collected by default = full name, phone, email, installation address, coordinates. No KTP/NIK unless D7 says a provider legally requires it.                                   | —                                                                                            |
| A6  | Locale: Indonesian (`id-ID`) primary UI, English secondary for internal docs. Timezone stored as UTC, displayed in `Asia/Jakarta` unless the address is in WITA/WIT (derived from province). | —                                                                                            |
| A7  | Administrative area codes follow the Kemendagri (Permendagri) region code hierarchy. The dataset must be imported from an official source; it is **not** seeded with invented codes.         | Coverage by admin area depends on it.                                                        |
| A8  | A provider can have many users; one user can belong to at most one provider in Phase 1.                                                                                                      | Relaxing it needs an "active provider" switcher in the portal.                               |

## 5. Open business decisions — `TODO_BUSINESS_DECISION`

| ID  | Decision needed                                                                                                                                                                                | Where it is used                               | Safe default until decided                                                                                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Money flow: does GMM hold customer funds and settle to providers (and on what schedule / fee), or does the provider collect? Requires legal review against Bank Indonesia payment regulations. | payments, settlements, commissions             | Payments module built behind `PaymentProvider` interface; **no settlement automation** until decided.                                   |
| D2  | GMM revenue model: commission per activation? % of first month? listing fee? lead fee?                                                                                                         | commissions, provider portal "commission" page | `commission_rules` table with no seeded rule; calculation code is generic.                                                              |
| D3  | VAT (PPN) treatment and rate shown to customers; whether GMM or the provider is the taxable party for each line. Must be confirmed by a tax consultant.                                        | pricing engine                                 | `system_settings.tax.rate_bps` is **unset** → order creation is blocked with `CONFIGURATION_MISSING` rather than guessing.              |
| D4  | Is the first month's subscription fee charged up-front at checkout, or only installation/activation fees?                                                                                      | pricing engine "Total today"                   | `system_settings.billing.charge_first_month_upfront` — no default; must be set.                                                         |
| D5  | Must the provider confirm feasibility **before** the customer pays (state `PENDING_PROVIDER_CONFIRMATION`) for every order, or only for `LIMITED` / `REQUIRES_SURVEY` coverage?                | order state machine                            | Pre-payment confirmation **required for all orders** (safest for the customer: never pay before feasibility is confirmed).              |
| D6  | Refund policy: full refund windows, non-refundable fees, refunds after activation, who funds refunds (GMM vs provider).                                                                        | refunds, `/refund-policy` page                 | Refund allowed only before `ACTIVE`; after activation → `REFUND_NOT_ALLOWED` unless policy changes. All refunds need 2-person approval. |
| D7  | Which providers (if any) are legally required to collect KTP/NIK for subscriber registration, and at which step.                                                                               | customer data, order flow                      | Not collected.                                                                                                                          |
| D8  | Ticket SLA targets per priority (first response / resolution).                                                                                                                                 | support                                        | SLA timers stored but targets read from settings; unset → timers shown without breach alerts.                                           |
| D9  | Data retention periods per data category (coverage searches, abandoned orders, leads, tickets, documents). Must align with UU PDP (UU 27/2022).                                                | jobs/retention                                 | Retention job exists but does nothing until periods are configured.                                                                     |
| D10 | Review policy: who may review (only `ACTIVE` customers?), moderation rules, provider right-of-reply.                                                                                           | reviews                                        | Only customers whose order reached `ACTIVE` can review; reviews are moderated before publish.                                           |
| D11 | Referral commission rules, payout minimum, tax withholding (PPh) on partner payouts.                                                                                                           | referrals (Phase 3)                            | Not built in Phase 1.                                                                                                                   |
| D12 | Provider priority / "recommended" sort: what is allowed to influence ranking (paid placement? quality metrics?). Any paid placement must be labelled as such.                                  | search                                         | `recommended` = deterministic, documented formula (see business rules §6); no paid boost.                                               |
| D13 | Coverage data freshness: after how many days without re-verification should an `AVAILABLE` zone be downgraded to `REQUIRES_SURVEY`?                                                            | coverage engine                                | Setting `coverage.stale_after_days` unset → no downgrade, but `last verified` is always displayed.                                      |
| D14 | Installation time windows offered to customers (slots per day, lead time, provider-specific calendars).                                                                                        | installations                                  | Provider proposes slots; customer chooses; no global slot template.                                                                     |
| D15 | Legal entity details for Terms/Privacy/Refund pages (PT name, address, NPWP, DPO contact).                                                                                                     | CMS legal pages                                | Pages render a visible "draft — pending legal review" banner.                                                                           |

## 6. Things the system must never fake

Providers, prices, coverage, ratings, reviews, SLAs, customer counts, transaction
volumes, legal certifications, urgency/scarcity. Demo/seed data is always named
`Demo Provider 00X`, carries `is_demo = true`, and is excluded from production
public listings by a database-level filter (`NOT is_demo` unless `APP_SHOW_DEMO_DATA=true`).
