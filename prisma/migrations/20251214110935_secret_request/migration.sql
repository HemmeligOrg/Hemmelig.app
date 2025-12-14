-- CreateTable
CREATE TABLE "secret_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "max_views" INTEGER NOT NULL DEFAULT 1,
    "expires_in" INTEGER NOT NULL,
    "password" TEXT,
    "allowed_ip" TEXT,
    "prevent_burn" BOOLEAN NOT NULL DEFAULT false,
    "token" TEXT NOT NULL,
    "webhook_url" TEXT,
    "webhook_secret" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "user_id" TEXT NOT NULL,
    "secret_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "fulfilled_at" DATETIME,
    CONSTRAINT "secret_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "secret_requests_secret_id_fkey" FOREIGN KEY ("secret_id") REFERENCES "secrets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "secret_requests_token_key" ON "secret_requests"("token");

-- CreateIndex
CREATE UNIQUE INDEX "secret_requests_secret_id_key" ON "secret_requests"("secret_id");

-- CreateIndex
CREATE INDEX "secret_requests_user_id_idx" ON "secret_requests"("user_id");

-- CreateIndex
CREATE INDEX "secret_requests_token_idx" ON "secret_requests"("token");

-- CreateIndex
CREATE INDEX "secret_requests_status_idx" ON "secret_requests"("status");
