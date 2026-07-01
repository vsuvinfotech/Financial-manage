/*
  Warnings:

  - A unique constraint covering the columns `[name,type,companyId]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[storeId,date]` on the table `daily_closing` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,companyId]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,companyId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyId` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `daily_closing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `daily_closing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalTax` to the `daily_closing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyId` to the `revenues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `storeId` to the `revenues` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "categories_name_type_key";

-- DropIndex
DROP INDEX "daily_closing_date_key";

-- DropIndex
DROP INDEX "roles_name_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "companyId" TEXT NOT NULL,
ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "daily_closing" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "storeId" TEXT NOT NULL,
ADD COLUMN     "totalTax" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "revenues" ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "storeId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "companyId" TEXT,
ALTER COLUMN "permissions" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_store_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "user_store_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" TEXT NOT NULL,
    "taxType" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "storeId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "stores_companyId_idx" ON "stores"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "stores_name_companyId_key" ON "stores"("name", "companyId");

-- CreateIndex
CREATE INDEX "user_store_access_userId_idx" ON "user_store_access"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_store_access_userId_storeId_key" ON "user_store_access"("userId", "storeId");

-- CreateIndex
CREATE INDEX "taxes_date_idx" ON "taxes"("date");

-- CreateIndex
CREATE INDEX "taxes_companyId_date_idx" ON "taxes"("companyId", "date");

-- CreateIndex
CREATE INDEX "taxes_storeId_date_idx" ON "taxes"("storeId", "date");

-- CreateIndex
CREATE INDEX "categories_companyId_idx" ON "categories"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_type_companyId_key" ON "categories"("name", "type", "companyId");

-- CreateIndex
CREATE INDEX "daily_closing_companyId_date_idx" ON "daily_closing"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_closing_storeId_date_key" ON "daily_closing"("storeId", "date");

-- CreateIndex
CREATE INDEX "expenses_companyId_date_idx" ON "expenses"("companyId", "date");

-- CreateIndex
CREATE INDEX "expenses_storeId_date_idx" ON "expenses"("storeId", "date");

-- CreateIndex
CREATE INDEX "purchases_companyId_date_idx" ON "purchases"("companyId", "date");

-- CreateIndex
CREATE INDEX "purchases_storeId_date_idx" ON "purchases"("storeId", "date");

-- CreateIndex
CREATE INDEX "revenues_companyId_date_idx" ON "revenues"("companyId", "date");

-- CreateIndex
CREATE INDEX "revenues_storeId_date_idx" ON "revenues"("storeId", "date");

-- CreateIndex
CREATE INDEX "roles_companyId_idx" ON "roles"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_companyId_key" ON "roles"("name", "companyId");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_companyId_key" ON "users"("email", "companyId");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_store_access" ADD CONSTRAINT "user_store_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_store_access" ADD CONSTRAINT "user_store_access_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenues" ADD CONSTRAINT "revenues_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_closing" ADD CONSTRAINT "daily_closing_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
