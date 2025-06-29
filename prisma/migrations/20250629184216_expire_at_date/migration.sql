/*
  Warnings:

  - You are about to alter the column `expires_at` on the `secrets` table. The data in that column could be lost. The data in that column will be cast from `Int` to `DateTime`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_secrets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "secret" BLOB NOT NULL,
    "title" BLOB NOT NULL,
    "views" INTEGER DEFAULT 1,
    "password" TEXT,
    "is_burnable" BOOLEAN DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "ip_range" TEXT DEFAULT ''
);
INSERT INTO "new_secrets" ("created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "views") SELECT "created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "views" FROM "secrets";
DROP TABLE "secrets";
ALTER TABLE "new_secrets" RENAME TO "secrets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
