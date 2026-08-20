-- AlterTable
ALTER TABLE "secrets" ADD COLUMN "failed_password_attempts" INTEGER DEFAULT 0;
ALTER TABLE "secrets" ADD COLUMN "limit_password_attempts" BOOLEAN DEFAULT true;
ALTER TABLE "secrets" ADD COLUMN "max_password_attempts" INTEGER DEFAULT 5;
