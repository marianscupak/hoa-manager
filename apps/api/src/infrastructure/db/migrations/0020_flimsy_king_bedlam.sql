CREATE TYPE "public"."owner_kind" AS ENUM('PERSON', 'LEGAL_ENTITY', 'ASSOCIATION');--> statement-breakpoint
CREATE TYPE "public"."ownership_party_type" AS ENUM('SOLE', 'SJM');--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "kind" "owner_kind" DEFAULT 'PERSON' NOT NULL;--> statement-breakpoint
CREATE TABLE "unit_ownership_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "tenant_id" uuid NOT NULL,
        "ownership_id" uuid NOT NULL,
        "owner_id" uuid NOT NULL,
        CONSTRAINT "unq_unit_ownership_members_ownership_owner" UNIQUE("ownership_id","owner_id")
);--> statement-breakpoint
ALTER TABLE "unit_ownership_members" ADD CONSTRAINT "unit_ownership_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_ownership_members" ADD CONSTRAINT "unit_ownership_members_ownership_id_unit_ownerships_id_fk" FOREIGN KEY ("ownership_id") REFERENCES "public"."unit_ownerships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_ownership_members" ADD CONSTRAINT "unit_ownership_members_owner_id_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."owners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "unit_ownership_members_tenant_owner_idx" ON "unit_ownership_members" ("tenant_id","owner_id");--> statement-breakpoint
ALTER TABLE "unit_ownerships" ADD COLUMN "party_type" "ownership_party_type";--> statement-breakpoint
ALTER TABLE "unit_ownerships" ADD COLUMN "share_numerator" integer;--> statement-breakpoint
ALTER TABLE "unit_ownerships" ADD COLUMN "share_denominator" integer;--> statement-breakpoint
INSERT INTO "unit_ownership_members" ("tenant_id", "ownership_id", "owner_id")
        SELECT "tenant_id", "id", "owner_id" FROM "unit_ownerships";--> statement-breakpoint
UPDATE "unit_ownerships" SET
        "party_type" = 'SOLE',
        "share_numerator" = ((("share" * 100000000)::bigint) / gcd((("share" * 100000000)::bigint), 100000000::bigint))::integer,
        "share_denominator" = (100000000::bigint / gcd((("share" * 100000000)::bigint), 100000000::bigint))::integer;--> statement-breakpoint
ALTER TABLE "unit_ownerships" ALTER COLUMN "party_type" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unit_ownerships" ALTER COLUMN "share_numerator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "unit_ownerships" ALTER COLUMN "share_denominator" SET NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "unit_ownerships_tenant_owner_idx";--> statement-breakpoint
ALTER TABLE "unit_ownerships" DROP COLUMN "owner_id";--> statement-breakpoint
ALTER TABLE "unit_ownerships" DROP COLUMN "share";
