/*
  Warnings:

  - The primary key for the `secrets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_public` on the `secrets` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_secrets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "secret" TEXT NOT NULL,
    "title" TEXT,
    "views" INTEGER DEFAULT 1,
    "password" TEXT,
    "is_burnable" BOOLEAN DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME,
    "ip_range" TEXT DEFAULT ''
);
INSERT INTO "new_secrets" ("created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "views") SELECT "created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "views" FROM "secrets";
DROP TABLE "secrets";
ALTER TABLE "new_secrets" RENAME TO "secrets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
