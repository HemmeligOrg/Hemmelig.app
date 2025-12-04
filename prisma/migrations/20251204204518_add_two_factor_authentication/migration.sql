-- AlterTable
ALTER TABLE "user" ADD COLUMN "twoFactorBackupCodes" TEXT;
ALTER TABLE "user" ADD COLUMN "twoFactorEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN "twoFactorSecret" TEXT;
