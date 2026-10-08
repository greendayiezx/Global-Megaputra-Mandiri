# 02 — Database ERD

PostgreSQL 17 + PostGIS. All ids are `uuid` (v7, time-ordered) unless noted. Every
primary entity has `created_at timestamptz not null default now()` and
`updated_at timestamptz not null` (maintained by the app + trigger). Money columns
are `bigint` rupiah. Enum-like columns are Postgres enums created by migrations.

Legend for data classification (UU PDP separation, see §8):
`[C]` customer personal data · `[P]` provider business data · `[F]` financial · `[I]` internal

## 1. Identity & access

```mermaid
erDiagram
  users ||--o{ user_roles : has
  roles ||--o{ user_roles : grants
  roles ||--o{ role_permissions : has
  permissions ||--o{ role_permissions : in
  users ||--o{ sessions : has
  users ||--o| customers : "is (optional)"
  users ||--o| provider_users : "is (optional)"

  users {
    uuid id PK
    citext email UK "C"
    text phone UK "C, E.164"
    text password_hash "argon2id"
    text full_name "C"
    enum status "ACTIVE|LOCKED|DISABLED"
    timestamptz email_verified_at
    timestamptz phone_verified_at
    int failed_login_count
    timestamptz locked_until
    timestamptz last_login_at
    timestamptz deleted_at "soft delete + anonymise"
  }
  roles {
    uuid id PK
    text key UK "SUPER_ADMIN, PROVIDER_OWNER, ..."
    enum scope "PLATFORM|PROVIDER|CUSTOMER|PARTNER"
  }
  permissions {
    uuid id PK
    text key UK "provider.verify, order.read.own, ..."
  }
  role_permissions { uuid role_id FK  uuid permission_id FK }
  user_roles { uuid user_id FK  uuid role_id FK  uuid granted_by FK }
  sessions {
    uuid id PK
    uuid user_id FK
    text token_hash UK "sha256 of cookie token"
    timestamptz expires_at
    timestamptz revoked_at
    inet ip
    text user_agent
  }
```

## 2. Providers, coverage, packages

```mermaid
erDiagram
  providers ||--o{ provider_users : employs
  providers ||--o{ provider_documents : uploads
  providers ||--o| provider_bank_accounts : "settles to"
  providers ||--o{ provider_status_history : logs
  providers ||--o{ service_areas : declares
  providers ||--o{ coverage_zones : owns
  service_areas ||--o{ coverage_zones : groups
  providers ||--o{ internet_packages : offers
  internet_packages ||--o{ package_features : has
  internet_packages ||--o{ package_coverage_zones : "restricted to"
  coverage_zones ||--o{ package_coverage_zones : ""
  internet_packages ||--o{ package_price_history : logs
  providers ||--o{ promotions : funds
  internet_packages ||--o{ promotions : "targets (optional)"
  admin_regions ||--o{ admin_regions : parent

  providers {
    uuid id PK
    text slug UK
    text display_name "P"
    text legal_name "P"
    enum business_type "PT|CV|KOPERASI|OTHER"
    text nib "P, Nomor Induk Berusaha"
    text description
    text logo_key "public bucket"
    text cover_key "public bucket"
    text website
    text pic_name "P (personal data of PIC)"
    text pic_phone "P"
    text pic_email "P"
    text support_phone
    text support_email
    jsonb support_hours
    text sla_summary "provider-declared, shown as such"
    text_arr technologies "FIBER|WIRELESS|..."
    enum verification_status "PENDING|UNDER_REVIEW|VERIFIED|REJECTED|SUSPENDED"
    timestamptz verified_at
    uuid verified_by FK
    timestamptz last_reviewed_at
    int listing_priority "admin-set, documented"
    bool is_demo
    timestamptz deleted_at
  }
  provider_users {
    uuid provider_id FK
    uuid user_id FK "UK: one provider per user (A8)"
    uuid role_id FK "PROVIDER_* role"
    enum status "INVITED|ACTIVE|DISABLED"
  }
  provider_documents {
    uuid id PK
    uuid provider_id FK
    enum type "NIB|AKTA|NPWP|ISP_LICENSE|BANK_PROOF|PIC_ID|OTHER"
    text storage_key "private bucket"
    text mime
    int size_bytes
    text sha256
    enum status "UPLOADED|UNDER_REVIEW|VERIFIED|REJECTED|EXPIRED"
    timestamptz uploaded_at
    uuid uploaded_by FK
    timestamptz verified_at
    uuid verified_by FK
    text rejection_reason
    date valid_until
  }
  provider_bank_accounts {
    uuid id PK
    uuid provider_id FK
    text bank_code "F"
    bytea account_number_enc "F, app-level AES-GCM"
    text account_number_last4 "F"
    text account_holder "F"
    timestamptz verified_at
  }
  provider_status_history {
    uuid id PK
    uuid provider_id FK
    enum from_status
    enum to_status
    uuid actor_id FK
    text reason
  }
  admin_regions {
    text code PK "Kemendagri code, imported"
    enum level "PROVINCE|CITY|DISTRICT|SUBDISTRICT"
    text name
    text parent_code FK
    geography boundary "optional MultiPolygon"
  }
  service_areas {
    uuid id PK
    uuid provider_id FK
    text name
    text region_code FK "admin_regions"
    enum status "ACTIVE|INACTIVE"
  }
  coverage_zones {
    uuid id PK
    uuid provider_id FK
    uuid service_area_id FK "nullable"
    text name
    enum strategy "POLYGON|RADIUS|ADMIN_AREA|MANUAL_ZONE|CUSTOM"
    geography geom "MultiPolygon, GiST (POLYGON, CUSTOM)"
    geography center "Point, GiST (RADIUS)"
    int radius_m "RADIUS"
    text region_code "ADMIN_AREA"
    text_arr postal_codes "MANUAL_ZONE"
    enum result "AVAILABLE|LIMITED|REQUIRES_SURVEY|EXCLUDED"
    text_arr technologies
    enum status "DRAFT|ACTIVE|INACTIVE"
    timestamptz last_verified_at
    text source "ADMIN|PROVIDER|IMPORT"
    uuid created_by FK
  }
  internet_packages {
    uuid id PK
    uuid provider_id FK
    text name
    text slug UK "unique per provider"
    text description
    int download_mbps
    int upload_mbps
    enum technology
    bigint monthly_price "F"
    bigint installation_fee "F"
    bigint activation_fee "F"
    bool tax_included
    int contract_months "0 = no contract"
    bool router_included
    text fup_policy "null = no FUP stated"
    text sla_summary
    text support_hours
    int est_installation_days_min
    int est_installation_days_max
    enum status "DRAFT|PENDING_REVIEW|PUBLISHED|SUSPENDED|EXPIRED|ARCHIVED"
    timestamptz published_at
    timestamptz verified_at
    timestamptz last_price_verified_at
    timestamptz valid_until "auto-expire"
    bool is_demo
  }
  package_features { uuid id PK  uuid package_id FK  text label  text value  int sort }
  package_coverage_zones { uuid package_id FK  uuid coverage_zone_id FK }
  package_price_history {
    uuid id PK
    uuid package_id FK
    bigint monthly_price
    bigint installation_fee
    bigint activation_fee
    bool tax_included
    uuid changed_by FK
    timestamptz effective_at
  }
  promotions {
    uuid id PK
    text code UK "nullable = auto-applied"
    text name
    uuid provider_id FK "nullable = GMM-wide"
    uuid package_id FK "nullable"
    enum target "FIRST_MONTH|INSTALLATION_FEE|ACTIVATION_FEE"
    enum type "PERCENT|FIXED"
    int value "bps or rupiah"
    bigint max_amount
    enum funded_by "GMM|PROVIDER"
    timestamptz starts_at
    timestamptz ends_at
    int quota "nullable = unlimited, real number only"
    int redeemed_count
    enum status "DRAFT|ACTIVE|PAUSED|ENDED"
    text terms
  }
```

## 3. Customers, coverage checks, orders, installations

```mermaid
erDiagram
  customers ||--o{ customer_addresses : has
  customers ||--o{ orders : places
  coverage_checks ||--o{ orders : "evidence for"
  orders ||--|{ order_items : contains
  orders ||--|{ order_status_history : logs
  orders ||--o| installations : requires
  installations ||--o{ installation_schedules : proposes
  orders ||--o| subscriptions : creates
  orders ||--o{ payments : "paid by"
  providers ||--o{ orders : receives
  internet_packages ||--o{ orders : "ordered as"

  customers {
    uuid id PK
    uuid user_id FK UK
    text full_name "C"
    text phone "C"
    citext email "C"
    timestamptz marketing_consent_at "C, opt-in only"
    timestamptz deleted_at
  }
  customer_addresses {
    uuid id PK
    uuid customer_id FK
    text label
    text formatted_address "C"
    text province_code
    text city_code
    text district_code
    text subdistrict_code
    text postal_code
    geography location "Point, C"
    text access_notes "C, e.g. building/floor"
    bool is_default
  }
  coverage_checks {
    uuid id PK
    uuid user_id FK "nullable (anonymous)"
    text anon_session_id
    geography location "C, retention D9"
    text formatted_address "C"
    text province_code
    text city_code
    text district_code
    text subdistrict_code
    text postal_code
    enum overall_result
    int providers_available
    jsonb provider_results "provider_id -> status, zone ids"
    enum source "SEARCH|GEOLOCATION|PIN"
  }
  orders {
    uuid id PK
    text order_number UK "GMM-YYMMDD-XXXXXX"
    uuid customer_id FK
    uuid provider_id FK
    uuid package_id FK
    uuid address_id FK
    jsonb address_snapshot "C, frozen at order"
    uuid coverage_check_id FK
    enum coverage_result_at_order
    enum status "order state machine"
    jsonb price_snapshot "F, frozen pricing breakdown"
    bigint total_due_today "F"
    bigint recurring_monthly "F"
    text currency "IDR"
    text terms_version
    timestamptz terms_accepted_at
    uuid referral_code_id FK "Phase 3"
    text cancel_reason
  }
  order_items {
    uuid id PK
    uuid order_id FK
    enum kind "MONTHLY_FEE|INSTALLATION_FEE|ACTIVATION_FEE|OTHER_FEE|PROMOTION|DISCOUNT|TAX"
    text description
    bigint amount "F, negative for reductions"
    bool recurring
    bool due_today
    uuid promotion_id FK
  }
  order_status_history {
    uuid id PK
    uuid order_id FK
    enum from_status "nullable for creation"
    enum to_status
    uuid actor_id FK "nullable = SYSTEM"
    enum actor_kind "CUSTOMER|PROVIDER|PLATFORM|SYSTEM"
    text reason
    jsonb metadata
    timestamptz created_at
  }
  installations {
    uuid id PK
    uuid order_id FK UK
    uuid provider_id FK
    uuid technician_user_id FK
    enum status "PENDING_SCHEDULE|SCHEDULED|IN_PROGRESS|QC|COMPLETED|FAILED|CANCELLED"
    jsonb survey_result
    text failure_reason
    timestamptz started_at
    timestamptz completed_at
    timestamptz qc_passed_at
    uuid qc_by FK
  }
  installation_schedules {
    uuid id PK
    uuid installation_id FK
    timestamptz slot_start
    timestamptz slot_end
    enum status "PROPOSED|CONFIRMED|RESCHEDULED|CANCELLED|MISSED"
    uuid proposed_by FK
    timestamptz confirmed_at
  }
  subscriptions {
    uuid id PK
    uuid order_id FK UK
    uuid customer_id FK
    uuid provider_id FK
    uuid package_id FK
    enum status "PENDING_ACTIVATION|ACTIVE|SUSPENDED|CANCELLED"
    bigint monthly_price "F, snapshot"
    enum billed_by "PROVIDER|GMM"
    timestamptz activated_at
    date next_billing_date
  }
```

## 4. Payments & billing (financial — never soft-deleted, append-only where noted)

```mermaid
erDiagram
  payments ||--o{ payment_transactions : records
  payments ||--o{ payment_webhooks : receives
  payments ||--o{ refunds : "refunded by"
  invoices ||--|{ invoice_items : contains
  invoices ||--o{ payments : "settled by"
  subscriptions ||--o{ invoices : bills

  payments {
    uuid id PK
    uuid order_id FK
    uuid invoice_id FK "nullable"
    enum purpose "ORDER_INITIAL|INVOICE"
    bigint amount "F"
    text currency
    enum status "PENDING|PAID|FAILED|EXPIRED|REFUNDED|PARTIALLY_REFUNDED"
    text gateway "MIDTRANS|XENDIT|FAKE"
    text gateway_ref UK "per gateway"
    text checkout_url
    timestamptz expires_at
    timestamptz paid_at
    bigint refunded_amount "F, derived from transactions"
    text idempotency_key UK
  }
  payment_transactions {
    uuid id PK
    uuid payment_id FK
    enum type "CHARGE|REFUND|ADJUSTMENT"
    bigint amount "F"
    enum status
    text gateway_ref
    text gateway_status_raw
    timestamptz occurred_at
    uuid created_by FK "nullable = SYSTEM"
  }
  payment_webhooks {
    uuid id PK
    text gateway
    text event_id "UK with gateway"
    bool signature_valid
    text payload_sha256
    jsonb payload_redacted
    enum processing_status "RECEIVED|PROCESSED|IGNORED|FAILED"
    text processing_error
    int attempts
    uuid payment_id FK
    timestamptz received_at
    timestamptz processed_at
  }
  refunds {
    uuid id PK
    uuid payment_id FK
    bigint amount "F"
    text reason
    enum status "REQUESTED|APPROVED|REJECTED|PROCESSING|SUCCEEDED|FAILED"
    uuid requested_by FK
    uuid approved_by FK "must differ from requested_by"
    timestamptz approved_at
    text gateway_ref
  }
  invoices {
    uuid id PK
    text number UK
    uuid customer_id FK
    uuid subscription_id FK
    uuid order_id FK
    enum status "DRAFT|ISSUED|PAID|OVERDUE|VOID"
    date issued_on
    date due_on
    bigint subtotal
    bigint tax
    bigint total
  }
  invoice_items { uuid id PK  uuid invoice_id FK  text description  bigint amount  enum kind }
```

## 5. Support, reviews, notifications, CMS

```mermaid
erDiagram
  support_tickets ||--o{ ticket_messages : has
  ticket_messages ||--o{ ticket_attachments : has
  support_tickets ||--o{ ticket_status_history : logs
  orders ||--o| reviews : "reviewed in"
  notification_templates ||--o{ notifications : renders
  article_categories ||--o{ articles : groups

  support_tickets {
    uuid id PK
    text ticket_number UK
    uuid customer_id FK
    uuid provider_id FK
    uuid order_id FK
    enum category "NO_INTERNET|SLOW_INTERNET|WIFI_PROBLEM|ROUTER_PROBLEM|INSTALLATION|BILLING|PAYMENT|OTHER"
    enum priority "LOW|NORMAL|HIGH|URGENT"
    enum status "OPEN|ASSIGNED|IN_PROGRESS|WAITING_CUSTOMER|WAITING_PROVIDER|RESOLVED|CLOSED"
    uuid assignee_id FK
    timestamptz first_response_due_at
    timestamptz resolution_due_at
    timestamptz first_responded_at
    timestamptz resolved_at
  }
  ticket_messages {
    uuid id PK
    uuid ticket_id FK
    uuid author_id FK
    enum visibility "PUBLIC|INTERNAL"
    text body "sanitised"
  }
  ticket_attachments { uuid id PK  uuid message_id FK  text storage_key  text mime  int size_bytes }
  ticket_status_history { uuid id PK  uuid ticket_id FK  enum from_status  enum to_status  uuid actor_id FK }
  reviews {
    uuid id PK
    uuid order_id FK UK "one review per order"
    uuid customer_id FK
    uuid provider_id FK
    uuid package_id FK
    int rating "1..5"
    text body
    enum status "PENDING_MODERATION|PUBLISHED|REJECTED|HIDDEN"
    text provider_reply
  }
  notification_templates {
    uuid id PK
    text event "order_created, payment_success, ..."
    enum channel "EMAIL|WHATSAPP|SMS|IN_APP"
    text locale
    text subject
    text body "template, no logic"
    int version
    bool active
  }
  notifications {
    uuid id PK
    uuid user_id FK
    text event
    enum channel
    enum status "QUEUED|SENT|DELIVERED|FAILED|READ"
    jsonb data "minimal, no secrets"
    text vendor_message_id
    timestamptz sent_at
    timestamptz read_at
  }
  articles {
    uuid id PK
    uuid category_id FK
    text slug UK
    text title
    text body_html "sanitised on save"
    text seo_title
    text seo_description
    text og_image_key
    enum status "DRAFT|PUBLISHED|ARCHIVED"
    timestamptz published_at
  }
  article_categories { uuid id PK  text slug UK  text name }
```

Also in CMS: `faqs`, `pages` (homepage blocks, landing pages, legal pages with
`version`), `banners`. Notification preferences: `notification_preferences(user_id, event, channel, enabled)`.

## 6. Phase 3 — referrals, leads, analytics (modelled now, migrated later)

```mermaid
erDiagram
  referral_partners ||--o{ referral_codes : owns
  referral_codes ||--o{ referral_clicks : tracks
  referral_codes ||--o{ referrals : attributes
  referrals ||--o{ commissions : earns
  commission_rules ||--o{ commissions : "computed by"
  referral_partners ||--o{ payouts : receives
  payouts ||--o{ commissions : settles
  leads ||--o{ lead_events : logs
  leads ||--o{ lead_assignments : "assigned via"

  referral_partners { uuid id PK  uuid user_id FK  enum status  bytea bank_account_enc "F" }
  referral_codes { uuid id PK  uuid partner_id FK  text code UK "GMM-XXXX-001"  enum status }
  referral_clicks { uuid id PK  uuid code_id FK  text ip_hash  text ua_hash  timestamptz created_at }
  referrals {
    uuid id PK
    uuid code_id FK
    uuid customer_id FK
    uuid order_id FK
    enum status "CLICKED|REGISTERED|ORDERED|PAID|ACTIVATED|ELIGIBLE|COMMISSIONED|PAID_OUT|REJECTED"
    jsonb fraud_signals
  }
  commission_rules {
    uuid id PK
    enum beneficiary "GMM_PLATFORM|REFERRAL_PARTNER"
    uuid provider_id FK "nullable = default"
    enum basis "FIRST_MONTH_FEE|ORDER_TOTAL|FLAT_PER_ACTIVATION"
    enum type "PERCENT|FIXED"
    int value
    bigint cap
    timestamptz effective_from
    timestamptz effective_to
  }
  commissions {
    uuid id PK
    uuid rule_id FK
    uuid order_id FK
    enum beneficiary
    uuid beneficiary_id
    bigint amount "F"
    enum status "PENDING|ELIGIBLE|APPROVED|PAID|REVERSED"
  }
  payouts { uuid id PK  uuid partner_id FK  bigint amount  enum status  uuid requested_by FK  uuid approved_by FK }
  leads {
    uuid id PK
    text name "C"
    text phone "C"
    citext email "C"
    geography location "C"
    text use_case
    text current_provider
    int desired_mbps
    bigint budget
    enum source "COVERAGE_SEARCH|ABANDONED_ORDER|CONTACT_FORM|WHATSAPP|CAMPAIGN|REFERRAL|SALES"
    enum status "NEW|VERIFIED|QUALIFIED|ASSIGNED|CONTACTED|CONVERTED|LOST|INVALID"
    timestamptz consent_share_at "required before provider sharing"
    text consent_text_version
  }
  lead_events { uuid id PK  uuid lead_id FK  text type  jsonb data  uuid actor_id FK }
  lead_assignments { uuid id PK  uuid lead_id FK  uuid provider_id FK  uuid assigned_by FK  timestamptz shared_at }
```

`analytics_events(id bigserial, name, anon_session_id, user_id, properties jsonb, created_at)` — monthly partitions, no raw PII in `properties`.

## 7. Platform tables

| Table              | Notes                                                                                                                                                                                                      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `audit_logs`       | `id, actor_id, actor_kind, action, entity, entity_id, before jsonb, after jsonb, ip inet, user_agent, request_id, created_at`. Insert-only (DB grants). `before/after` are redacted for PII/secret fields. |
| `system_settings`  | `key text PK, value jsonb, description, updated_by, updated_at`. Every change audited. Holds tax rate, billing policy, SLA targets, retention periods.                                                     |
| `idempotency_keys` | `scope, key` PK, `request_sha256`, `response_status`, `response_body`, `expires_at`.                                                                                                                       |
| `outbox_events`    | `id, topic, payload jsonb, available_at, attempts, last_error, dispatched_at`.                                                                                                                             |

## 8. Indexing plan (Phase 1)

| Index                                                                                           | Purpose              |
| ----------------------------------------------------------------------------------------------- | -------------------- |
| `coverage_zones USING gist (geom) WHERE status='ACTIVE'`                                        | polygon lookup       |
| `coverage_zones USING gist (center) WHERE status='ACTIVE' AND strategy='RADIUS'`                | radius lookup        |
| `coverage_zones (region_code) WHERE strategy='ADMIN_AREA'`, GIN on `postal_codes`               | admin/manual zones   |
| `internet_packages (provider_id, status)`, `(status, monthly_price)`, `(status, download_mbps)` | search filters/sorts |
| `providers (verification_status) WHERE deleted_at IS NULL`                                      | public listing       |
| `orders (customer_id, created_at desc)`, `(provider_id, status, created_at desc)`               | dashboards           |
| `order_status_history (order_id, created_at)`                                                   | timeline             |
| `payment_webhooks UNIQUE (gateway, event_id)`                                                   | idempotency          |
| `payments UNIQUE (gateway, gateway_ref)`                                                        | reconciliation       |
| `audit_logs (entity, entity_id, created_at)`, `(actor_id, created_at)`                          | audit search         |

## 9. Data classification & separation

| Class                   | Tables                                                                                 | Access                                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Customer personal `[C]` | users, customers, customer_addresses, coverage_checks, orders.address_snapshot, leads  | Customer (own), assigned provider (only for its orders, only fields needed to install), CS/Admin with reason |
| Provider business `[P]` | providers, provider_documents, provider_users                                          | Provider (own), Admin; documents never public                                                                |
| Financial `[F]`         | payments, payment_transactions, refunds, invoices, commissions, payouts, bank accounts | Finance, Super Admin; provider sees own settlement/commission only                                           |
| Internal `[I]`          | audit_logs, system_settings, ticket internal notes, admin metadata                     | Platform roles only; never serialised to public/customer/provider APIs                                       |
