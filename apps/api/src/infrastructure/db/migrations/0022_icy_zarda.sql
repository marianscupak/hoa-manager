CREATE TYPE "public"."vote_document_kind" AS ENUM('VOTE', 'BALLOT');--> statement-breakpoint
ALTER TABLE "ballots" ADD COLUMN "attachment_document_id" uuid;--> statement-breakpoint
ALTER TABLE "vote_documents" ADD COLUMN "kind" "vote_document_kind" DEFAULT 'VOTE' NOT NULL;--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_attachment_document_id_vote_documents_id_fk" FOREIGN KEY ("attachment_document_id") REFERENCES "public"."vote_documents"("id") ON DELETE set null ON UPDATE no action;