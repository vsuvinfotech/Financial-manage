-- Remove PURCHASE value from CategoryType enum
-- PostgreSQL does not support removing enum values, so we recreate the enum.

BEGIN;

-- 1. Create the new enum with only REVENUE and EXPENSE.
CREATE TYPE "CategoryType_new" AS ENUM ('REVENUE', 'EXPENSE');

-- 2. Delete any categories that used the old PURCHASE type.
DELETE FROM "categories" WHERE "type" = 'PURCHASE';

-- 3. Alter the categories table to use the new enum type.
ALTER TABLE "categories" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "categories" ALTER COLUMN "type" TYPE "CategoryType_new" USING "type"::TEXT::"CategoryType_new";
ALTER TABLE "categories" ALTER COLUMN "type" SET DEFAULT 'REVENUE';

-- 4. Drop the old enum and rename the new one.
DROP TYPE "CategoryType";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";

COMMIT;
