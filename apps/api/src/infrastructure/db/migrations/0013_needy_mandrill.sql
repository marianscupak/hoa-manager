ALTER TABLE "vote_rulesets" DROP CONSTRAINT "unq_vote_rulesets_vote_id";--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "question_id" uuid;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD CONSTRAINT "vote_rulesets_question_id_vote_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."vote_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD CONSTRAINT "unq_vote_rulesets_vote_id_question_id" UNIQUE("vote_id","question_id");