ALTER TABLE "units" ADD COLUMN "katastr_unit_id" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "usage_code" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "usage_name" text;--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "katastr_person_id" text;--> statement-breakpoint
ALTER TABLE "owners" ADD COLUMN "ico" text;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_tenant_katastr_unit_id_unique" UNIQUE("tenant_id","katastr_unit_id");--> statement-breakpoint
ALTER TABLE "owners" ADD CONSTRAINT "owners_tenant_katastr_person_id_unique" UNIQUE("tenant_id","katastr_person_id");