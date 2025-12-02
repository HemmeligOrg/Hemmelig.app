-- AlterTable
ALTER TABLE "instance_settings" ADD COLUMN "logoUrl" TEXT DEFAULT '';
ALTER TABLE "instance_settings" ADD COLUMN "primaryColor" TEXT DEFAULT '#14b8a6';
ALTER TABLE "instance_settings" ADD COLUMN "requireApproval" BOOLEAN DEFAULT false;
ALTER TABLE "instance_settings" ADD COLUMN "requireInviteCode" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "user" ADD COLUMN "approved" BOOLEAN DEFAULT true;
ALTER TABLE "user" ADD COLUMN "inviteCodeUsed" TEXT;

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER DEFAULT 1,
    "expiresAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");
