CREATE TYPE "public"."ballot_cast_method" AS ENUM('DIRECT', 'BOARD_PROXY');--> statement-breakpoint
CREATE TYPE "public"."electorate_eligibility_status" AS ENUM('ELIGIBLE', 'INELIGIBLE');--> statement-breakpoint
CREATE TYPE "public"."electorate_ineligible_reason" AS ENUM('NO_REPRESENTATIVE', 'MISSING_OWNERSHIP');--> statement-breakpoint
CREATE TYPE "public"."majority_rule_type" AS ENUM('SIMPLE_MAJORITY', 'QUALIFIED_MAJORITY');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('SINGLE_CHOICE', 'MULTIPLE_CHOICE');--> statement-breakpoint
CREATE TYPE "public"."quorum_electorate_basis" AS ENUM('ALL_UNITS', 'ELIGIBLE_UNITS_ONLY');--> statement-breakpoint
CREATE TYPE "public"."quorum_measure" AS ENUM('UNIT_SHARE', 'UNIT_COUNT');--> statement-breakpoint
CREATE TYPE "public"."vote_result_status" AS ENUM('COMPUTED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."vote_status" AS ENUM('DRAFT', 'OPEN', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."vote_unit_consent_status" AS ENUM('VALID', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."vote_weight_basis" AS ENUM('UNIT_SHARE', 'ONE_UNIT_ONE_VOTE');--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"created_by_membership_id" uuid NOT NULL,
	"opened_by_membership_id" uuid,
	"closed_by_membership_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" "vote_status" DEFAULT 'DRAFT' NOT NULL,
	"scheduled_from" timestamp with time zone,
	"scheduled_to" timestamp with time zone,
	"opened_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote_rulesets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"weight_basis" "vote_weight_basis" NOT NULL,
	"quorum_measure" "quorum_measure" NOT NULL,
	"quorum_electorate_basis" "quorum_electorate_basis" NOT NULL,
	"quorum_threshold" numeric(19, 4) NOT NULL,
	"majority_rule_type" "majority_rule_type" NOT NULL,
	"majority_threshold" numeric(19, 4),
	"allow_abstain" boolean NOT NULL,
	"abstain_excluded_from_majority_denominator" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_vote_rulesets_vote_id" UNIQUE("vote_id")
);
--> statement-breakpoint
CREATE TABLE "vote_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"question_type" "question_type" NOT NULL,
	"title" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_vote_questions_vote_id_sort_order" UNIQUE("vote_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "vote_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"label" text NOT NULL,
	"option_key" text NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_vote_options_question_id_sort_order" UNIQUE("question_id","sort_order")
);
--> statement-breakpoint
CREATE TABLE "vote_unit_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"from_owner_id" uuid NOT NULL,
	"to_membership_id" uuid NOT NULL,
	"recorded_by_membership_id" uuid,
	"status" "vote_unit_consent_status" NOT NULL,
	"evidence_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote_electorate_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"representative_membership_id" uuid,
	"eligibility_status" "electorate_eligibility_status" NOT NULL,
	"ineligible_reason" "electorate_ineligible_reason",
	"voting_weight" numeric(19, 4) NOT NULL,
	"snapshotted_at" timestamp with time zone NOT NULL,
	CONSTRAINT "unq_vote_electorate_units_vote_id_unit_id" UNIQUE("vote_id","unit_id")
);
--> statement-breakpoint
CREATE TABLE "ballots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"cast_by_membership_id" uuid NOT NULL,
	"attribution_owner_id" uuid,
	"cast_method" "ballot_cast_method" NOT NULL,
	"evidence_note" text,
	"cast_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_ballots_vote_id_unit_id" UNIQUE("vote_id","unit_id")
);
--> statement-breakpoint
CREATE TABLE "ballot_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ballot_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_ballot_answers_ballot_id_question_id" UNIQUE("ballot_id","question_id")
);
--> statement-breakpoint
CREATE TABLE "vote_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"result_status" "vote_result_status" NOT NULL,
	"quorum_met" boolean NOT NULL,
	"participation_weight" numeric(19, 4) NOT NULL,
	"participation_unit_count" integer NOT NULL,
	"denominator_weight" numeric(19, 4),
	"denominator_unit_count" integer,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unq_vote_results_vote_id" UNIQUE("vote_id")
);
--> statement-breakpoint
CREATE TABLE "vote_question_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_result_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"majority_met" boolean NOT NULL,
	"winning_option_id" uuid,
	"majority_threshold_value" numeric(19, 4),
	"majority_denominator_value" numeric(19, 4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vote_option_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"question_result_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"vote_weight" numeric(19, 4) NOT NULL,
	"vote_unit_count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_created_by_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("created_by_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_opened_by_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("opened_by_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_closed_by_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("closed_by_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD CONSTRAINT "vote_rulesets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_rulesets" ADD CONSTRAINT "vote_rulesets_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_questions" ADD CONSTRAINT "vote_questions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_questions" ADD CONSTRAINT "vote_questions_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_options" ADD CONSTRAINT "vote_options_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_options" ADD CONSTRAINT "vote_options_question_id_vote_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."vote_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_unit_consents" ADD CONSTRAINT "vote_unit_consents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_unit_consents" ADD CONSTRAINT "vote_unit_consents_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_unit_consents" ADD CONSTRAINT "vote_unit_consents_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_unit_consents" ADD CONSTRAINT "vote_unit_consents_from_owner_id_owners_id_fk" FOREIGN KEY ("from_owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_unit_consents" ADD CONSTRAINT "vote_unit_consents_to_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("to_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_unit_consents" ADD CONSTRAINT "vote_unit_consents_recorded_by_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("recorded_by_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ADD CONSTRAINT "vote_electorate_units_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ADD CONSTRAINT "vote_electorate_units_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ADD CONSTRAINT "vote_electorate_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_electorate_units" ADD CONSTRAINT "vote_electorate_units_representative_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("representative_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_cast_by_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("cast_by_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_attribution_owner_id_owners_id_fk" FOREIGN KEY ("attribution_owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballot_answers" ADD CONSTRAINT "ballot_answers_ballot_id_ballots_id_fk" FOREIGN KEY ("ballot_id") REFERENCES "public"."ballots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballot_answers" ADD CONSTRAINT "ballot_answers_question_id_vote_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."vote_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ballot_answers" ADD CONSTRAINT "ballot_answers_option_id_vote_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."vote_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_results" ADD CONSTRAINT "vote_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_results" ADD CONSTRAINT "vote_results_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD CONSTRAINT "vote_question_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD CONSTRAINT "vote_question_results_vote_result_id_vote_results_id_fk" FOREIGN KEY ("vote_result_id") REFERENCES "public"."vote_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD CONSTRAINT "vote_question_results_question_id_vote_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."vote_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_question_results" ADD CONSTRAINT "vote_question_results_winning_option_id_vote_options_id_fk" FOREIGN KEY ("winning_option_id") REFERENCES "public"."vote_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_option_results" ADD CONSTRAINT "vote_option_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_option_results" ADD CONSTRAINT "vote_option_results_question_result_id_vote_question_results_id_fk" FOREIGN KEY ("question_result_id") REFERENCES "public"."vote_question_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_option_results" ADD CONSTRAINT "vote_option_results_option_id_vote_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."vote_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_votes_status_scheduled_from" ON "votes" USING btree ("status","scheduled_from");--> statement-breakpoint
CREATE INDEX "idx_votes_status_scheduled_to" ON "votes" USING btree ("status","scheduled_to");