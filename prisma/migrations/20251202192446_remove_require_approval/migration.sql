/*
  Warnings:

  - You are about to drop the column `requireApproval` on the `instance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `approved` on the `user` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_instance_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "instanceName" TEXT DEFAULT '',
    "instanceDescription" TEXT DEFAULT '',
    "allowRegistration" BOOLEAN DEFAULT true,
    "requireEmailVerification" BOOLEAN DEFAULT false,
    "defaultSecretExpiration" INTEGER DEFAULT 72,
    "maxSecretSize" INTEGER DEFAULT 1024,
    "allowPasswordProtection" BOOLEAN DEFAULT true,
    "allowIpRestriction" BOOLEAN DEFAULT true,
    "enableRateLimiting" BOOLEAN DEFAULT true,
    "rateLimitRequests" INTEGER DEFAULT 100,
    "rateLimitWindow" INTEGER DEFAULT 60,
    "requireInviteCode" BOOLEAN DEFAULT false,
    "logoUrl" TEXT DEFAULT '',
    "primaryColor" TEXT DEFAULT '#14b8a6',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_instance_settings" ("allowIpRestriction", "allowPasswordProtection", "allowRegistration", "createdAt", "defaultSecretExpiration", "enableRateLimiting", "id", "instanceDescription", "instanceName", "logoUrl", "maxSecretSize", "primaryColor", "rateLimitRequests", "rateLimitWindow", "requireEmailVerification", "requireInviteCode", "updatedAt") SELECT "allowIpRestriction", "allowPasswordProtection", "allowRegistration", "createdAt", "defaultSecretExpiration", "enableRateLimiting", "id", "instanceDescription", "instanceName", "logoUrl", "maxSecretSize", "primaryColor", "rateLimitRequests", "rateLimitWindow", "requireEmailVerification", "requireInviteCode", "updatedAt" FROM "instance_settings";
DROP TABLE "instance_settings";
ALTER TABLE "new_instance_settings" RENAME TO "instance_settings";
CREATE TABLE "new_user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "displayUsername" TEXT,
    "role" TEXT DEFAULT 'user',
    "banned" BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" DATETIME,
    "inviteCodeUsed" TEXT
);
INSERT INTO "new_user" ("banExpires", "banReason", "banned", "createdAt", "displayUsername", "email", "emailVerified", "id", "image", "inviteCodeUsed", "name", "role", "updatedAt", "username") SELECT "banExpires", "banReason", "banned", "createdAt", "displayUsername", "email", "emailVerified", "id", "image", "inviteCodeUsed", "name", "role", "updatedAt", "username" FROM "user";
DROP TABLE "user";
ALTER TABLE "new_user" RENAME TO "user";
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
