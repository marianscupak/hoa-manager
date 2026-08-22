CREATE TYPE "public"."vote_document_status" AS ENUM('PENDING', 'UPLOADED');--> statement-breakpoint
CREATE TABLE "vote_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"uploaded_by_membership_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"object_key" text NOT NULL,
	"status" "vote_document_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vote_documents" ADD CONSTRAINT "vote_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_documents" ADD CONSTRAINT "vote_documents_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_documents" ADD CONSTRAINT "vote_documents_uploaded_by_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("uploaded_by_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE no action ON UPDATE no action;