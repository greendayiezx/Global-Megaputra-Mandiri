CREATE TYPE "public"."ticket_category" AS ENUM('INSTALLATION', 'SERVICE_ISSUE', 'BILLING', 'PROVIDER_COMPLAINT', 'ACCOUNT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid,
	"author_kind" text NOT NULL,
	"body" text NOT NULL,
	"internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref_code" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"category" "ticket_category" NOT NULL,
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"provider_id" text,
	"assignee_id" uuid,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tickets_ref_code_unique" UNIQUE("ref_code")
);
--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ticket_messages_ticket_idx" ON "ticket_messages" USING btree ("ticket_id","created_at");--> statement-breakpoint
CREATE INDEX "tickets_customer_idx" ON "tickets" USING btree ("customer_id","last_message_at");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status","last_message_at");