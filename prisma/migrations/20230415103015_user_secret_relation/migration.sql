-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Secret" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "title" TEXT,
    "maxViews" INTEGER NOT NULL DEFAULT 1,
    "password" TEXT,
    "allowed_ip" TEXT,
    "preventBurn" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "user_id" TEXT,
    CONSTRAINT "Secret_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Secret" ("allowed_ip", "data", "expiresAt", "id", "maxViews", "password", "preventBurn", "title") SELECT "allowed_ip", "data", "expiresAt", "id", "maxViews", "password", "preventBurn", "title" FROM "Secret";
DROP TABLE "Secret";
ALTER TABLE "new_Secret" RENAME TO "Secret";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
