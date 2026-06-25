-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('REVENUE', 'EXPENSE', 'PURCHASE');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_type_idx" ON "categories"("type");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "categories_name_type_key" ON "categories"("name", "type");

-- AlterTable: convert revenues.category from enum to TEXT
ALTER TABLE "revenues" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;

-- AlterTable: convert expenses.expenseType from enum to TEXT
ALTER TABLE "expenses" ALTER COLUMN "expenseType" TYPE TEXT USING "expenseType"::TEXT;

-- DropEnum
DROP TYPE "RevenueCategory";

-- DropEnum
DROP TYPE "ExpenseType";
