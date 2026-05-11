-- Safe migration: Check if columns exist before adding
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "building_share_numerator" integer;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "building_share_denominator" integer;--> statement-breakpoint

-- Migrate existing data only if the old column still exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='units' AND column_name='building_share') THEN
        UPDATE "units"
        SET
          "building_share_numerator" = ("building_share" * 100000000)::integer,
          "building_share_denominator" = 100000000
        WHERE "building_share" IS NOT NULL AND "building_share_numerator" IS NULL;
    END IF;
END $$;
--> statement-breakpoint

-- Set defaults for any missing values
UPDATE "units"
SET
  "building_share_numerator" = 0,
  "building_share_denominator" = 1
WHERE "building_share_numerator" IS NULL;--> statement-breakpoint

ALTER TABLE "units" ALTER COLUMN "building_share_numerator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "units" ALTER COLUMN "building_share_denominator" SET NOT NULL;--> statement-breakpoint

-- Drop old column only if it exists
ALTER TABLE "units" DROP COLUMN IF EXISTS "building_share";