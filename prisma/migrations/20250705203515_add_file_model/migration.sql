-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    "fileId" TEXT,
    CONSTRAINT "secrets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "secrets_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "files" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_secrets" ("created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "userId", "views") SELECT "created_at", "expires_at", "id", "ip_range", "is_burnable", "password", "secret", "title", "userId", "views" FROM "secrets";
DROP TABLE "secrets";
ALTER TABLE "new_secrets" RENAME TO "secrets";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
