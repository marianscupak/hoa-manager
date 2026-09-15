ALTER TABLE "ballots" DROP CONSTRAINT "ballots_attachment_document_id_vote_documents_id_fk";
--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_attachment_document_id_vote_documents_id_fk" FOREIGN KEY ("attachment_document_id") REFERENCES "public"."vote_documents"("id") ON DELETE restrict ON UPDATE no action;