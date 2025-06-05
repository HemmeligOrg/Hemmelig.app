# Test Suite for OAuth2 Authentication Routes

# --- Scenario 1: SSO Disabled ---

# Sign in as admin
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

# Ensure SSO is disabled
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
Content-Type: application/json
{
    "sso_enabled": false,
    "sso_client_id": "",
    "sso_client_secret": "",
    "sso_authorization_url": "",
    "sso_token_url": "",
    "sso_user_info_url": ""
}
HTTP 200
[Asserts]
jsonpath "$.sso_enabled" == false

# Attempt to access /auth/oauth2 when SSO is disabled
# The behavior might be a redirect to signin, or a specific message/error page.
# Assuming it redirects to signin page or similar if SSO is not available/configured.
# Or it might be handled by the client-side routing if no explicit server route exists when disabled.
# For this test, let's assume the server-side route might not be actively mounted or redirects.
# If it's handled by client-side, this test might not be meaningful.
# Let's expect a redirect for now, or a 404 if the route isn't mounted.
GET http://localhost:3000/auth/oauth2
HTTP 302 # Expecting a redirect, perhaps to /signin or an error page
[Asserts]
header "Location" exists # Could check if it's /signin or a relevant error path

# Attempt to access /auth/oauth2/callback when SSO is disabled (e.g., with a fake code)
GET http://localhost:3000/auth/oauth2/callback?code=fakecode
HTTP 302 # Expecting a redirect, perhaps to /signin
[Asserts]
header "Location" == "/signin" # Or an error page


# --- Scenario 2: SSO Enabled ---

# Enable SSO with minimal valid URLs (actual exchange won't happen in Hurl)
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
Content-Type: application/json
{
    "sso_enabled": true,
    "sso_client_id": "test_client_id_for_auth_hurl",
    "sso_client_secret": "test_client_secret_for_auth_hurl",
    "sso_authorization_url": "https://mockprovider.com/auth",
    "sso_token_url": "https://mockprovider.com/token",
    "sso_user_info_url": "https://mockprovider.com/userinfo"
}
HTTP 200
[Asserts]
jsonpath "$.sso_enabled" == true
jsonpath "$.sso_client_id" == "test_client_id_for_auth_hurl"
jsonpath "$.sso_authorization_url" == "https://mockprovider.com/auth"

# Access /auth/oauth2 when SSO is enabled
# This should redirect to the provider's authorization URL
GET http://localhost:3000/auth/oauth2
HTTP 302
[Asserts]
header "Location" startsWith "https://mockprovider.com/auth"
header "Location" contains "client_id=test_client_id_for_auth_hurl"
header "Location" contains "response_type=code"
# The callback URL is dynamic, check for its presence
header "Location" contains "redirect_uri="


# Access /auth/oauth2/callback without a 'code' parameter
GET http://localhost:3000/auth/oauth2/callback
HTTP 302 # passport.authenticate('oauth2', { failureRedirect: '/signin' })
[Asserts]
header "Location" == "/signin"

# Access /auth/oauth2/callback with a 'state' parameter but no 'code'
GET http://localhost:3000/auth/oauth2/callback?state=somestate
HTTP 302
[Asserts]
header "Location" == "/signin"

# Access /auth/oauth2/callback with an 'error' parameter from provider
GET http://localhost:3000/auth/oauth2/callback?error=access_denied
HTTP 302
[Asserts]
header "Location" == "/signin" # Or a specific error page

# Access /auth/oauth2/callback with a fake 'code'
# This will reach our callback handler. Passport will try to exchange the code.
# Since "https://mockprovider.com/token" is not a real provider, the token exchange will fail.
# Passport's OAuth2Strategy should then call `done(err)` or similar, leading to failureRedirect.
GET http://localhost:3000/auth/oauth2/callback?code=fake_auth_code_from_hurl
HTTP 302 # Expect redirect to failureRedirect (e.g., /signin)
[Asserts]
header "Location" == "/signin"
# Note: We cannot easily test the full successful callback flow in Hurl
# as it would require mocking the external provider's token endpoint response.

# Clean up: Restore SSO settings to disabled
PUT http://localhost:3000/api/admin/settings/sso
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
Content-Type: application/json
{
    "sso_enabled": false,
    "sso_client_id": "",
    "sso_client_secret": "",
    "sso_authorization_url": "",
    "sso_token_url": "",
    "sso_user_info_url": ""
}
HTTP 200
[Asserts]
jsonpath "$.sso_enabled" == false

# Sign out admin
POST http://localhost:3000/api/authentication/signout
Cookie: sacred={{admin_sacred_cookie}}; public={{admin_public_cookie}}
HTTP 200
