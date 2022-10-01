-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "ext" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "secretId" TEXT NOT NULL,
    CONSTRAINT "File_secretId_fkey" FOREIGN KEY ("secretId") REFERENCES "Secret" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Secret" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" TEXT NOT NULL,
    "title" TEXT,
    "maxViews" INTEGER NOT NULL DEFAULT 1,
    "password" TEXT,
    "allowed_ip" TEXT,
    "preventBurn" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Statistic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" INTEGER NOT NULL DEFAULT 1
);
