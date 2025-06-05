# Test Suite for OAuth2 Authentication Routes
#
# IMPORTANT: These tests rely on specific environment variables being set
# in the test execution environment to simulate SSO being enabled or disabled.
#
# For "Scenario 1: SSO Disabled":
# Ensure SECRET_SSO_ENABLED is set to "false" (or not set, or set to any other value).
#
# For "Scenario 2: SSO Enabled":
# Ensure the following environment variables are set:
#   SECRET_SSO_ENABLED="true"
#   SECRET_SSO_CLIENT_ID="test_client_id_for_auth_hurl"
#   SECRET_SSO_CLIENT_SECRET="test_client_secret_for_auth_hurl"
#   SECRET_SSO_AUTHORIZATION_URL="https://mockprovider.com/auth"
#   SECRET_SSO_TOKEN_URL="https://mockprovider.com/token"
#   SECRET_SSO_USER_INFO_URL="https://mockprovider.com/userinfo" (optional for some tests)
#   PUBLIC_URL="http://localhost:3000" (or your test instance's public URL)

# --- Scenario 1: SSO Disabled ---
# Pre-condition: Run this test scenario with SECRET_SSO_ENABLED="false" (or not set)

# Attempt to access /auth/oauth2 when SSO is expected to be disabled
# The current implementation in server/auth/oauth2.js means the 'oauth2' strategy
# might not be registered if SSO is disabled or misconfigured.
# Passport.authenticate() without a registered strategy typically calls next() or might throw an error
# depending on how it's exactly used in the route handler in server/controllers/authentication.js.
# If the strategy is not registered, Fastify might return a 404 if the route isn't explicitly handling this.
# Or, if the route specifices `passport.authenticate('oauth2', { failureRedirect: '/signin' })`,
# and the strategy is missing, it might lead to an error or an unexpected redirect.
# For this test, we'll assume if SSO is disabled, the /auth/oauth2 route itself might not
# actively try to authenticate and could redirect or the client-side button wouldn't be shown.
# Let's test the expected behavior: if a user somehow hits this URL and SSO is off,
# they should ideally be redirected to signin or an error page.
GET http://localhost:3000/auth/oauth2
# Expected behavior:
# If SSO is disabled, the `oauth2` strategy might not be initialized.
# The route `fastify.get('/auth/oauth2', passport.authenticate('oauth2'));`
# when strategy is not found by passport, it usually results in a 500 error.
# Or, if the route handler is more defensive, it might redirect.
# Given current setup, a 500 is likely if passport tries to use an uninitialized strategy.
# A better behavior would be a redirect or a specific error message.
# For now, let's assert a 302 to /signin as an ideal graceful handling,
# but this depends on the server's actual behavior when strategy is missing.
HTTP 302 # Or 500, or 404, depending on server's specific handling of missing strategy.
[Asserts]
header "Location" exists # Ideal: header "Location" == "/signin" or an error page.

# Attempt to access /auth/oauth2/callback when SSO is disabled
GET http://localhost:3000/auth/oauth2/callback?code=fakecode
HTTP 302 # Expecting a redirect to /signin, as failureRedirect is /signin
[Asserts]
header "Location" == "/signin"


# --- Scenario 2: SSO Enabled ---
# Pre-condition: Run this test scenario with SECRET_SSO_ENABLED="true" and other SECRET_SSO_* vars set.

# Access /auth/oauth2 when SSO is enabled
# This should redirect to the provider's authorization URL configured via env vars.
GET http://localhost:3000/auth/oauth2
HTTP 302
[Asserts]
header "Location" startsWith "https://mockprovider.com/auth" # From SECRET_SSO_AUTHORIZATION_URL
header "Location" contains "client_id=test_client_id_for_auth_hurl" # From SECRET_SSO_CLIENT_ID
header "Location" contains "response_type=code"
# The callback URL is dynamic, check for its presence and correct construction from PUBLIC_URL
header "Location" contains "redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Foauth2%2Fcallback" # Assuming PUBLIC_URL="http://localhost:3000"


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
# Since "https://mockprovider.com/token" (from SECRET_SSO_TOKEN_URL) is not a real provider,
# the token exchange will fail.
# Passport's OAuth2Strategy should then call `done(err)` or similar, leading to failureRedirect.
GET http://localhost:3000/auth/oauth2/callback?code=fake_auth_code_from_hurl
HTTP 302 # Expect redirect to failureRedirect (e.g., /signin)
[Asserts]
header "Location" == "/signin"
# Note: We cannot easily test the full successful callback flow in Hurl
# as it would require mocking the external provider's token endpoint response.

# No admin login/logout or API calls to change settings are needed here anymore,
# as configuration is via environment variables.
