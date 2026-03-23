# Assumes a fresh local instance is running on localhost:5173.
# `localhost` keeps the browser-style session cookie flow, while `127.0.0.1`
# avoids reusing that cookie for the anonymous and bearer-only cases.

# Bootstrap the instance with an admin user.
POST http://localhost:5173/api/setup/complete
Content-Type: application/json
Origin: http://localhost:5173
{
  "email": "hurl-admin@hemmelig.local",
  "password": "HurlAdminPass123!",
  "username": "hurladmin",
  "name": "Hurl Admin"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Sign in to obtain a session cookie for admin-only settings and API key creation.
POST http://localhost:5173/api/auth/sign-in/email
Content-Type: application/json
Origin: http://localhost:5173
{
  "email": "hurl-admin@hemmelig.local",
  "password": "HurlAdminPass123!"
}
HTTP 200
[Asserts]
header "set-cookie" contains "better-auth.session_token="

# Mint an API key that will be used for authenticated secret creation.
POST http://localhost:5173/api/api-keys
Content-Type: application/json
Origin: http://localhost:5173
{
  "name": "hurl-create-secret",
  "expiresInDays": 30
}
HTTP 201
[Captures]
api_key: jsonpath "$.key"
[Asserts]
jsonpath "$.key" matches "^hemmelig_"

# Require authenticated users for secret creation.
PUT http://localhost:5173/api/instance/settings
Content-Type: application/json
Origin: http://localhost:5173
{
  "requireRegisteredUser": true
}
HTTP 200
[Asserts]
jsonpath "$.requireRegisteredUser" == true

# A valid bearer API key should satisfy the registered-user requirement.
POST http://127.0.0.1:5173/api/secrets
Content-Type: application/json
Authorization: Bearer {{api_key}}
{
  "secret": { "0": 116, "1": 101, "2": 115, "3": 116 },
  "title": { "0": 78, "1": 111, "2": 116, "3": 101 },
  "salt": "hurl-api-key-salt",
  "expiresAt": 3600,
  "views": 1,
  "isBurnable": true,
  "ipRange": null
}
HTTP 201
[Captures]
api_key_secret_id: jsonpath "$.id"
[Asserts]
jsonpath "$.id" exists

# No auth must still fail while registered users are required.
POST http://127.0.0.1:5173/api/secrets
Content-Type: application/json
{
  "secret": { "0": 110, "1": 111, "2": 45, "3": 97, "4": 117, "5": 116, "6": 104 },
  "title": { "0": 78, "1": 111, "2": 32, "3": 65, "4": 117, "5": 116, "6": 104 },
  "salt": "hurl-no-auth-salt",
  "expiresAt": 3600,
  "views": 1,
  "isBurnable": true,
  "ipRange": null
}
HTTP 401
[Asserts]
jsonpath "$.error" == "Only registered users can create secrets"

# Malformed or invalid bearer auth must fail clearly.
POST http://127.0.0.1:5173/api/secrets
Content-Type: application/json
Authorization: Bearer invalid_key
{
  "secret": { "0": 98, "1": 97, "2": 100 },
  "title": { "0": 66, "1": 97, "2": 100 },
  "salt": "hurl-invalid-bearer-salt",
  "expiresAt": 3600,
  "views": 1,
  "isBurnable": true,
  "ipRange": null
}
HTTP 401
[Asserts]
jsonpath "$.error" == "Invalid API key format"

# Well-formed but nonexistent bearer keys must also fail clearly.
POST http://127.0.0.1:5173/api/secrets
Content-Type: application/json
Authorization: Bearer hemmelig_notarealkey
{
  "secret": { "0": 98, "1": 97, "2": 100, "3": 50 },
  "title": { "0": 66, "1": 97, "2": 100, "3": 50 },
  "salt": "hurl-invalid-real-format-salt",
  "expiresAt": 3600,
  "views": 1,
  "isBurnable": true,
  "ipRange": null
}
HTTP 401
[Asserts]
jsonpath "$.error" == "Invalid API key"

# Relax the instance policy and verify anonymous creation still works.
PUT http://localhost:5173/api/instance/settings
Content-Type: application/json
Origin: http://localhost:5173
{
  "requireRegisteredUser": false
}
HTTP 200
[Asserts]
jsonpath "$.requireRegisteredUser" == false

POST http://127.0.0.1:5173/api/secrets
Content-Type: application/json
{
  "secret": { "0": 111, "1": 112, "2": 101, "3": 110 },
  "title": { "0": 79, "1": 112, "2": 101, "3": 110 },
  "salt": "hurl-anon-salt",
  "expiresAt": 3600,
  "views": 1,
  "isBurnable": true,
  "ipRange": null
}
HTTP 201
[Asserts]
jsonpath "$.id" exists

# Existing authenticated GET behavior should remain intact for API keys.
GET http://127.0.0.1:5173/api/secrets
Authorization: Bearer {{api_key}}
HTTP 200
[Asserts]
jsonpath "$.data[0].id" exists
jsonpath "$.meta.total" >= 1
