-- AlterTable
ALTER TABLE "instance_settings" ADD COLUMN "metricsEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "instance_settings" ADD COLUMN "metricsSecret" TEXT DEFAULT '';
