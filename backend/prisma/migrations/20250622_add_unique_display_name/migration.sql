-- Add unique constraint to display_name column and make it non-nullable
-- Update existing NULL display_name values first
UPDATE "users" SET "display_name" = CONCAT('User', SUBSTRING("id", LENGTH("id") - 5)) WHERE "display_name" IS NULL;

-- Add NOT NULL constraint
ALTER TABLE "users" ALTER COLUMN "display_name" SET NOT NULL;

-- Add unique constraint
ALTER TABLE "users" ADD CONSTRAINT "users_display_name_key" UNIQUE ("display_name");

-- Add index for display_name (if not already added by unique constraint)
CREATE INDEX IF NOT EXISTS "users_display_name_idx" ON "users"("display_name");