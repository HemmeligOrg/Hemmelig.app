-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disable_users" BOOLEAN NOT NULL DEFAULT false,
    "disable_user_account_creation" BOOLEAN NOT NULL DEFAULT false,
    "read_only" BOOLEAN NOT NULL DEFAULT false,
    "disable_file_upload" BOOLEAN NOT NULL DEFAULT false,
    "hide_allowed_ip_input" BOOLEAN NOT NULL DEFAULT false,
    "restrict_organization_email" TEXT NOT NULL DEFAULT '',
    "sso_client_id" TEXT,
    "sso_client_secret" TEXT,
    "sso_authorization_url" TEXT,
    "sso_token_url" TEXT,
    "sso_user_info_url" TEXT,
    "sso_enabled" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Settings" ("disable_file_upload", "disable_user_account_creation", "disable_users", "hide_allowed_ip_input", "id", "read_only", "restrict_organization_email") SELECT "disable_file_upload", "disable_user_account_creation", "disable_users", "hide_allowed_ip_input", "id", "read_only", "restrict_organization_email" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
