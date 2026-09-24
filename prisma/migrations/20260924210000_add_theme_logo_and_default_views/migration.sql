-- AlterTable
ALTER TABLE "instance_settings" ADD COLUMN "instanceLogoDark" TEXT DEFAULT '';
ALTER TABLE "instance_settings" ADD COLUMN "defaultTheme" TEXT DEFAULT 'dark';
ALTER TABLE "instance_settings" ADD COLUMN "defaultMaxViews" INTEGER DEFAULT 1;
