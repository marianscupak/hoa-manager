ALTER TABLE "vote_questions" ALTER COLUMN "question_type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."question_type";--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('YES_NO', 'SINGLE_CHOICE');--> statement-breakpoint
ALTER TABLE "vote_questions" ALTER COLUMN "question_type" SET DATA TYPE "public"."question_type" USING "question_type"::"public"."question_type";--> statement-breakpoint
ALTER TABLE "vote_questions" ADD COLUMN "description" text;