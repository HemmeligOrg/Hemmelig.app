/*
  Warnings:

  - You are about to drop the column `fromEmail` on the `instance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `fromName` on the `instance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtpHost` on the `instance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtpPassword` on the `instance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtpPort` on the `instance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtpSecure` on the `instance_settings` table. All the data in the column will be lost.
  - You are about to drop the column `smtpUsername` on the `instance_settings` table. All the data in the column will be lost.

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_instance_settings" ("allowIpRestriction", "allowPasswordProtection", "allowRegistration", "createdAt", "defaultSecretExpiration", "enableRateLimiting", "id", "instanceDescription", "instanceName", "maxSecretSize", "rateLimitRequests", "rateLimitWindow", "requireEmailVerification", "updatedAt") SELECT "allowIpRestriction", "allowPasswordProtection", "allowRegistration", "createdAt", "defaultSecretExpiration", "enableRateLimiting", "id", "instanceDescription", "instanceName", "maxSecretSize", "rateLimitRequests", "rateLimitWindow", "requireEmailVerification", "updatedAt" FROM "instance_settings";
DROP TABLE "instance_settings";
ALTER TABLE "new_instance_settings" RENAME TO "instance_settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
