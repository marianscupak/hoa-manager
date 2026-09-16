CREATE TYPE "public"."vote_attendance_status" AS ENUM('PRESENT', 'ABSENT');--> statement-breakpoint
CREATE TABLE "vote_attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"vote_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"status" "vote_attendance_status" NOT NULL,
	"voter_owner_id" uuid,
	"voter_note" text,
	"recorded_by_membership_id" uuid NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vote_attendance_vote_unit_unique" UNIQUE("vote_id","unit_id")
);
--> statement-breakpoint
ALTER TABLE "vote_attendance" ADD CONSTRAINT "vote_attendance_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_attendance" ADD CONSTRAINT "vote_attendance_vote_id_votes_id_fk" FOREIGN KEY ("vote_id") REFERENCES "public"."votes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_attendance" ADD CONSTRAINT "vote_attendance_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_attendance" ADD CONSTRAINT "vote_attendance_voter_owner_id_owners_id_fk" FOREIGN KEY ("voter_owner_id") REFERENCES "public"."owners"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vote_attendance" ADD CONSTRAINT "vote_attendance_recorded_by_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("recorded_by_membership_id") REFERENCES "public"."tenant_memberships"("id") ON DELETE cascade ON UPDATE no action;