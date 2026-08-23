CREATE TYPE "public"."vote_mode" AS ENUM('PER_ROLLAM', 'ASSEMBLY_RECORD');--> statement-breakpoint
CREATE TYPE "public"."threshold_comparator" AS ENUM('STRICT_GREATER', 'AT_LEAST');--> statement-breakpoint
CREATE TYPE "public"."majority_denominator_basis" AS ENUM('VOTES_CAST', 'ALL_VOTES');--> statement-breakpoint
ALTER TYPE "public"."electorate_ineligible_reason" ADD VALUE 'ASSOCIATION_OWNED';--> statement-breakpoint
ALTER TYPE "public"."majority_rule_type" ADD VALUE 'UNANIMITY';--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "mode" "vote_mode" DEFAULT 'PER_ROLLAM' NOT NULL;--> statement-breakpoint
UPDATE "votes" SET "mode" = 'ASSEMBLY_RECORD';--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "quorum_threshold_num" integer;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "quorum_threshold_den" integer;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "quorum_comparator" "threshold_comparator";--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "majority_denominator_basis" "majority_denominator_basis";--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "majority_threshold_num" integer;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "majority_threshold_den" integer;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "majority_comparator" "threshold_comparator";--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD COLUMN "acknowledged_non_statutory" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "vote_rulesets" SET
        "quorum_threshold_num" = ((("quorum_threshold" * 10000)::bigint) / gcd((("quorum_threshold" * 10000)::bigint), 1000000::bigint))::integer,
        "quorum_threshold_den" = (1000000::bigint / gcd((("quorum_threshold" * 10000)::bigint), 1000000::bigint))::integer,
        "quorum_comparator" = 'AT_LEAST',
        "majority_denominator_basis" = 'VOTES_CAST',
        "majority_threshold_num" = CASE WHEN "majority_rule_type" = 'QUALIFIED_MAJORITY' AND "majority_threshold" IS NOT NULL
                THEN ((("majority_threshold" * 10000)::bigint) / gcd((("majority_threshold" * 10000)::bigint), 1000000::bigint))::integer ELSE 1 END,
        "majority_threshold_den" = CASE WHEN "majority_rule_type" = 'QUALIFIED_MAJORITY' AND "majority_threshold" IS NOT NULL
                THEN (1000000::bigint / gcd((("majority_threshold" * 10000)::bigint), 1000000::bigint))::integer ELSE 2 END,
        "majority_comparator" = CASE WHEN "majority_rule_type" = 'QUALIFIED_MAJORITY' THEN 'AT_LEAST'::"threshold_comparator" ELSE 'STRICT_GREATER'::"threshold_comparator" END;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ALTER COLUMN "quorum_measure" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ALTER COLUMN "majority_denominator_basis" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ALTER COLUMN "majority_threshold_num" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ALTER COLUMN "majority_threshold_den" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ALTER COLUMN "majority_comparator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_rulesets" DROP COLUMN "quorum_electorate_basis";--> statement-breakpoint
ALTER TABLE "vote_rulesets" DROP COLUMN "quorum_threshold";--> statement-breakpoint
ALTER TABLE "vote_rulesets" DROP COLUMN "majority_threshold";--> statement-breakpoint
ALTER TABLE "vote_rulesets" DROP COLUMN "abstain_excluded_from_majority_denominator";--> statement-breakpoint
ALTER TABLE "vote_rulesets" DROP COLUMN "allow_co_owner_individual_vote";--> statement-breakpoint
DROP TYPE "public"."quorum_electorate_basis";--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ADD COLUMN "weight_numerator" integer;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ADD COLUMN "weight_denominator" integer;--> statement-breakpoint
UPDATE "vote_electorate_units" SET
        "weight_numerator" = ((("voting_weight" * 10000)::bigint) / gcd((("voting_weight" * 10000)::bigint), 10000::bigint))::integer,
        "weight_denominator" = (10000::bigint / gcd((("voting_weight" * 10000)::bigint), 10000::bigint))::integer;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ALTER COLUMN "weight_numerator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ALTER COLUMN "weight_denominator" SET NOT NULL;--> statement-breakpoint
DELETE FROM "vote_electorate_units" a USING "vote_electorate_units" b
        WHERE a."vote_id" = b."vote_id" AND a."unit_id" = b."unit_id" AND a.ctid > b.ctid;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" DROP CONSTRAINT "unq_vote_electorate_units_vote_id_unit_id_rep_id";--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ADD CONSTRAINT "unq_vote_electorate_units_vote_id_unit_id" UNIQUE("vote_id","unit_id");--> statement-breakpoint
ALTER TABLE "vote_electorate_units" DROP COLUMN "voting_weight";--> statement-breakpoint
ALTER TABLE "vote_results" ALTER COLUMN "quorum_met" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_results" ADD COLUMN "participation_weight_num" bigint;--> statement-breakpoint
ALTER TABLE "vote_results" ADD COLUMN "participation_weight_den" bigint;--> statement-breakpoint
ALTER TABLE "vote_results" ADD COLUMN "total_votes_weight_num" bigint;--> statement-breakpoint
ALTER TABLE "vote_results" ADD COLUMN "total_votes_weight_den" bigint;--> statement-breakpoint
ALTER TABLE "vote_results" ADD COLUMN "total_votes_unit_count" integer;--> statement-breakpoint
UPDATE "vote_results" SET
        "participation_weight_num" = (("participation_weight" * 10000)::bigint) / gcd((("participation_weight" * 10000)::bigint), 10000::bigint),
        "participation_weight_den" = 10000::bigint / gcd((("participation_weight" * 10000)::bigint), 10000::bigint),
        "total_votes_weight_num" = ((COALESCE("denominator_weight", 0) * 10000)::bigint) / gcd(((COALESCE("denominator_weight", 0) * 10000)::bigint), 10000::bigint),
        "total_votes_weight_den" = 10000::bigint / gcd(((COALESCE("denominator_weight", 0) * 10000)::bigint), 10000::bigint),
        "total_votes_unit_count" = COALESCE("denominator_unit_count", 0);--> statement-breakpoint
ALTER TABLE "vote_results" ALTER COLUMN "participation_weight_num" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_results" ALTER COLUMN "participation_weight_den" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_results" ALTER COLUMN "total_votes_weight_num" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_results" ALTER COLUMN "total_votes_weight_den" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_results" ALTER COLUMN "total_votes_unit_count" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_results" DROP COLUMN "participation_weight";--> statement-breakpoint
ALTER TABLE "vote_results" DROP COLUMN "denominator_weight";--> statement-breakpoint
ALTER TABLE "vote_results" DROP COLUMN "denominator_unit_count";--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD COLUMN "majority_threshold_num" integer;--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD COLUMN "majority_threshold_den" integer;--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD COLUMN "majority_comparator" "threshold_comparator";--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD COLUMN "majority_denominator_num" bigint;--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD COLUMN "majority_denominator_den" bigint;--> statement-breakpoint
UPDATE "vote_question_results" SET
        "majority_threshold_num" = CASE WHEN "majority_threshold_value" IS NOT NULL
                THEN ((("majority_threshold_value" * 10000)::bigint) / gcd((("majority_threshold_value" * 10000)::bigint), 10000::bigint))::integer ELSE 1 END,
        "majority_threshold_den" = CASE WHEN "majority_threshold_value" IS NOT NULL
                THEN (10000::bigint / gcd((("majority_threshold_value" * 10000)::bigint), 10000::bigint))::integer ELSE 2 END,
        "majority_comparator" = CASE WHEN "majority_threshold_value" IS NOT NULL THEN 'AT_LEAST'::"threshold_comparator" ELSE 'STRICT_GREATER'::"threshold_comparator" END,
        "majority_denominator_num" = (("majority_denominator_value" * 10000)::bigint) / gcd((("majority_denominator_value" * 10000)::bigint), 10000::bigint),
        "majority_denominator_den" = 10000::bigint / gcd((("majority_denominator_value" * 10000)::bigint), 10000::bigint);--> statement-breakpoint
ALTER TABLE "vote_question_results" ALTER COLUMN "majority_threshold_num" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_question_results" ALTER COLUMN "majority_threshold_den" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_question_results" ALTER COLUMN "majority_comparator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_question_results" ALTER COLUMN "majority_denominator_num" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_question_results" ALTER COLUMN "majority_denominator_den" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_question_results" DROP COLUMN "majority_threshold_value";--> statement-breakpoint
ALTER TABLE "vote_question_results" DROP COLUMN "majority_denominator_value";--> statement-breakpoint
ALTER TABLE "vote_option_results" ADD COLUMN "vote_weight_num" bigint;--> statement-breakpoint
ALTER TABLE "vote_option_results" ADD COLUMN "vote_weight_den" bigint;--> statement-breakpoint
UPDATE "vote_option_results" SET
        "vote_weight_num" = (("vote_weight" * 10000)::bigint) / gcd((("vote_weight" * 10000)::bigint), 10000::bigint),
        "vote_weight_den" = 10000::bigint / gcd((("vote_weight" * 10000)::bigint), 10000::bigint);--> statement-breakpoint
ALTER TABLE "vote_option_results" ALTER COLUMN "vote_weight_num" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_option_results" ALTER COLUMN "vote_weight_den" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vote_option_results" DROP COLUMN "vote_weight";--> statement-breakpoint
DELETE FROM "vote_unit_consents" a USING "vote_unit_consents" b
        WHERE a."vote_id" = b."vote_id" AND a."unit_id" = b."unit_id" AND a."from_owner_id" = b."from_owner_id"
        AND a."status" = 'VALID' AND b."status" = 'VALID' AND a.ctid > b.ctid;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_vote_unit_consents_valid" ON "vote_unit_consents" ("vote_id","unit_id","from_owner_id") WHERE "status" = 'VALID';
