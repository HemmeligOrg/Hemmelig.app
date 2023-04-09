-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "secretId" TEXT NOT NULL,
    CONSTRAINT "File_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_File" ("ext", "id", "key", "secretId", "type") SELECT "ext", "id", "key", "secretId", "type" FROM "File";
DROP TABLE "File";
ALTER TABLE "new_File" RENAME TO "File";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
