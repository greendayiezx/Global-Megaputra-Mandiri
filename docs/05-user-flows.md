# 05 — User Flows

## 1. Customer: location → active internet

```mermaid
flowchart TD
  A[Home / any page] -->|Cek Ketersediaan| B[Enter address / use GPS / drop pin]
  B --> C[Confirm pin on map<br/>pin = source of truth]
  C --> D{Coverage engine}
  D -->|≥1 orderable provider| E[Results: providers + packages<br/>status badge + survey disclaimer + last verified]
  D -->|none| N[Honest 'not available yet'<br/>offer: notify me with explicit consent]
  E --> F[Filter / sort / compare ≤4]
  F --> G[Package detail: full price breakdown]
  G --> H[Checkout: name, phone, email]
  H --> I[Installation address prefilled from pin + access notes]
  I --> J[Coverage confirmation + disclaimer]
  J --> K[Preferred installation dates]
  K --> L[Review: total today, monthly fee, every fee + accept terms]
  L --> M[Order created → PENDING_COVERAGE]
  M --> O{Provider confirms feasibility}
  O -->|rejects / unavailable| X[Customer notified with reason<br/>no money taken]
  O -->|confirms| P[Pay on gateway page]
  P -->|webhook PAID| Q[Provider assigned → schedule proposed]
  P -->|failed / expired| P2[Retry payment or cancel]
  Q --> R[Customer confirms slot]
  R --> S[Installation → QC]
  S -->|pass| T[ACTIVE + subscription created]
  S -->|fail| U[Reschedule or refund]
  T --> V[Review request]
```

"Customer should know what to do next": every order state has exactly one primary
next action in the dashboard (e.g. _Bayar sekarang_, _Pilih jadwal_, _Tunggu teknisi_).

## 2. Provider onboarding & operations

```mermaid
flowchart TD
  A[/mitra/daftar: company + PIC + contact/] --> B[Account created, provider PENDING]
  B --> C[Upload documents to private storage]
  C --> D[Submit → UNDER_REVIEW]
  D --> E{Admin review}
  E -->|missing docs| C
  E -->|rejected + reason| F[REJECTED → fix & resubmit]
  F --> C
  E -->|approved| G[VERIFIED — badge shown]
  G --> H[Define coverage zones / service areas]
  G --> I[Create packages → submit for review]
  I --> J{Admin approves package}
  J -->|yes| K[PUBLISHED — visible in marketplace]
  K --> L[Receive order → confirm or reject with reason]
  L --> M[After payment: assign technician, propose slots]
  M --> N[Technician: start, complete, QC]
  N --> O[Activation → customer active, MRR & commission reporting]
```

The provider cannot go live (no public profile, no packages) until `VERIFIED`.

## 3. Admin

```mermaid
flowchart LR
  Q1[Provider verification queue] --> V[Check docs via signed URLs<br/>approve / reject with reason → audited]
  Q2[Package review queue] --> P[Approve / send back / suspend → audited]
  Q3[Coverage management] --> Z[Draw / import zones, set result & verified date → audited]
  Q4[Orders] --> O[Full lifecycle view: history, payments, installation]
  Q5[Payments] --> R[Reconciliation, flagged late payments, mismatches]
  R --> RF[Refund request → second approver → gateway refund → audited]
  Q6[Settings] --> S[Tax rate, billing policy, SLA, retention → audited]
```

## 4. Payment

```mermaid
sequenceDiagram
  participant C as Customer
  participant G as GMM API
  participant DB as Postgres
  participant PG as Payment gateway
  C->>G: POST /api/payments (Idempotency-Key)
  G->>DB: verify order PENDING_PAYMENT, amount from price_snapshot
  G->>PG: createPayment(paymentId, amount)
  PG-->>G: gatewayRef, checkoutUrl
  G->>DB: insert payments (PENDING)
  G-->>C: redirect to checkoutUrl
  C->>PG: pays (VA / QRIS / e-wallet / card on gateway page)
  PG->>G: webhook (signed)
  G->>G: verifyWebhook(raw body) — reject 401 if invalid
  G->>DB: insert payment_webhooks (unique gateway+event_id) — duplicate → 200 no-op
  G->>DB: TX: reducePaymentStatus → payment_transactions → order PAID → history → audit → outbox
  G-->>PG: 200
  C->>G: return URL → status read from DB, never from query string
  Note over G,PG: Reconciliation job polls getPaymentStatus() for PENDING payments past expectations
```

## 5. Coverage check

```mermaid
sequenceDiagram
  participant U as Customer
  participant W as Web (RSC)
  participant API as Coverage use case
  participant R as Redis
  participant DB as PostGIS
  U->>W: address / GPS / pin
  W->>API: POST /api/coverage/check {lat,lng,address parts}
  API->>API: validate, rate-limit per IP/session
  API->>R: cache lookup (rounded point)
  alt cache miss
    API->>DB: zones where ST_Covers / ST_DWithin / region / postal match
    API->>API: evaluateProviderCoverage() per provider
    API->>DB: eligible packages (verified provider, published, not expired)
    API->>R: cache short TTL
  end
  API->>DB: insert coverage_checks (analytics + order linkage)
  API-->>W: per-provider status, packages, disclaimer, last verified dates
```

## 6. Notifications

```mermaid
flowchart LR
  UC[Use case TX] -->|outbox_events row| OB[(outbox)]
  OB --> D[Dispatcher job]
  D --> T[Template lookup<br/>event × channel × locale]
  T --> P{User preferences + consent}
  P --> E[Email adapter]
  P --> W[WhatsApp adapter]
  P --> S[SMS adapter]
  P --> I[In-app notifications row]
  E & W & S --> L[notifications row: status, vendor id, retries]
```

Business logic only emits events (`order_created`, `payment_success`, …); templates and
channel selection live in data, not code.
