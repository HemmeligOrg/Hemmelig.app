# Single Sign-On (SSO) with OAuth2/OpenID Connect

Hemmelig.app supports Single Sign-On (SSO) integration with any OAuth2/OpenID Connect (OIDC) compatible identity provider. This allows users to log in to Hemmelig.app using their existing credentials from your organization's identity provider.

## Table of Contents

- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
  - [Obtaining Values from Providers](#obtaining-values-from-providers)
    - [General Steps](#general-steps)
    - [Example: Keycloak](#example-keycloak)
    - [Example: Auth0](#example-auth0)
    - [Example: Okta](#example-okta)
- [Using SSO for Login](#using-sso-for-login)
  - [Login Flow](#login-flow)
- [Troubleshooting](#troubleshooting)
  - [Incorrect Environment Variable Configuration](#incorrect-environment-variable-configuration)
  - [Provider Errors](#provider-errors)
  - [Callback URL Mismatch](#callback-url-mismatch)
  - [User Information Mapping](#user-information-mapping)
  - [Verifying Environment Variables](#verifying-environment-variables)

## Configuration

SSO for Hemmelig.app is configured entirely through environment variables. The server must be restarted for any changes to these variables to take effect.

### Environment Variables

The following environment variables are used to configure SSO:

*   **`SECRET_SSO_ENABLED`**: (Required) Set to `"true"` to enable SSO functionality or `"false"` (or any other value) to disable it. If not explicitly set to `"true"`, SSO will be disabled.
*   **`SECRET_SSO_CLIENT_ID`**: (Required if SSO is enabled) The Client ID obtained from your OAuth2/OIDC provider when you register Hemmelig.app as an application.
*   **`SECRET_SSO_CLIENT_SECRET`**: (Required if SSO is enabled) The Client Secret obtained from your OAuth2/OIDC provider. This is a sensitive value and should be kept confidential.
*   **`SECRET_SSO_AUTHORIZATION_URL`**: (Required if SSO is enabled) The URL of your provider's authorization endpoint. Hemmelig.app will redirect users here to start the login process.
*   **`SECRET_SSO_TOKEN_URL`**: (Required if SSO is enabled) The URL of your provider's token endpoint. Hemmelig.app will use this to exchange an authorization code for an access token.
*   **`SECRET_SSO_USER_INFO_URL`**: (Optional) The URL of your provider's user info endpoint (UserInfo endpoint in OIDC). If provided, Hemmelig.app will use this endpoint to fetch additional user details (like username and email) after obtaining an access token. Some providers bundle enough information in the ID token (if using OpenID Connect) that this might not be strictly necessary, but it's often useful for more comprehensive profile data.
*   **`PUBLIC_URL`**: (Required if SSO is enabled) The public base URL where your Hemmelig.app instance is accessible (e.g., `https://secrets.mycompany.com`). This is used to construct the **Callback URL** which will be `PUBLIC_URL/auth/oauth2/callback`. Ensure this URL is correctly set and reachable by your users and the identity provider.

**Important**: After setting or changing any of these environment variables, you **must restart the Hemmelig.app server** for the changes to be applied.

### Obtaining Values from Providers

The exact steps to obtain these values can vary between identity providers. Below are general guidelines and examples for some common providers.

#### General Steps

1.  **Register a new application/client:** In your identity provider's admin console, register Hemmelig.app as a new OAuth2/OIDC client application.
2.  **Choose application type:** Select "Web application" or similar.
3.  **Set the Redirect URI / Callback URL:** This is crucial. Your provider will ask for a Redirect URI (or Callback URL). This URL is derived from your `PUBLIC_URL` environment variable and will be `YOUR_PUBLIC_URL/auth/oauth2/callback`. For example, if your `PUBLIC_URL` is `https://hemmelig.example.com`, the callback URL to register with the provider is `https://hemmelig.example.com/auth/oauth2/callback`.
4.  **Define Scopes:** Ensure the application is configured to request necessary scopes. Hemmelig.app typically requires `openid`, `profile`, and `email` scopes to retrieve user information.
5.  **Collect Credentials:** After registration, the provider will display the Client ID, Client Secret, and often the endpoint URLs (Authorization, Token, UserInfo). If endpoint URLs are not directly provided, they are usually found in the provider's OpenID Connect discovery document (often found at `PROVIDER_URL/.well-known/openid-configuration`). These values will be used for the `SECRET_SSO_*` environment variables.

#### Example: Keycloak

1.  Create a new client in your Keycloak realm.
2.  Set "Client Protocol" to `openid-connect`.
3.  Set "Access Type" to `confidential`.
4.  Set "Valid Redirect URIs" to `YOUR_PUBLIC_URL/auth/oauth2/callback`.
5.  Save the client. The Client ID will be shown (use for `SECRET_SSO_CLIENT_ID`).
6.  Go to the "Credentials" tab for the client to get the Client Secret (use for `SECRET_SSO_CLIENT_SECRET`).
7.  The URLs can be found in the "Endpoints" link on the "Realm Settings" -> "General" page or via the OpenID Endpoint Configuration link (e.g., `https://your-keycloak-server/auth/realms/your-realm/.well-known/openid-configuration`). Use these for `SECRET_SSO_AUTHORIZATION_URL`, `SECRET_SSO_TOKEN_URL`, and `SECRET_SSO_USER_INFO_URL`.

#### Example: Auth0

1.  Go to "Applications" and create a new application.
2.  Choose "Regular Web Applications".
3.  In the application settings:
    *   Note the "Client ID" (for `SECRET_SSO_CLIENT_ID`) and "Client Secret" (for `SECRET_SSO_CLIENT_SECRET`).
    *   Set "Allowed Callback URLs" to `YOUR_PUBLIC_URL/auth/oauth2/callback`.
4.  The "Domain" setting in Auth0 is your issuer URL. The Authorization, Token, and UserInfo URLs are typically:
    *   Authorization URL (`SECRET_SSO_AUTHORIZATION_URL`): `https://YOUR_AUTH0_DOMAIN/authorize`
    *   Token URL (`SECRET_SSO_TOKEN_URL`): `https://YOUR_AUTH0_DOMAIN/oauth/token`
    *   User Info URL (`SECRET_SSO_USER_INFO_URL`): `https://YOUR_AUTH0_DOMAIN/userinfo`

#### Example: Okta

1.  Go to "Applications" -> "Applications" and click "Create App Integration".
2.  Select "OIDC - OpenID Connect" as the sign-in method.
3.  Select "Web Application" as the Application type.
4.  Configure the application:
    *   Set "Sign-in redirect URIs" to `YOUR_PUBLIC_URL/auth/oauth2/callback`.
    *   Assign necessary group access if applicable.
5.  After creation, you'll find the "Client ID" (for `SECRET_SSO_CLIENT_ID`) and "Client secret" (for `SECRET_SSO_CLIENT_SECRET`) on the "General" tab.
6.  The Okta authorization server's metadata URL (e.g., `https://your-okta-domain/oauth2/default/.well-known/openid-configuration`) will provide the `authorization_endpoint` (for `SECRET_SSO_AUTHORIZATION_URL`), `token_endpoint` (for `SECRET_SSO_TOKEN_URL`), and `userinfo_endpoint` (for `SECRET_SSO_USER_INFO_URL`).

## Using SSO for Login

Once SSO is configured via environment variables and enabled (`SECRET_SSO_ENABLED="true"`), users will see a new option on the Hemmelig.app login page.

### Login Flow

1.  The user navigates to the Hemmelig.app sign-in page.
2.  The user clicks the "Sign in with SSO" (or similarly labeled) button.
3.  The user is redirected to your organization's identity provider login page (as specified by `SECRET_SSO_AUTHORIZATION_URL`).
4.  The user authenticates with their organizational credentials (this interaction is solely with the identity provider).
5.  Upon successful authentication, the identity provider redirects the user back to Hemmelig.app's callback URL (`YOUR_PUBLIC_URL/auth/oauth2/callback`).
6.  Hemmelig.app exchanges an authorization code (received from the provider) for an access token at the `SECRET_SSO_TOKEN_URL`.
7.  If `SECRET_SSO_USER_INFO_URL` is provided, Hemmelig.app uses the access token to fetch user information from that endpoint.
8.  **User Account Matching/Creation:**
    *   If a Hemmelig.app user account exists with the same email address (or matching `authProviderId` from a previous SSO login), the SSO login is linked to that existing account.
    *   If no existing user is found, a new Hemmelig.app user account is automatically created using the email and username/display name provided by the identity provider. The password field for such users will be unset, as they will always log in via SSO.
9.  The user is logged into Hemmelig.app and redirected to their account page or the main application page.

## Troubleshooting

Here are some common issues and how to resolve them:

### Incorrect Environment Variable Configuration

*   **Symptom**: SSO button doesn't appear, errors during redirection to the provider, errors on the provider's page, or errors after redirecting back to Hemmelig.app (e.g., "invalid client_id", "token exchange failed").
*   **Solution**:
    *   Ensure `SECRET_SSO_ENABLED` is set to `"true"`.
    *   Double-check all `SECRET_SSO_*` URLs (Authorization, Token, User Info). Ensure they don't have typos and match exactly what your provider specifies.
    *   Verify that `SECRET_SSO_CLIENT_ID` is correct.
    *   Ensure `SECRET_SSO_CLIENT_SECRET` is correctly set.
    *   Confirm that `PUBLIC_URL` is correctly set to the public base URL of your Hemmelig.app instance.
    *   **Remember to restart the Hemmelig.app server after any changes to these environment variables.**

### Provider Errors

*   **Symptom**: The identity provider shows an error page instead of its login form, or after login but before redirecting back to Hemmelig.app.
*   **Solution**:
    *   The error message on the provider's page is the best clue. It often indicates issues like an invalid `redirect_uri` (Callback URL), misconfigured client permissions, or problems with the user's account on the provider side.
    *   Ensure the "Redirect URI / Callback URL" configured in your identity provider *exactly* matches `YOUR_PUBLIC_URL/auth/oauth2/callback` (case-sensitive).

### Callback URL Mismatch

*   **Symptom**: Error messages like "redirect_uri_mismatch", "invalid_redirect_uri", or similar, often shown by the identity provider.
*   **Solution**:
    *   This is a very common issue. The Redirect URI (or Callback URL) registered with your identity provider for Hemmelig.app *must exactly match* the one Hemmelig.app constructs from your `PUBLIC_URL` environment variable: `YOUR_PUBLIC_URL/auth/oauth2/callback`.
    *   Check for HTTP vs. HTTPS mismatches or trailing slashes in your `PUBLIC_URL` and in the provider configuration.

### User Information Mapping

*   **Symptom**: Users are logged in, but their username or email in Hemmelig.app is incorrect or missing.
*   **Solution**:
    *   Hemmelig.app expects to receive at least an email address and a unique identifier from the identity provider. It also tries to get a display name or username.
    *   Ensure your identity provider is configured to release these claims (usually `email`, `profile`, `openid` scopes). Check the attribute/claim mapping settings in your provider for the Hemmelig.app client registration.
    *   If you rely on the UserInfo endpoint, ensure `SECRET_SSO_USER_INFO_URL` is correctly set and the endpoint is reachable by the Hemmelig.app server. If this URL is missing or incorrect, profile information might be minimal.

### Verifying Environment Variables

*   **Symptom**: SSO is not behaving as expected, and you suspect environment variables might not be loaded correctly by the Hemmelig.app process.
*   **Solution**:
    *   How you verify loaded environment variables depends on your deployment method (e.g., Docker, systemd, etc.).
    *   For Docker, you can use `docker exec -it <container_name_or_id> printenv` to list all environment variables available to the container.
    *   Check your service logs; Hemmelig.app may log whether SSO is enabled and if essential configuration is missing during startup.
    *   Ensure there are no typos in the variable names and that they are accessible by the Node.js process running Hemmelig.app.

---

If you encounter issues not covered here, please check the Hemmelig.app server logs for more detailed error messages, which can provide further clues.
You may also consider opening an issue on the Hemmelig.app GitHub repository with relevant (non-sensitive) details.
