# Single Sign-On (SSO) with OAuth2/OpenID Connect

Hemmelig.app supports Single Sign-On (SSO) integration with any OAuth2/OpenID Connect (OIDC) compatible identity provider. This allows users to log in to Hemmelig.app using their existing credentials from your organization's identity provider.

## Table of Contents

- [Configuration](#configuration)
  - [Accessing SSO Settings](#accessing-sso-settings)
  - [SSO Settings Fields](#sso-settings-fields)
  - [Obtaining Values from Providers](#obtaining-values-from-providers)
    - [General Steps](#general-steps)
    - [Example: Keycloak](#example-keycloak)
    - [Example: Auth0](#example-auth0)
    - [Example: Okta](#example-okta)
- [Using SSO for Login](#using-sso-for-login)
  - [Login Flow](#login-flow)
- [Troubleshooting](#troubleshooting)
  - [Incorrect Configuration](#incorrect-configuration)
  - [Provider Errors](#provider-errors)
  - [Callback URL Mismatch](#callback-url-mismatch)
  - [User Information Mapping](#user-information-mapping)

## Configuration

To enable and configure SSO, you need to be an administrator in Hemmelig.app.

### Accessing SSO Settings

1.  Log in to Hemmelig.app as an administrator.
2.  Navigate to your account page (usually by clicking your username in the top right).
3.  Select the "Settings" tab.
4.  Scroll down to the "SSO Configuration" section.

### SSO Settings Fields

Here's a description of each field required for SSO configuration:

*   **Enable SSO**: A checkbox to enable or disable the SSO functionality. If disabled, the "Sign in with SSO" button will not be shown on the login page.
*   **Client ID**: The Client ID obtained from your OAuth2/OIDC provider when you register Hemmelig.app as an application.
*   **Client Secret**: The Client Secret obtained from your OAuth2/OIDC provider. This is a sensitive value and should be kept confidential.
*   **Authorization URL**: The URL of your provider's authorization endpoint. This is where Hemmelig.app will redirect users to start the login process.
*   **Token URL**: The URL of your provider's token endpoint. Hemmelig.app will use this to exchange an authorization code for an access token.
*   **User Info URL**: The URL of your provider's user info endpoint (UserInfo endpoint in OIDC). Hemmelig.app will use this endpoint to fetch user details (like username and email) after obtaining an access token.

### Obtaining Values from Providers

The exact steps to obtain these values can vary between identity providers. Below are general guidelines and examples for some common providers.

#### General Steps

1.  **Register a new application/client:** In your identity provider's admin console, register Hemmelig.app as a new OAuth2/OIDC client application.
2.  **Choose application type:** Select "Web application" or similar.
3.  **Set the Redirect URI / Callback URL:** This is crucial. Your provider will ask for a Redirect URI (or Callback URL). This URL must be `YOUR_HEMMELIG_APP_URL/auth/oauth2/callback`. For example, if your Hemmelig.app is hosted at `https://hemmelig.example.com`, the callback URL will be `https://hemmelig.example.com/auth/oauth2/callback`.
4.  **Define Scopes:** Ensure the application is configured to request necessary scopes. Hemmelig.app typically requires `openid`, `profile`, and `email` scopes to retrieve user information.
5.  **Collect Credentials:** After registration, the provider will display the Client ID, Client Secret, and often the endpoint URLs (Authorization, Token, UserInfo). If endpoint URLs are not directly provided, they are usually found in the provider's OpenID Connect discovery document (often found at `PROVIDER_URL/.well-known/openid-configuration`).

#### Example: Keycloak

1.  Create a new client in your Keycloak realm.
2.  Set "Client Protocol" to `openid-connect`.
3.  Set "Access Type" to `confidential`.
4.  Set "Valid Redirect URIs" to `YOUR_HEMMELIG_APP_URL/auth/oauth2/callback`.
5.  Save the client. The Client ID will be shown.
6.  Go to the "Credentials" tab for the client to get the Client Secret.
7.  The URLs can be found in the "Endpoints" link on the "Realm Settings" -> "General" page or via the OpenID Endpoint Configuration link (e.g., `https://your-keycloak-server/auth/realms/your-realm/.well-known/openid-configuration`).

#### Example: Auth0

1.  Go to "Applications" and create a new application.
2.  Choose "Regular Web Applications".
3.  In the application settings:
    *   Note the "Client ID" and "Client Secret".
    *   Set "Allowed Callback URLs" to `YOUR_HEMMELIG_APP_URL/auth/oauth2/callback`.
4.  The "Domain" setting in Auth0 is your issuer URL. The Authorization, Token, and UserInfo URLs are typically:
    *   Authorization URL: `https://YOUR_AUTH0_DOMAIN/authorize`
    *   Token URL: `https://YOUR_AUTH0_DOMAIN/oauth/token`
    *   User Info URL: `https://YOUR_AUTH0_DOMAIN/userinfo`

#### Example: Okta

1.  Go to "Applications" -> "Applications" and click "Create App Integration".
2.  Select "OIDC - OpenID Connect" as the sign-in method.
3.  Select "Web Application" as the Application type.
4.  Configure the application:
    *   Set "Sign-in redirect URIs" to `YOUR_HEMMELIG_APP_URL/auth/oauth2/callback`.
    *   Assign necessary group access if applicable.
5.  After creation, you'll find the "Client ID" and "Client secret" on the "General" tab.
6.  The Okta authorization server's metadata URL (e.g., `https://your-okta-domain/oauth2/default/.well-known/openid-configuration`) will provide the `authorization_endpoint`, `token_endpoint`, and `userinfo_endpoint`.

## Using SSO for Login

Once SSO is configured and enabled by an administrator, users will see a new option on the Hemmelig.app login page.

### Login Flow

1.  The user navigates to the Hemmelig.app sign-in page.
2.  The user clicks the "Sign in with SSO" (or similarly labeled) button.
3.  The user is redirected to your organization's identity provider login page.
4.  The user authenticates with their organizational credentials (this interaction is solely with the identity provider).
5.  Upon successful authentication, the identity provider redirects the user back to Hemmelig.app's callback URL (`YOUR_HEMMELIG_APP_URL/auth/oauth2/callback`).
6.  Hemmelig.app exchanges an authorization code (received from the provider) for an access token.
7.  Hemmelig.app uses the access token to fetch user information from the provider's User Info endpoint.
8.  **User Account Matching/Creation:**
    *   If a Hemmelig.app user account exists with the same email address (or matching `authProviderId` from a previous SSO login), the SSO login is linked to that existing account.
    *   If no existing user is found, a new Hemmelig.app user account is automatically created using the email and username/display name provided by the identity provider. The password field for such users will be unset, as they will always log in via SSO.
9.  The user is logged into Hemmelig.app and redirected to their account page or the main application page.

## Troubleshooting

Here are some common issues and how to resolve them:

### Incorrect Configuration

*   **Symptom**: Errors during redirection to the provider, errors on the provider's page, or errors after redirecting back to Hemmelig.app (e.g., "invalid client_id").
*   **Solution**:
    *   Double-check all URLs (Authorization, Token, User Info) in the Hemmelig.app admin settings. Ensure they don't have typos and match exactly what your provider specifies.
    *   Verify that the Client ID is correct.
    *   Ensure the Client Secret is correctly entered. Some providers only show the secret once, so you might need to regenerate it if you're unsure.

### Provider Errors

*   **Symptom**: The identity provider shows an error page instead of its login form, or after login but before redirecting back to Hemmelig.app.
*   **Solution**:
    *   The error message on the provider's page is the best clue. It often indicates issues like an invalid `redirect_uri` (Callback URL), misconfigured client permissions, or problems with the user's account on the provider side.
    *   Ensure the "Redirect URI / Callback URL" configured in your identity provider *exactly* matches `YOUR_HEMMELIG_APP_URL/auth/oauth2/callback` (case-sensitive).

### Callback URL Mismatch

*   **Symptom**: Error messages like "redirect_uri_mismatch", "invalid_redirect_uri", or similar, often shown by the identity provider.
*   **Solution**:
    *   This is a very common issue. The Redirect URI (or Callback URL) registered with your identity provider for Hemmelig.app *must exactly match* the one Hemmelig.app uses: `YOUR_HEMMELIG_APP_URL/auth/oauth2/callback`.
    *   `YOUR_HEMMELIG_APP_URL` is the public base URL of your Hemmelig.app instance (e.g., `https://secrets.mycompany.com`). Check for HTTP vs. HTTPS mismatches or trailing slashes.

### User Information Mapping

*   **Symptom**: Users are logged in, but their username or email in Hemmelig.app is incorrect or missing.
*   **Solution**:
    *   Hemmelig.app expects to receive at least an email address and a unique identifier from the identity provider. It also tries to get a display name or username.
    *   Ensure your identity provider is configured to release these claims (usually `email`, `profile`, `openid` scopes). Check the attribute/claim mapping settings in your provider for the Hemmelig.app client registration.
    *   The User Info URL must be correctly set and reachable by the Hemmelig.app server for it to fetch this information. If the User Info URL is missing or incorrect, profile information might be minimal.

---

If you encounter issues not covered here, please check the Hemmelig.app server logs for more detailed error messages, which can provide further clues.
You may also consider opening an issue on the Hemmelig.app GitHub repository with relevant (non-sensitive) details.
