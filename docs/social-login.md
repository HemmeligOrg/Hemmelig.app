# Social Login Configuration

Hemmelig supports multiple social login providers. Users can configure any combination of providers via environment variables. Only providers with valid credentials will be shown on the login and registration pages.

## Required Configuration

Before setting up any social provider, you must set your base URL:

```bash
HEMMELIG_BASE_URL=https://your-domain.com
```

This is used to generate the correct OAuth callback URLs.

## Supported Providers

### Standard Providers

| Provider  | Environment Variables                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| GitHub    | `HEMMELIG_AUTH_GITHUB_ID`, `HEMMELIG_AUTH_GITHUB_SECRET`                                                       |
| Google    | `HEMMELIG_AUTH_GOOGLE_ID`, `HEMMELIG_AUTH_GOOGLE_SECRET`                                                       |
| Microsoft | `HEMMELIG_AUTH_MICROSOFT_ID`, `HEMMELIG_AUTH_MICROSOFT_SECRET`, `HEMMELIG_AUTH_MICROSOFT_TENANT_ID` (optional) |
| Discord   | `HEMMELIG_AUTH_DISCORD_ID`, `HEMMELIG_AUTH_DISCORD_SECRET`                                                     |
| GitLab    | `HEMMELIG_AUTH_GITLAB_ID`, `HEMMELIG_AUTH_GITLAB_SECRET`, `HEMMELIG_AUTH_GITLAB_ISSUER` (optional)             |
| Apple     | `HEMMELIG_AUTH_APPLE_ID`, `HEMMELIG_AUTH_APPLE_SECRET`                                                         |
| Twitter/X | `HEMMELIG_AUTH_TWITTER_ID`, `HEMMELIG_AUTH_TWITTER_SECRET`                                                     |

### Generic OAuth Providers

Hemmelig now supports any OAuth 2.0 / OpenID Connect provider through the generic OAuth configuration. This allows you to integrate with identity providers like:

- **Authentik**
- **Authelia**
- **Keycloak**
- **Zitadel**
- **Ory Hydra**
- **Auth0** (if not using the built-in provider)
- **Okta**
- Any other OAuth 2.0 / OpenID Connect compatible provider

Use the `HEMMELIG_AUTH_GENERIC_OAUTH` environment variable with a JSON array of provider configurations.

**Environment Variable**: `HEMMELIG_AUTH_GENERIC_OAUTH`

#### Generic OAuth Configuration Format

Each provider in the array must include:

| Field              | Required | Description                                                                |
| ------------------ | -------- | -------------------------------------------------------------------------- |
| `providerId`       | Yes      | Unique identifier for the provider (used in callback URLs)                 |
| `clientId`         | Yes      | OAuth client ID from your identity provider                                |
| `clientSecret`     | Yes      | OAuth client secret from your identity provider                            |
| `discoveryUrl`     | No\*     | OpenID Connect discovery URL (e.g., `/.well-known/openid-configuration`)   |
| `authorizationUrl` | No\*     | OAuth authorization endpoint (required if no `discoveryUrl`)               |
| `tokenUrl`         | No\*     | OAuth token endpoint (required if no `discoveryUrl`)                       |
| `userInfoUrl`      | No\*     | OAuth user info endpoint (required if no `discoveryUrl`)                   |
| `scopes`           | No       | Array of OAuth scopes (default: `["openid", "profile", "email"]`)          |
| `pkce`             | No       | Enable PKCE (Proof Key for Code Exchange) - recommended for public clients |

\*You must provide either `discoveryUrl` OR all three of (`authorizationUrl`, `tokenUrl`, `userInfoUrl`).

#### Example: Authentik

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/application/o/hemmelig/.well-known/openid-configuration","clientId":"your-client-id","clientSecret":"your-client-secret","scopes":["openid","profile","email"]}]'
```

#### Example: Authelia

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"authelia","discoveryUrl":"https://auth.example.com/.well-known/openid-configuration","clientId":"hemmelig","clientSecret":"your-client-secret","scopes":["openid","profile","email","groups"]}]'
```

#### Example: Keycloak

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"keycloak","discoveryUrl":"https://keycloak.example.com/realms/myrealm/.well-known/openid-configuration","clientId":"hemmelig","clientSecret":"your-client-secret","scopes":["openid","profile","email"]}]'
```

#### Example: Multiple Generic Providers

You can configure multiple generic OAuth providers in the same JSON array:

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[
  {
    "providerId": "authentik",
    "discoveryUrl": "https://auth.example.com/application/o/hemmelig/.well-known/openid-configuration",
    "clientId": "client-id-1",
    "clientSecret": "secret-1",
    "scopes": ["openid", "profile", "email"]
  },
  {
    "providerId": "keycloak",
    "discoveryUrl": "https://keycloak.example.com/realms/myrealm/.well-known/openid-configuration",
    "clientId": "client-id-2",
    "clientSecret": "secret-2"
  }
]'
```

#### Example: Manual URLs (without discovery)

If your provider doesn't support OpenID Connect discovery:

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"custom","authorizationUrl":"https://oauth.example.com/authorize","tokenUrl":"https://oauth.example.com/token","userInfoUrl":"https://oauth.example.com/userinfo","clientId":"your-client-id","clientSecret":"your-client-secret","scopes":["openid","profile","email"]}]'
```

## Callback URLs

When configuring your OAuth applications, use these callback URLs:

### Standard Providers

| Provider  | Callback URL                                          |
| --------- | ----------------------------------------------------- |
| GitHub    | `https://your-domain.com/api/auth/callback/github`    |
| Google    | `https://your-domain.com/api/auth/callback/google`    |
| Microsoft | `https://your-domain.com/api/auth/callback/microsoft` |
| Discord   | `https://your-domain.com/api/auth/callback/discord`   |
| GitLab    | `https://your-domain.com/api/auth/callback/gitlab`    |
| Apple     | `https://your-domain.com/api/auth/callback/apple`     |
| Twitter/X | `https://your-domain.com/api/auth/callback/twitter`   |

### Generic OAuth Providers

For generic OAuth providers, the callback URL format is:

```
https://your-domain.com/api/auth/oauth2/callback/{providerId}
```

Where `{providerId}` is the value you specified in the `providerId` field.

**Examples:**

- Authentik: `https://your-domain.com/api/auth/oauth2/callback/authentik`
- Authelia: `https://your-domain.com/api/auth/oauth2/callback/authelia`
- Keycloak: `https://your-domain.com/api/auth/oauth2/callback/keycloak`

## Configuration

Add the environment variables for the providers you want to enable. Both `_ID` and `_SECRET` must be set for a standard provider to be enabled.

### Example: Docker Compose

```yaml
services:
    hemmelig:
        image: hemmelig/hemmelig:latest
        environment:
            # Required: Base URL for OAuth callbacks
            - HEMMELIG_BASE_URL=https://your-domain.com

            # Standard providers (GitHub example)
            - HEMMELIG_AUTH_GITHUB_ID=your-github-client-id
            - HEMMELIG_AUTH_GITHUB_SECRET=your-github-client-secret

            # Generic OAuth provider (Authentik example)
            - HEMMELIG_AUTH_GENERIC_OAUTH=[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/application/o/hemmelig/.well-known/openid-configuration","clientId":"your-client-id","clientSecret":"your-client-secret","scopes":["openid","profile","email"]}]
```

### Example: Environment File (.env)

```bash
# Required: Base URL for OAuth callbacks
HEMMELIG_BASE_URL=https://your-domain.com

# GitHub OAuth
HEMMELIG_AUTH_GITHUB_ID=your-github-client-id
HEMMELIG_AUTH_GITHUB_SECRET=your-github-client-secret

# Google OAuth
HEMMELIG_AUTH_GOOGLE_ID=your-google-client-id
HEMMELIG_AUTH_GOOGLE_SECRET=your-google-client-secret

# Microsoft OAuth (Azure AD)
HEMMELIG_AUTH_MICROSOFT_ID=your-microsoft-client-id
HEMMELIG_AUTH_MICROSOFT_SECRET=your-microsoft-client-secret
HEMMELIG_AUTH_MICROSOFT_TENANT_ID=your-tenant-id  # Optional, defaults to "common"

# Discord OAuth
HEMMELIG_AUTH_DISCORD_ID=your-discord-client-id
HEMMELIG_AUTH_DISCORD_SECRET=your-discord-client-secret

# GitLab OAuth
HEMMELIG_AUTH_GITLAB_ID=your-gitlab-client-id
HEMMELIG_AUTH_GITLAB_SECRET=your-gitlab-client-secret
HEMMELIG_AUTH_GITLAB_ISSUER=https://gitlab.example.com  # Optional, for self-hosted GitLab

# Apple OAuth
HEMMELIG_AUTH_APPLE_ID=your-apple-client-id
HEMMELIG_AUTH_APPLE_SECRET=your-apple-client-secret

# Twitter/X OAuth
HEMMELIG_AUTH_TWITTER_ID=your-twitter-client-id
HEMMELIG_AUTH_TWITTER_SECRET=your-twitter-client-secret

# Generic OAuth (supports Authentik, Authelia, Keycloak, etc.)
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/application/o/hemmelig/.well-known/openid-configuration","clientId":"your-client-id","clientSecret":"your-client-secret","scopes":["openid","profile","email"]}]'
```

## Setting Up OAuth Applications

### Standard Providers

#### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set the callback URL to: `https://your-domain.com/api/auth/callback/github`
4. Copy the Client ID and Client Secret

#### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set the authorized redirect URI to: `https://your-domain.com/api/auth/callback/google`
4. Copy the Client ID and Client Secret

#### Microsoft (Azure AD)

1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Add a redirect URI: `https://your-domain.com/api/auth/callback/microsoft`
4. Create a client secret under "Certificates & secrets"
5. Copy the Application (client) ID and the client secret value
6. Optionally set the Tenant ID for single-tenant apps

#### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URL: `https://your-domain.com/api/auth/callback/discord`
5. Copy the Client ID and Client Secret

#### GitLab

1. Go to GitLab User Settings > Applications
2. Create a new application
3. Set the redirect URI to: `https://your-domain.com/api/auth/callback/gitlab`
4. Select the `read_user` scope
5. Copy the Application ID and Secret

**Self-hosted GitLab:** If you're using a self-hosted GitLab instance, set the `HEMMELIG_AUTH_GITLAB_ISSUER` environment variable to your GitLab instance URL (e.g., `https://gitlab.example.com`). Without this, GitLab.com is used by default.

#### Apple

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Create a Services ID
3. Configure Sign in with Apple, add your domain and return URL: `https://your-domain.com/api/auth/callback/apple`
4. Create a key for Sign in with Apple
5. Use the Services ID as Client ID and generate the client secret from the key

#### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 2.0
4. Set the callback URL to: `https://your-domain.com/api/auth/callback/twitter`
5. Copy the Client ID and Client Secret

### Generic OAuth Providers

#### Authentik

1. Log into your Authentik instance as an admin
2. Go to **Applications** > **Providers** > **Create**
3. Select **OAuth2/OpenID Provider**
4. Configure the provider:
    - **Name**: Hemmelig
    - **Authorization flow**: Select your flow (e.g., default-authentication-flow)
    - **Redirect URIs**: `https://your-domain.com/api/auth/oauth2/callback/authentik`
    - **Client type**: Confidential
    - **Scopes**: `openid`, `profile`, `email`
5. Save and copy the **Client ID** and **Client Secret**
6. Create an application and bind it to this provider
7. Find your discovery URL (usually `https://auth.example.com/application/o/hemmelig/.well-known/openid-configuration`)

Example environment variable:

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/application/o/hemmelig/.well-known/openid-configuration","clientId":"<client-id>","clientSecret":"<client-secret>","scopes":["openid","profile","email"]}]'
```

#### Authelia

1. Edit your Authelia configuration file (`configuration.yml`)
2. Add Hemmelig as a client under `identity_providers.oidc.clients`:
    ```yaml
    clients:
        - id: hemmelig
          description: Hemmelig Secret Sharing
          secret: <generate-a-secure-secret>
          redirect_uris:
              - https://your-domain.com/api/auth/oauth2/callback/authelia
          scopes:
              - openid
              - profile
              - email
              - groups
    ```
3. Restart Authelia
4. Your discovery URL will be: `https://auth.example.com/.well-known/openid-configuration`

Example environment variable:

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"authelia","discoveryUrl":"https://auth.example.com/.well-known/openid-configuration","clientId":"hemmelig","clientSecret":"<client-secret>","scopes":["openid","profile","email"]}]'
```

#### Keycloak

1. Log into your Keycloak admin console
2. Select your realm (or create a new one)
3. Go to **Clients** > **Create client**
4. Configure the client:
    - **Client type**: OpenID Connect
    - **Client ID**: `hemmelig`
5. On the next screen:
    - **Client authentication**: ON
    - **Valid redirect URIs**: `https://your-domain.com/api/auth/oauth2/callback/keycloak`
    - **Web origins**: `https://your-domain.com`
6. Go to the **Credentials** tab and copy the **Client Secret**
7. Your discovery URL will be: `https://keycloak.example.com/realms/{realm-name}/.well-known/openid-configuration`

Example environment variable:

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"keycloak","discoveryUrl":"https://keycloak.example.com/realms/myrealm/.well-known/openid-configuration","clientId":"hemmelig","clientSecret":"<client-secret>"}]'
```

#### Zitadel

1. Log into your Zitadel instance
2. Go to your project (or create a new one)
3. Create a new application:
    - **Type**: Web
    - **Authentication method**: PKCE or Code
4. Configure:
    - **Redirect URIs**: `https://your-domain.com/api/auth/oauth2/callback/zitadel`
    - **Post logout redirect URIs**: `https://your-domain.com`
5. Copy the **Client ID** and **Client Secret** (if using Code flow)
6. Your discovery URL: `https://<instance>.zitadel.cloud/.well-known/openid-configuration`

Example environment variable:

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"zitadel","discoveryUrl":"https://instance.zitadel.cloud/.well-known/openid-configuration","clientId":"<client-id>","clientSecret":"<client-secret>","scopes":["openid","profile","email"],"pkce":true}]'
```

## How It Works

1. On server startup, the application reads all `HEMMELIG_AUTH_*` environment variables
2. Only providers with both `_ID` and `_SECRET` set are enabled
3. The frontend fetches the list of enabled providers from `/api/config/social-providers`
4. Login and registration pages dynamically show buttons only for enabled providers
5. Each provider button uses the correct branded icon and colors
6. The callback URL is built using `HEMMELIG_BASE_URL` + `/api/auth/callback/{provider}`

## All Environment Variables

```bash
# Required for OAuth
HEMMELIG_BASE_URL=https://your-domain.com

# GitHub
HEMMELIG_AUTH_GITHUB_ID=
HEMMELIG_AUTH_GITHUB_SECRET=

# Google
HEMMELIG_AUTH_GOOGLE_ID=
HEMMELIG_AUTH_GOOGLE_SECRET=

# Microsoft (Azure AD)
HEMMELIG_AUTH_MICROSOFT_ID=
HEMMELIG_AUTH_MICROSOFT_SECRET=
HEMMELIG_AUTH_MICROSOFT_TENANT_ID=  # Optional

# Discord
HEMMELIG_AUTH_DISCORD_ID=
HEMMELIG_AUTH_DISCORD_SECRET=

# GitLab
HEMMELIG_AUTH_GITLAB_ID=
HEMMELIG_AUTH_GITLAB_SECRET=
HEMMELIG_AUTH_GITLAB_ISSUER=  # Optional, for self-hosted GitLab (e.g., https://gitlab.example.com)

# Apple
HEMMELIG_AUTH_APPLE_ID=
HEMMELIG_AUTH_APPLE_SECRET=

# Twitter/X
HEMMELIG_AUTH_TWITTER_ID=
HEMMELIG_AUTH_TWITTER_SECRET=

# Generic OAuth (JSON array - supports any OAuth 2.0 / OIDC provider)
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/.well-known/openid-configuration","clientId":"client-id","clientSecret":"client-secret","scopes":["openid","profile","email"]}]'
```

## Troubleshooting

### Provider not showing up

**Standard providers:**

- Ensure both `_ID` and `_SECRET` environment variables are set
- Restart the server after adding environment variables
- Check server logs for any configuration errors

**Generic OAuth providers:**

- Verify the JSON in `HEMMELIG_AUTH_GENERIC_OAUTH` is valid
- Check that each provider has `providerId`, `clientId`, and `clientSecret`
- Verify you have either `discoveryUrl` OR all three URLs (`authorizationUrl`, `tokenUrl`, `userInfoUrl`)
- Check server logs for parsing errors

### OAuth callback errors

**Standard providers:**

- Verify the callback URL in your OAuth app settings matches exactly
- Format: `https://your-domain.com/api/auth/callback/{provider}`

**Generic OAuth providers:**

- Callback URL format: `https://your-domain.com/api/auth/oauth2/callback/{providerId}`
- Ensure the `providerId` in your config matches the one in your identity provider settings

**Common issues:**

- Ensure `HEMMELIG_BASE_URL` is set correctly (no trailing slash)
- Ensure your domain is using HTTPS in production
- Check that the client ID and secret are correct (no extra spaces)

### "Access Denied" errors

- Verify the OAuth app has the correct permissions/scopes
- For Microsoft, ensure the app is configured for the correct account types
- For Apple, ensure the Services ID is correctly configured
- For generic OAuth: Check that the requested scopes are allowed by your provider

### Discovery URL errors (Generic OAuth)

- Verify the discovery URL is accessible: `curl https://your-auth-provider/.well-known/openid-configuration`
- Ensure your Hemmelig instance can reach the discovery URL (check firewall rules)
- Try using manual URLs (`authorizationUrl`, `tokenUrl`, `userInfoUrl`) instead if discovery is not supported
