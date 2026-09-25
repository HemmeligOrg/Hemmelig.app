# API keys

An API key lets a script, the Hemmelig CLI or an MCP client call the Hemmelig API as you. The key has the same access as your account. The key of an admin can also use the admin routes.

Only the 3 routes that change credentials and the sign-in routes under `/api/auth` need a signed-in session. The 3 routes return `403` for a key. [Session-only routes](#session-only-routes) explains why.

## Create a key

1. Sign in to the web app.
2. Open **Dashboard**, then **Account**, then the **Developer** tab.
3. Enter a name and select an expiry.
4. Copy the key. The web app shows the key only one time.

Each user can have 5 keys. A key can expire after 1 to 365 days, or never. The server stores only a SHA-256 hash of the key.

To remove a key, delete it on the **Developer** tab or with `DELETE /api/api-keys/:id`.

## Send the key

Put the key in the `Authorization` header as a bearer token. The examples in this document use these 2 shell variables:

```bash
export HEMMELIG_URL=https://secrets.example.com
export HEMMELIG_API_KEY=hemmelig_your_key_here

curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/account"
```

The server returns these errors for a key:

| Status | Body                                                    | Cause                                              |
| ------ | ------------------------------------------------------- | -------------------------------------------------- |
| `401`  | `{"error":"Invalid API key"}`                           | The key does not exist or was deleted.             |
| `401`  | `{"error":"API key has expired"}`                       | The expiry date of the key is in the past.         |
| `401`  | `{"error":"Account is banned"}`                         | An admin banned the owner of the key.              |
| `403`  | `{"error":"Forbidden"}`                                 | The route needs the `admin` role.                  |
| `403`  | `{"error":"This action requires a signed-in session."}` | The route is [session-only](#session-only-routes). |

When a request has a session cookie, the server uses the session and ignores the `Authorization` header. Send only the key from scripts.

A request with a key and no cookie skips the CSRF origin check, because a CLI sends no `Origin` header. A cross-site form cannot set the `Authorization` header, so this is safe.

## Session-only routes

These routes need a signed-in session. A request with a key gets `403`:

| Method   | Route                   | Action                               |
| -------- | ----------------------- | ------------------------------------ |
| `PUT`    | `/api/account/password` | Change your password.                |
| `DELETE` | `/api/account`          | Delete your account.                 |
| `POST`   | `/api/api-keys`         | Create an API key.                   |
| all      | `/api/auth/*`           | Sign in, sign up, 2FA, social login. |

A key is a long-lived secret. Keys often live in shell history, CI variables and config files, so a key can leak. A leaked key must not let an attacker lock you out or create more keys. A session needs your password and your 2FA code, so the server accepts only a session for these routes.

To do these actions, sign in to the web app. In the CLI, run `hemmelig login`. See [cli.md](cli.md).

In the OpenAPI spec, these routes have the `x-session-only: true` extension.

## Encryption stays on your machine

The server never sees your plaintext. A key does not change this. The body of `POST /api/secrets` and `POST /api/files` must hold ciphertext that you made on the client. See [encryption.md](encryption.md).

`curl` cannot encrypt a secret. Use `curl` to list, delete and manage. Use the CLI or the SDK to create and read secrets.

## Account

Read your account:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/account"
```

Change your username and email:

```bash
curl -X PUT "$HEMMELIG_URL/api/account" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@example.com"}'
```

## API keys

List your keys. The response shows the name, the prefix and the dates of each key, not the key:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/api-keys"
```

Delete a key:

```bash
curl -X DELETE -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/api-keys/KEY_ID"
```

## Secrets

List the secrets that you created:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/secrets?page=1&limit=10"
```

`POST /api/secrets` returns the ID of the secret and a creator delete token:

```json
{ "id": "SECRET_ID", "deleteToken": "CREATOR_TOKEN" }
```

The creator token is valid until the secret expires. Keep it if you want to burn the secret later. A secret that you create without a key has no owner, so the token is the only way to delete it.

`DELETE /api/secrets/:id` accepts 1 of these:

- The key or the session of the owner.
- The creator token from `POST /api/secrets`.
- The delete token that the server gives to a viewer who opens the secret.

Delete a secret as its owner:

```bash
curl -X DELETE -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/secrets/SECRET_ID"
```

Delete a secret with a token. This request needs no key:

```bash
curl -X DELETE -H "x-hemmelig-delete-token: CREATOR_TOKEN" \
  "$HEMMELIG_URL/api/secrets/SECRET_ID"
```

Other requests get `403`.

## Secret requests

Ask a person to send you a secret. `expiresIn` is the lifetime of the secret in seconds. `validFor` is the lifetime of the request link in seconds. The API lists the accepted values in the OpenAPI spec:

```bash
curl -X POST "$HEMMELIG_URL/api/secret-requests" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Database password","maxViews":1,"expiresIn":3600,"validFor":86400}'
```

The response has `creatorLink`. Send this link to the person. When the request has no `Origin` header and the server has no `HEMMELIG_BASE_URL`, `creatorLink` is a path. Put your instance URL in front of it.

List, read and cancel requests:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/secret-requests"
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/secret-requests/REQUEST_ID"
curl -X DELETE -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/secret-requests/REQUEST_ID"
```

## Files

Upload an encrypted file as a raw body. `X-Hemmelig-File-Name` is the encrypted file name as hex:

```bash
curl -X POST "$HEMMELIG_URL/api/files" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  -H "X-Hemmelig-File-Name: ENCRYPTED_NAME_HEX" \
  --data-binary @report.pdf.enc
```

The response is `{ "id": "FILE_ID", "token": "UPLOAD_TOKEN" }`. To attach the file, send `"files": [{ "id": "FILE_ID", "token": "UPLOAD_TOKEN" }]` in `POST /api/secrets`.

## Admin: users

These routes need the key of an admin.

Create a user. The password must have 8 or more characters, with a lowercase letter, an uppercase letter and a digit. A username can have letters, digits and underscores. The registration settings do not apply to users that an admin creates:

```bash
curl -X POST "$HEMMELIG_URL/api/user" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","email":"bob@example.com","password":"Change-Me-123","role":"user"}'
```

List and search users:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/user?search=bob"
```

Change the role, the username or the email:

```bash
curl -X PUT "$HEMMELIG_URL/api/user/USER_ID" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"role":"admin"}'
```

Ban a user. `expiresInSeconds` is optional. Without it, the ban has no end. The ban signs the user out and stops their API keys at once:

```bash
curl -X POST "$HEMMELIG_URL/api/user/USER_ID/ban" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Left the company","expiresInSeconds":86400}'
```

Lift a ban:

```bash
curl -X POST -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/user/USER_ID/unban"
```

Set a new password for a user:

```bash
curl -X PUT "$HEMMELIG_URL/api/user/USER_ID/password" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"password":"New-Pass-456"}'
```

Delete a user. The server also deletes the sessions, API keys and secret requests of the user. The secrets of the user stay until they expire, without an owner:

```bash
curl -X DELETE -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/user/USER_ID"
```

An admin cannot ban, demote or delete their own account with these routes. The server returns `400`.

## Admin: invites

Create an invite code for 1 use that expires after 7 days:

```bash
curl -X POST "$HEMMELIG_URL/api/invites" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"maxUses":1,"expiresInDays":7}'
```

List and deactivate invite codes:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/invites"
curl -X DELETE -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/invites/INVITE_ID"
```

## Admin: instance settings

Read and change the instance settings:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" "$HEMMELIG_URL/api/instance/settings"

curl -X PUT "$HEMMELIG_URL/api/instance/settings" \
  -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"allowRegistration":false,"requireInviteCode":true}'
```

In managed mode, `PUT` returns `403`. Change the environment variables instead. See [managed.md](managed.md).

## Admin: analytics

Read the analytics for the last 7, 14 or 30 days:

```bash
curl -H "Authorization: Bearer $HEMMELIG_API_KEY" \
  "$HEMMELIG_URL/api/analytics?timeRange=7d"
```

## Reference

The Swagger UI at `/api/docs` and the spec at `/api/openapi.json` show every route, its body and the authentication that it accepts. A route that accepts a key lists `bearerAuth`.
