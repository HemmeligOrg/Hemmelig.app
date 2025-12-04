-- AlterTable
ALTER TABLE "instance_settings" ADD COLUMN "webhookEnabled" BOOLEAN DEFAULT false;
ALTER TABLE "instance_settings" ADD COLUMN "webhookOnBurn" BOOLEAN DEFAULT true;
ALTER TABLE "instance_settings" ADD COLUMN "webhookOnView" BOOLEAN DEFAULT true;
ALTER TABLE "instance_settings" ADD COLUMN "webhookSecret" TEXT DEFAULT '';
ALTER TABLE "instance_settings" ADD COLUMN "webhookUrl" TEXT DEFAULT '';
