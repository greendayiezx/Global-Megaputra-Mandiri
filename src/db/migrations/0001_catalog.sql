CREATE TYPE "public"."coverage_result" AS ENUM('AVAILABLE', 'LIMITED', 'REQUIRES_SURVEY', 'EXCLUDED');--> statement-breakpoint
CREATE TYPE "public"."coverage_strategy" AS ENUM('POLYGON', 'RADIUS', 'ADMIN_AREA', 'MANUAL_ZONE', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."coverage_zone_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."package_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'SUSPENDED', 'EXPIRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."provider_verification_status" AS ENUM('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "coverage_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"name" text NOT NULL,
	"strategy" "coverage_strategy" NOT NULL,
	"geometry" jsonb NOT NULL,
	"result" "coverage_result" NOT NULL,
	"status" "coverage_zone_status" DEFAULT 'ACTIVE' NOT NULL,
	"last_verified_at" timestamp with time zone,
	"source" text DEFAULT 'PROVIDER' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internet_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"provider_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"download_mbps" integer NOT NULL,
	"upload_mbps" integer NOT NULL,
	"technology" text NOT NULL,
	"monthly_price" bigint NOT NULL,
	"installation_fee" bigint NOT NULL,
	"activation_fee" bigint NOT NULL,
	"tax_included" boolean DEFAULT false NOT NULL,
	"contract_months" integer DEFAULT 0 NOT NULL,
	"router_included" boolean DEFAULT false NOT NULL,
	"fup_policy" text,
	"sla_summary" text,
	"support_hours" text,
	"est_installation_days_min" integer,
	"est_installation_days_max" integer,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "package_status" DEFAULT 'DRAFT' NOT NULL,
	"review_note" text,
	"published_at" timestamp with time zone,
	"last_price_verified_at" timestamp with time zone,
	"valid_until" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "internet_packages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "package_price_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"package_id" text NOT NULL,
	"monthly_price" bigint NOT NULL,
	"installation_fee" bigint NOT NULL,
	"activation_fee" bigint NOT NULL,
	"tax_included" boolean NOT NULL,
	"changed_by" uuid,
	"effective_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" text NOT NULL,
	"from_status" "provider_verification_status" NOT NULL,
	"to_status" "provider_verification_status" NOT NULL,
	"actor_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "providers" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"legal_name" text NOT NULL,
	"nib" text,
	"description" text DEFAULT '' NOT NULL,
	"website" text,
	"address" text,
	"pic_name" text,
	"pic_phone" text,
	"pic_email" text,
	"support_phone" text,
	"support_email" text,
	"support_hours" text DEFAULT '' NOT NULL,
	"sla_summary" text,
	"installation_info" text DEFAULT '' NOT NULL,
	"technologies" text[] DEFAULT '{}' NOT NULL,
	"service_area_names" text[] DEFAULT '{}' NOT NULL,
	"verification_status" "provider_verification_status" DEFAULT 'PENDING' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"last_reviewed_at" timestamp with time zone,
	"listing_priority" integer DEFAULT 0 NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "providers_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "coverage_zones" ADD CONSTRAINT "coverage_zones_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coverage_zones" ADD CONSTRAINT "coverage_zones_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internet_packages" ADD CONSTRAINT "internet_packages_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_price_history" ADD CONSTRAINT "package_price_history_package_id_internet_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."internet_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_price_history" ADD CONSTRAINT "package_price_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_status_history" ADD CONSTRAINT "provider_status_history_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_status_history" ADD CONSTRAINT "provider_status_history_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "providers" ADD CONSTRAINT "providers_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "coverage_zones_provider_idx" ON "coverage_zones" USING btree ("provider_id","status");--> statement-breakpoint
CREATE INDEX "internet_packages_provider_idx" ON "internet_packages" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "internet_packages_status_idx" ON "internet_packages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "package_price_history_package_idx" ON "package_price_history" USING btree ("package_id","effective_at");--> statement-breakpoint
CREATE INDEX "provider_status_history_provider_idx" ON "provider_status_history" USING btree ("provider_id","created_at");--> statement-breakpoint
CREATE INDEX "providers_status_idx" ON "providers" USING btree ("verification_status");