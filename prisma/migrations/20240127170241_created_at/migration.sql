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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "user_id" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Secret_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Secret" ("allowed_ip", "data", "expiresAt", "id", "ipAddress", "isPublic", "maxViews", "password", "preventBurn", "title", "user_id") SELECT "allowed_ip", "data", "expiresAt", "id", "ipAddress", "isPublic", "maxViews", "password", "preventBurn", "title", "user_id" FROM "Secret";
DROP TABLE "Secret";
ALTER TABLE "new_Secret" RENAME TO "Secret";
CREATE UNIQUE INDEX "Secret_id_key" ON "Secret"("id");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "generated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("email", "generated", "id", "password", "role", "username") SELECT "email", "generated", "id", "password", "role", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
