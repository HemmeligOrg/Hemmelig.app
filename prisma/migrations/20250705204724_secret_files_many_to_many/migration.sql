/*
  Warnings:

  - You are about to drop the column `fileId` on the `secrets` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_FileToSecrets" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FileToSecrets_A_fkey" FOREIGN KEY ("A") REFERENCES "files" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FileToSecrets_B_fkey" FOREIGN KEY ("B") REFERENCES "secrets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "ip_range" TEXT DEFAULT '',
    "userId" TEXT,
    CONSTRAINT "secrets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_secrets" ("created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "userId", "views") SELECT "created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "userId", "views" FROM "secrets";
DROP TABLE "secrets";
ALTER TABLE "new_secrets" RENAME TO "secrets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_FileToSecrets_AB_unique" ON "_FileToSecrets"("A", "B");

-- CreateIndex
CREATE INDEX "_FileToSecrets_B_index" ON "_FileToSecrets"("B");
