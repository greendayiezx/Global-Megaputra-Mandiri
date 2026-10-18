CREATE TYPE "public"."service_request_kind" AS ENUM('SURVEY', 'INSTALLATION');--> statement-breakpoint
CREATE TYPE "public"."service_request_status" AS ENUM('NEW', 'CONTACTED', 'SURVEY_SCHEDULED', 'FORWARDED', 'DONE', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "service_request_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"status" "service_request_status" NOT NULL,
	"public_note" text,
	"actor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref_code" text NOT NULL,
	"kind" "service_request_kind" NOT NULL,
	"status" "service_request_status" DEFAULT 'NEW' NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"provider_id" text,
	"package_id" text,
	"note" text,
	"consent_at" timestamp with time zone NOT NULL,
	"consent_version" text NOT NULL,
	"admin_note" text,
	"handled_by" uuid,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "service_requests_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
ALTER TABLE "service_request_events" ADD CONSTRAINT "service_request_events_request_id_service_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."service_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_request_events" ADD CONSTRAINT "service_request_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_package_id_internet_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."internet_packages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_handled_by_users_id_fk" FOREIGN KEY ("handled_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "service_request_events_request_idx" ON "service_request_events" USING btree ("request_id","created_at");--> statement-breakpoint
CREATE INDEX "service_requests_status_idx" ON "service_requests" USING btree ("status","created_at");