# Social Login Configuration

Hemmelig supports multiple social login providers. Users can configure any combination of providers via environment variables. Only providers with valid credentials will be shown on the login and registration pages.

## Required Configuration

Before setting up any social provider, you must set your base URL:

```bash
HEMMELIG_BASE_URL=https://your-domain.com
```

This is used to generate the correct OAuth callback URLs.

## Supported Providers

| Provider  | Environment Variables                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| GitHub    | `HEMMELIG_AUTH_GITHUB_ID`, `HEMMELIG_AUTH_GITHUB_SECRET`                                                       |
| Google    | `HEMMELIG_AUTH_GOOGLE_ID`, `HEMMELIG_AUTH_GOOGLE_SECRET`                                                       |
| Microsoft | `HEMMELIG_AUTH_MICROSOFT_ID`, `HEMMELIG_AUTH_MICROSOFT_SECRET`, `HEMMELIG_AUTH_MICROSOFT_TENANT_ID` (optional) |
| Discord   | `HEMMELIG_AUTH_DISCORD_ID`, `HEMMELIG_AUTH_DISCORD_SECRET`                                                     |
| GitLab    | `HEMMELIG_AUTH_GITLAB_ID`, `HEMMELIG_AUTH_GITLAB_SECRET`                                                       |
| Apple     | `HEMMELIG_AUTH_APPLE_ID`, `HEMMELIG_AUTH_APPLE_SECRET`                                                         |
| Twitter/X | `HEMMELIG_AUTH_TWITTER_ID`, `HEMMELIG_AUTH_TWITTER_SECRET`                                                     |

## Callback URLs

When configuring your OAuth applications, use these callback URLs:

| Provider  | Callback URL                                          |
| --------- | ----------------------------------------------------- |
| GitHub    | `https://your-domain.com/api/auth/callback/github`    |
| Google    | `https://your-domain.com/api/auth/callback/google`    |
| Microsoft | `https://your-domain.com/api/auth/callback/microsoft` |
| Discord   | `https://your-domain.com/api/auth/callback/discord`   |
| GitLab    | `https://your-domain.com/api/auth/callback/gitlab`    |
| Apple     | `https://your-domain.com/api/auth/callback/apple`     |
| Twitter/X | `https://your-domain.com/api/auth/callback/twitter`   |

Replace `your-domain.com` with your actual domain.

## Configuration

Add the environment variables for the providers you want to enable. Both `_ID` and `_SECRET` must be set for a provider to be enabled.

### Example: Docker Compose

```yaml
services:
    hemmelig:
        image: hemmelig/hemmelig:latest
        environment:
            # Required: Base URL for OAuth callbacks
            - HEMMELIG_BASE_URL=https://your-domain.com

            # GitHub OAuth
            - HEMMELIG_AUTH_GITHUB_ID=your-github-client-id
            - HEMMELIG_AUTH_GITHUB_SECRET=your-github-client-secret

            # Google OAuth
            - HEMMELIG_AUTH_GOOGLE_ID=your-google-client-id
            - HEMMELIG_AUTH_GOOGLE_SECRET=your-google-client-secret
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

# Apple OAuth
HEMMELIG_AUTH_APPLE_ID=your-apple-client-id
HEMMELIG_AUTH_APPLE_SECRET=your-apple-client-secret

# Twitter/X OAuth
HEMMELIG_AUTH_TWITTER_ID=your-twitter-client-id
HEMMELIG_AUTH_TWITTER_SECRET=your-twitter-client-secret
```

## Setting Up OAuth Applications

### GitHub

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Set the callback URL to: `https://your-domain.com/api/auth/callback/github`
4. Copy the Client ID and Client Secret

### Google

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set the authorized redirect URI to: `https://your-domain.com/api/auth/callback/google`
4. Copy the Client ID and Client Secret

### Microsoft (Azure AD)

1. Go to [Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Register a new application
3. Add a redirect URI: `https://your-domain.com/api/auth/callback/microsoft`
4. Create a client secret under "Certificates & secrets"
5. Copy the Application (client) ID and the client secret value
6. Optionally set the Tenant ID for single-tenant apps

### Discord

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to OAuth2 settings
4. Add redirect URL: `https://your-domain.com/api/auth/callback/discord`
5. Copy the Client ID and Client Secret

### GitLab

1. Go to GitLab User Settings > Applications
2. Create a new application
3. Set the redirect URI to: `https://your-domain.com/api/auth/callback/gitlab`
4. Select the `read_user` scope
5. Copy the Application ID and Secret

### Apple

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Create a Services ID
3. Configure Sign in with Apple, add your domain and return URL: `https://your-domain.com/api/auth/callback/apple`
4. Create a key for Sign in with Apple
5. Use the Services ID as Client ID and generate the client secret from the key

### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project and app
3. Enable OAuth 2.0
4. Set the callback URL to: `https://your-domain.com/api/auth/callback/twitter`
5. Copy the Client ID and Client Secret

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

# Apple
HEMMELIG_AUTH_APPLE_ID=
HEMMELIG_AUTH_APPLE_SECRET=

# Twitter/X
HEMMELIG_AUTH_TWITTER_ID=
HEMMELIG_AUTH_TWITTER_SECRET=
```

## Troubleshooting

### Provider not showing up

- Ensure both `_ID` and `_SECRET` environment variables are set
- Restart the server after adding environment variables
- Check server logs for any configuration errors

### OAuth callback errors

- Verify the callback URL in your OAuth app settings matches exactly
- Ensure `HEMMELIG_BASE_URL` is set correctly (no trailing slash)
- Ensure your domain is using HTTPS in production
- Check that the client ID and secret are correct (no extra spaces)

### "Access Denied" errors

- Verify the OAuth app has the correct permissions/scopes
- For Microsoft, ensure the app is configured for the correct account types
- For Apple, ensure the Services ID is correctly configured
