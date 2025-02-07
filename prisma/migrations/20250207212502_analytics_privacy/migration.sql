/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `VisitorAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `referrer` on the `VisitorAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `VisitorAnalytics` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_VisitorAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "path" TEXT NOT NULL,
    "uniqueId" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_VisitorAnalytics" ("id", "path", "timestamp") SELECT "id", "path", "timestamp" FROM "VisitorAnalytics";
DROP TABLE "VisitorAnalytics";
ALTER TABLE "new_VisitorAnalytics" RENAME TO "VisitorAnalytics";
CREATE UNIQUE INDEX "VisitorAnalytics_id_key" ON "VisitorAnalytics"("id");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
