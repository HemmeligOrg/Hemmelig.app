#!/usr/bin/env bash
# End-to-end test of the Go CLI and the MCP server against a real Hemmelig
# server. The script stops at the first failure.
#
# Start a fresh server first. From the repository root:
#
#   export DATABASE_URL="file:$PWD/../cli-e2e.db"
#   npx prisma migrate deploy
#   NODE_ENV=production HEMMELIG_PORT=5194 BETTER_AUTH_SECRET=$(openssl rand -hex 32) \
#     BETTER_AUTH_URL=http://localhost:5194 HEMMELIG_BASE_URL=http://localhost:5194 \
#     npx tsx server.ts
#
# Then run the test from cli-go:
#
#   HEMMELIG_E2E_URL=http://localhost:5194 ./e2e/run.sh
#
# On a new database, the script creates the first admin with /api/setup/complete.
# On a database with users, set HEMMELIG_E2E_ADMIN_USERNAME and
# HEMMELIG_E2E_ADMIN_PASSWORD to an admin account. The script turns off the
# API rate limit while it runs and turns it on at the end. Needs: go, curl, jq.

set -euo pipefail
trap 'echo "FAIL: line $LINENO: $BASH_COMMAND" >&2' ERR

URL="${HEMMELIG_E2E_URL:-http://localhost:5194}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
unset HEMMELIG_API_KEY HEMMELIG_URL HEMMELIG_CONFIG_DIR

BIN="$WORK/hemmelig"
(cd "$ROOT" && go build -o "$BIN" . && go build -o "$WORK/totp" ./e2e/totp && go build -o "$WORK/mcpcheck" ./e2e/mcpcheck)

PASSED=0
pass() {
	PASSED=$((PASSED + 1))
	echo "PASS: $1"
}
die() {
	echo "FAIL: $1" >&2
	exit 1
}

# h <profile> <args...> runs the CLI with its own config directory per profile.
h() {
	local profile="$1"
	shift
	HEMMELIG_CONFIG_DIR="$WORK/$profile" HEMMELIG_URL="$URL" "$BIN" "$@"
}

# expect_exit <code> <name> <command...> checks the exit code of a command
# that must fail.
expect_exit() {
	local want="$1" name="$2" got
	shift 2
	set +e
	"$@" >"$WORK/out" 2>"$WORK/err" </dev/null
	got=$?
	set -e
	if [ "$got" != "$want" ]; then
		cat "$WORK/out" "$WORK/err" >&2
		die "$name: exit $got, want $want"
	fi
	pass "$name (exit $want as expected)"
}

# equal <name> <got> <want>
equal() {
	[ "$2" = "$3" ] || die "$1: got '$2', want '$3'"
	pass "$1"
}

contains() {
	case "$2" in
	*"$3"*) pass "$1" ;;
	*) die "$1: '$2' does not contain '$3'" ;;
	esac
}

random() { head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n'; }

# Better Auth allows 3 sign-in attempts from one address until it sees a gap
# of 10 seconds.
pause_login() { sleep 11; }

# ---------------------------------------------------------------- basics
equal "version" "$(h admin version)" "1.1.0"
equal "--version" "$(h admin --version)" "1.1.0"
contains "help" "$(h admin help)" "Commands:"
equal "health" "$(h admin health --json | jq -r .status)" "healthy"

# ---------------------------------------------------------------- setup
ADMIN_USER="${HEMMELIG_E2E_ADMIN_USERNAME:-e2e_admin}"
ADMIN_PASS="${HEMMELIG_E2E_ADMIN_PASSWORD:-Adm1n$(random)}"
if [ "$(curl -fsS "$URL/api/setup/status" | jq -r .needsSetup)" = "true" ]; then
	curl -fsS -X POST "$URL/api/setup/complete" -H 'Content-Type: application/json' -H "Origin: $URL" \
		-d "$(jq -n --arg u "$ADMIN_USER" --arg p "$ADMIN_PASS" '{username:$u,password:$p,email:"admin@e2e.example.com",name:"E2E Admin"}')" >/dev/null
	pass "setup: created the first admin"
elif [ -z "${HEMMELIG_E2E_ADMIN_PASSWORD:-}" ]; then
	die "the instance has users: set HEMMELIG_E2E_ADMIN_USERNAME and HEMMELIG_E2E_ADMIN_PASSWORD"
fi

# ---------------------------------------------------------------- config
h admin config set url "$URL" >/dev/null
equal "config set url, config get url" "$(h admin config get url)" "$URL"
contains "config path" "$(h admin config path)" "$WORK/admin/config.json"
equal "config file mode" "$(stat -c %a "$WORK/admin/config.json")" "600"

# ---------------------------------------------------------------- login
pause_login
printf '%s\n' "$ADMIN_PASS" | h admin login --username "$ADMIN_USER" >/dev/null
pass "login with a password from stdin"
# The test sends more requests than the default API rate limit allows.
h admin admin instance set security enableRateLimiting=false >/dev/null
equal "admin instance set security" "$(h admin admin instance get security --json | jq -r .enableRateLimiting)" "false"
WHOAMI="$(h admin whoami --json)"
equal "whoami auth method" "$(jq -r .authMethod <<<"$WHOAMI")" "session"
equal "whoami role" "$(jq -r .user.role <<<"$WHOAMI")" "admin"
equal "account show" "$(h admin account show --json | jq -r .username)" "$ADMIN_USER"
h admin account update --email "admin2@e2e.example.com" >/dev/null
equal "account update" "$(h admin account show --json | jq -r .email)" "admin2@e2e.example.com"

# ---------------------------------------------------------------- API keys
ADMIN_KEY="$(h admin account api-keys create --name e2e-admin --json | jq -r .key)"
contains "api-keys create" "$ADMIN_KEY" "hemmelig_"
SPARE_ID="$(h admin account api-keys create --name spare --expires-in-days 1 --json | jq -r .id)"
equal "api-keys list" "$(h admin account api-keys list --json | jq 'length')" "2"
h admin account api-keys revoke "$SPARE_ID" >/dev/null
equal "api-keys revoke" "$(h admin account api-keys list --json | jq 'length')" "1"

# key runs the CLI with the admin API key and no session.
key() { HEMMELIG_API_KEY="$ADMIN_KEY" h keyonly "$@"; }
equal "whoami with an API key" "$(key whoami --json | jq -r .authMethod)" "apiKey"
equal "account show with an API key" "$(key account show --json | jq -r .username)" "$ADMIN_USER"
h stored config set url "$URL" >/dev/null
h stored config set api-key "$ADMIN_KEY" >/dev/null
equal "config set api-key" "$(h stored whoami --json | jq -r .source)" "config file"
contains "config get masks the key" "$(h stored config get api-key)" "..."
expect_exit 3 "api-keys create needs a session" key account api-keys create --name nope
expect_exit 3 "account password needs a session" key account password
expect_exit 3 "account delete needs a session" key account delete --yes
equal "server rejects POST /api/api-keys with an API key" \
	"$(curl -s -o /dev/null -w '%{http_code}' -X POST "$URL/api/api-keys" -H "Authorization: Bearer $ADMIN_KEY" -H 'Content-Type: application/json' -d '{"name":"x"}')" "403"

# ---------------------------------------------------------------- secrets
LINK="$(key secrets create "plain e2e secret" --title "E2E title" --expires 1h --views 2)"
contains "secrets create prints a short link" "$LINK" "$URL/s/"
equal "secrets get" "$(key secrets get "$LINK" 2>/dev/null)" "plain e2e secret"
equal "secrets get --json title" "$(key secrets get "$LINK" --json | jq -r .title)" "E2E title"
expect_exit 4 "secrets get after the last view" key secrets get "$LINK"

LINK="$(h anon "legacy form secret" -e 1h -v 2)"
equal "legacy form hemmelig \"text\" -e -v" "$(h anon secrets get "$LINK" 2>/dev/null)" "legacy form secret"
ID="${LINK##*/s/}"
ID="${ID%%#*}"
KEY="${LINK##*#}"
h anon secrets delete "$ID" >/dev/null
pass "secrets delete with the stored reveal token"
expect_exit 4 "secrets get after delete" h anon secrets get "$ID" --key "$KEY"

LINK="$(printf 'from stdin\n' | h anon secrets create -e 5m)"
equal "secrets create from stdin" "$(h anon secrets get "$LINK" 2>/dev/null)" "from stdin"

printf 'file body %s\n' "$(random)" >"$WORK/notes.txt"
LINK="$(printf 'Pa55word\n' | key secrets create "with file" --password-prompt --file "$WORK/notes.txt" --expires 1h)"
case "$LINK" in *"#"*) die "a password link must not carry a key: $LINK" ;; esac
pass "secrets create with a password and a file: the link has no key"
expect_exit 2 "secrets get without the password" key secrets get "$LINK"
mkdir -p "$WORK/download"
BODY="$(key secrets get "$LINK" --password Pa55word --output-dir "$WORK/download" 2>/dev/null)"
equal "secrets get with the password" "$BODY" "with file"
cmp -s "$WORK/notes.txt" "$WORK/download/notes.txt" || die "the downloaded file differs"
pass "secrets get decrypts the attached file and its name"

LINK="$(key secrets create "file only listed" --file "$WORK/notes.txt" --expires 5m)"
equal "secrets read --no-files" "$(key secrets read "$LINK" --no-files --json | jq -r '.files[0].name + ":" + (.files[0].path // "none")')" "notes.txt:none"

LINK="$(key secrets create "no view limit" --no-view-limit --expires 5m)"
key secrets get "$LINK" >/dev/null 2>&1
key secrets get "$LINK" >/dev/null 2>&1
equal "secrets create --no-view-limit keeps the secret" "$(key secrets get "$LINK" --json | jq -r .viewsRemaining)" "null"
ID="${LINK##*/s/}"
ID="${ID%%#*}"
rm -f "$WORK/keyonly/tokens.json"
key secrets delete "$ID" >/dev/null
pass "secrets delete as the owner, without a token"

LINK="$(key secrets create "ip restricted" --ip 203.0.113.0/24 --expires 5m)"
expect_exit 3 "secrets create --ip blocks other addresses" key secrets get "$LINK"
contains "secrets list" "$(key secrets list)" "VIEWS LEFT"
test "$(key secrets list --json | jq '.meta.total')" -ge 3 || die "secrets list --json total"
pass "secrets list --json"
expect_exit 2 "secrets create with an invalid expiration" key secrets create x --expires 2y
expect_exit 3 "secrets list without credentials" h anon secrets list

# ---------------------------------------------------------------- requests
REQUEST="$(key requests create --title "E2E request" --description "Send the key" --valid-for 1d --expires 1h --json)"
REQUEST_ID="$(jq -r .id <<<"$REQUEST")"
REQUEST_LINK="$(jq -r .link <<<"$REQUEST")"
contains "requests create" "$REQUEST_LINK" "$URL/request/$REQUEST_ID#token="
equal "requests open without an account" "$(h anon requests open "$REQUEST_LINK" --json | jq -r .title)" "E2E request"
equal "requests list --status pending" "$(key requests list --status pending --json | jq -r --arg id "$REQUEST_ID" '[.data[] | select(.id == $id)] | length')" "1"
equal "requests show" "$(key requests show "$REQUEST_ID" --json | jq -r .link)" "$REQUEST_LINK"
FILLED="$(h anon requests submit "$REQUEST_LINK" "requested secret" --title "Answer")"
contains "requests submit" "$FILLED" "$URL/s/"
equal "read the submitted secret" "$(key secrets get "$FILLED" 2>/dev/null)" "requested secret"
equal "requests show after submit" "$(key requests show "$REQUEST_ID" --json | jq -r .status)" "fulfilled"
expect_exit 4 "requests submit twice" h anon requests submit "$REQUEST_LINK" "again"
SECOND="$(key requests create --title "To cancel" --json | jq -r .id)"
key requests cancel "$SECOND" >/dev/null
equal "requests cancel" "$(key requests show "$SECOND" --json | jq -r .status)" "cancelled"

# ---------------------------------------------------------------- 2FA
equal "2fa status off" "$(h admin account 2fa status --json | jq -r .enabled)" "false"
URI="$(printf '%s\n' "$ADMIN_PASS" | h admin account 2fa enable --no-verify --json | jq -r .totpURI)"
contains "2fa enable" "$URI" "otpauth://totp/"
h admin account 2fa verify "$("$WORK/totp" "$URI")" >/dev/null
equal "2fa verify" "$(h admin account 2fa status --json | jq -r .enabled)" "true"
h admin logout >/dev/null
equal "logout" "$(h admin whoami --json | jq -r .authMethod)" "none"
pause_login
printf '%s\n%s\n' "$ADMIN_PASS" "$("$WORK/totp" "$URI")" | h admin login --username "$ADMIN_USER" >/dev/null
pass "login with 2FA"
printf '%s\n' "$ADMIN_PASS" | h admin account 2fa disable >/dev/null
equal "2fa disable" "$(h admin account 2fa status --json | jq -r .enabled)" "false"

# ---------------------------------------------------------------- password
NEW_PASS="N3w$(random)"
printf '%s\n%s\n' "$ADMIN_PASS" "$NEW_PASS" | h admin account password >/dev/null
h admin logout >/dev/null
pause_login
printf '%s\n' "$NEW_PASS" | h admin login --username "$ADMIN_USER" >/dev/null
pass "account password, then login with the new password"
ADMIN_PASS="$NEW_PASS"

# ---------------------------------------------------------------- admin users
USER_PASS="Us3r$(random)"
printf '%s\n' "$USER_PASS" | h admin admin users create --username e2e_user --email user@e2e.example.com --name "E2E User" >/dev/null
equal "admin users create" "$(h admin admin users list --search e2e_user --json | jq -r '.users[0].username')" "e2e_user"
equal "admin users update --role admin" "$(h admin admin users update e2e_user --role admin --json | jq -r .role)" "admin"
equal "admin users update --role user" "$(h admin admin users update e2e_user --role user --json | jq -r .role)" "user"
equal "admin users ban" "$(h admin admin users ban e2e_user --reason "e2e" --duration 1d --json | jq -r .banned)" "true"
pause_login
expect_exit 3 "login as a banned user" sh -c "printf '%s\n' '$USER_PASS' | HEMMELIG_CONFIG_DIR='$WORK/user' HEMMELIG_URL='$URL' '$BIN' login --username e2e_user"
equal "admin users unban" "$(h admin admin users unban e2e_user --json | jq -r .banned)" "false"
USER_PASS="Us3r$(random)"
printf '%s\n' "$USER_PASS" | h admin admin users set-password e2e_user >/dev/null
pause_login
printf '%s\n' "$USER_PASS" | h user login --username e2e_user >/dev/null
pass "admin users set-password, then login as the user"
equal "whoami as a normal user" "$(h user whoami --json | jq -r .user.role)" "user"
USER_KEY="$(h user account api-keys create --name e2e-user --json | jq -r .key)"
expect_exit 3 "admin users list with a user key" env HEMMELIG_API_KEY="$USER_KEY" HEMMELIG_CONFIG_DIR="$WORK/userkey" HEMMELIG_URL="$URL" "$BIN" admin users list
expect_exit 3 "admin instance get with a user session" h user admin instance get

# ---------------------------------------------------------------- invites
INVITE="$(h admin admin invites create --max-uses 2 --expires-in-days 7 --json)"
CODE="$(jq -r .code <<<"$INVITE")"
test -n "$CODE" || die "admin invites create"
pass "admin invites create"
equal "admin invites list" "$(h admin admin invites list --json | jq -r --arg c "$CODE" '.[] | select(.code == $c) | .isActive')" "true"
h admin admin invites deactivate "$CODE" >/dev/null
equal "admin invites deactivate" "$(h admin admin invites list --json | jq -r --arg c "$CODE" '.[] | select(.code == $c) | .isActive')" "false"

# ---------------------------------------------------------------- instance
contains "admin instance get" "$(h admin admin instance get)" "allowFileUploads"
equal "admin instance get security" "$(h admin admin instance get security --json | jq 'has("instanceName")')" "false"
h admin admin instance set general "importantMessage=E2E notice" defaultMaxViews=3 >/dev/null
equal "admin instance set" "$(h admin admin instance get general --json | jq -r '.importantMessage + "," + (.defaultMaxViews | tostring)')" "E2E notice,3"
h admin admin instance set general importantMessage= defaultMaxViews=1 >/dev/null
pass "admin instance set restores the values"
expect_exit 2 "admin instance set with an unknown key" h admin admin instance set security nope=1

# ---------------------------------------------------------------- analytics
test "$(h admin admin analytics show --range 7d --json | jq '.secrets.totalSecrets')" -ge 1 || die "admin analytics show"
pass "admin analytics show --range 7d"
contains "admin analytics show" "$(h admin admin analytics show)" "totalSecrets"

# ---------------------------------------------------------------- MCP
HEMMELIG_URL="$URL" HEMMELIG_API_KEY="$ADMIN_KEY" HEMMELIG_CONFIG_DIR="$WORK/mcp" "$WORK/mcpcheck" "$BIN" admin
HEMMELIG_URL="$URL" HEMMELIG_API_KEY="$USER_KEY" HEMMELIG_CONFIG_DIR="$WORK/mcp" "$WORK/mcpcheck" "$BIN" user
expect_exit 1 "mcp without HEMMELIG_API_KEY" env HEMMELIG_URL="$URL" "$BIN" mcp

# ---------------------------------------------------------------- deletes
h admin admin users delete e2e_user --yes >/dev/null
equal "admin users delete" "$(h admin admin users list --search e2e_user --json | jq '.users | length')" "0"
printf '%s\n' "$USER_PASS" | h admin admin users create --username e2e_leaver --email leaver@e2e.example.com >/dev/null
pause_login
printf '%s\n' "$USER_PASS" | h leaver login --username e2e_leaver >/dev/null
h leaver account delete --yes >/dev/null
pass "account delete"
pause_login
expect_exit 3 "login after account delete" sh -c "printf '%s\n' '$USER_PASS' | HEMMELIG_CONFIG_DIR='$WORK/leaver' HEMMELIG_URL='$URL' '$BIN' login --username e2e_leaver"
h admin admin instance set security enableRateLimiting=true >/dev/null
pass "admin instance set restores the rate limit"
h admin config unset url >/dev/null
equal "config unset" "$(h admin config get url)" ""
h admin logout >/dev/null
pass "logout"

echo
echo "All $PASSED checks passed against $URL."
