-- AlterTable
ALTER TABLE "twoFactor" ADD COLUMN "failedVerificationCount" INTEGER DEFAULT 0;
ALTER TABLE "twoFactor" ADD COLUMN "lockedUntil" DATETIME;
ALTER TABLE "twoFactor" ADD COLUMN "verified" BOOLEAN DEFAULT true;
