-- AlterTable - Add organization fields
ALTER TABLE "instance_settings" ADD COLUMN "allowedEmailDomains" TEXT DEFAULT '';
ALTER TABLE "instance_settings" ADD COLUMN "requireRegisteredUser" BOOLEAN DEFAULT false;
