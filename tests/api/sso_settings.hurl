# Test Suite for SSO Configuration Settings API

# Attempt to GET SSO settings (unauthenticated)
GET http://localhost:3000/api/admin/settings/sso
HTTP 401 # Expect Unauthorized

# Sign in as a regular user (not admin)
POST http://localhost:3000/api/authentication/signup
Content-Type: application/json
{
    "username": "testssouser",
    "email": "testssouser@example.com",
    "password": "password123"
}
HTTP 200
[Captures]
user_sacred_cookie: cookie "__HEMMELIG_TOKEN"
user_public_cookie: cookie "__HEMMELIG_TOKEN_PUBLIC"

# Attempt to GET SSO settings as regular user
GET http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{user_sacred_cookie}}; public={{user_public_cookie}}
HTTP 403 # Expect Forbidden

# Attempt to PUT SSO settings as regular user
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{user_sacred_cookie}}; public={{user_public_cookie}}
Content-Type: application/json
{
    "sso_client_id": "testclient",
    "sso_enabled": true
}
HTTP 403 # Expect Forbidden


# Sign in as admin (assuming admin user 'groot' exists from seeding or previous tests)
POST http://localhost:3000/api/authentication/signin
Content-Type: application/json
{
    "username": "groot",
    "password": "iamgroot"
}
HTTP 200
[Captures]
admin_sacred_cookie: cookie "__HEMMELIG_TOKEN"
admin_public_cookie: cookie "__HEMMELIG_TOKEN_PUBLIC"

# GET SSO settings as admin (should succeed)
GET http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
HTTP 200
[Asserts]
jsonpath "$.sso_client_id" exists
jsonpath "$.sso_client_secret" exists
jsonpath "$.sso_authorization_url" exists
jsonpath "$.sso_token_url" exists
jsonpath "$.sso_user_info_url" exists
jsonpath "$.sso_enabled" isBoolean

# PUT SSO settings as admin (update some fields)
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
Content-Type: application/json
{
    "sso_client_id": "admin_updated_client_id",
    "sso_client_secret": "admin_updated_client_secret",
    "sso_authorization_url": "https://example.com/auth_updated",
    "sso_token_url": "https://example.com/token_updated",
    "sso_user_info_url": "https://example.com/userinfo_updated",
    "sso_enabled": true
}
HTTP 200
[Asserts]
jsonpath "$.sso_client_id" == "admin_updated_client_id"
jsonpath "$.sso_client_secret" == "admin_updated_client_secret"
jsonpath "$.sso_authorization_url" == "https://example.com/auth_updated"
jsonpath "$.sso_token_url" == "https://example.com/token_updated"
jsonpath "$.sso_user_info_url" == "https://example.com/userinfo_updated"
jsonpath "$.sso_enabled" == true

# GET SSO settings again as admin to verify persistence
GET http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
HTTP 200
[Asserts]
jsonpath "$.sso_client_id" == "admin_updated_client_id"
jsonpath "$.sso_client_secret" == "admin_updated_client_secret"
jsonpath "$.sso_authorization_url" == "https://example.com/auth_updated"
jsonpath "$.sso_token_url" == "https://example.com/token_updated"
jsonpath "$.sso_user_info_url" == "https://example.com/userinfo_updated"
jsonpath "$.sso_enabled" == true

# PUT SSO settings as admin (disable SSO and clear some fields)
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
Content-Type: application/json
{
    "sso_client_id": "cleared_id",
    "sso_client_secret": "",
    "sso_authorization_url": "https://cleared.com/auth",
    "sso_token_url": "",
    "sso_user_info_url": "",
    "sso_enabled": false
}
HTTP 200
[Asserts]
jsonpath "$.sso_client_id" == "cleared_id"
jsonpath "$.sso_client_secret" == ""
jsonpath "$.sso_authorization_url" == "https://cleared.com/auth"
jsonpath "$.sso_token_url" == ""
jsonpath "$.sso_user_info_url" == ""
jsonpath "$.sso_enabled" == false

# GET public settings (unauthenticated) to ensure client_secret is not exposed
GET http://localhost:3000/api/admin/settings
HTTP 200
[Asserts]
jsonpath "$.sso_client_id" == "cleared_id" # client_id can be public
jsonpath "$.sso_client_secret" not exists # client_secret MUST NOT be public
jsonpath "$.sso_authorization_url" == "https://cleared.com/auth" # auth_url can be public
jsonpath "$.sso_token_url" == "" # token_url can be public (if set)
jsonpath "$.sso_user_info_url" == "" # user_info_url can be public (if set)
jsonpath "$.sso_enabled" == false # sso_enabled status can be public

# Attempt to PUT SSO settings with invalid data types (e.g., boolean for URL)
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
Content-Type: application/json
{
    "sso_client_id": "valid_id",
    "sso_client_secret": "valid_secret",
    "sso_authorization_url": true, # Invalid type
    "sso_token_url": "https://example.com/token",
    "sso_user_info_url": "https://example.com/userinfo",
    "sso_enabled": true
}
HTTP 400 # Expect Bad Request due to schema validation (if strict enough)
# Note: Depending on server validation, this might also be a 500 or pass if not strictly validated.
# For this test, assuming schema validation catches type errors for URLs. If not, this might need adjustment.

# Restore SSO settings to a known disabled state for subsequent tests
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
Content-Type: application/json
{
    "sso_client_id": "",
    "sso_client_secret": "",
    "sso_authorization_url": "",
    "sso_token_url": "",
    "sso_user_info_url": "",
    "sso_enabled": false
}
HTTP 200
[Asserts]
jsonpath "$.sso_enabled" == false
jsonpath "$.sso_client_id" == ""

# Sign out admin (optional, good practice)
POST http://localhost:3000/api/authentication/signout
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
HTTP 200
[Asserts]
header "Set-Cookie" contains "__HEMMELIG_TOKEN=;"
header "Set-Cookie" contains "__HEMMELIG_TOKEN_PUBLIC=;"

# Clean up: Delete the test user (if your API supports user deletion by admin)
# This step depends on having a user deletion endpoint and the 'groot' admin user having rights.
# For now, this is commented out as user management tests are in admin.hurl
# DELETE http://localhost:3000/api/admin/users
# Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}} # Need to re-login admin if signed out
# Content-Type: application/json
# {
#    "username": "testssouser"
# }
# HTTP 200
