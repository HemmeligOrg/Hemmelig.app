-- AlterTable
ALTER TABLE "instance_settings" ADD COLUMN "allowFileUploads" BOOLEAN DEFAULT true;

-- CreateIndex
CREATE INDEX "secrets_expires_at_idx" ON "secrets"("expires_at");

-- CreateIndex
CREATE INDEX "secrets_userId_idx" ON "secrets"("userId");

-- CreateIndex
CREATE INDEX "visitor_analytics_uniqueId_idx" ON "visitor_analytics"("uniqueId");
