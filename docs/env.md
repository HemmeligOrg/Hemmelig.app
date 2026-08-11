# Environment Variables

Complete reference for all environment variables supported by Hemmelig.

## Required Variables

| Variable             | Description                                              | Default                   |
| -------------------- | -------------------------------------------------------- | ------------------------- |
| `DATABASE_URL`       | SQLite connection string                                 | `file:./data/hemmelig.db` |
| `BETTER_AUTH_SECRET` | Secret key for authentication sessions                   | -                         |
| `BETTER_AUTH_URL`    | Public URL of your instance (for proper cookie handling) | -                         |

## Server Configuration

| Variable                   | Description                                                   | Default       |
| -------------------------- | ------------------------------------------------------------- | ------------- |
| `NODE_ENV`                 | Environment mode (`production` or `development`)              | `development` |
| `HEMMELIG_PORT`            | Port the server listens on                                    | `3000`        |
| `HEMMELIG_REQUEST_TIMEOUT` | API request timeout in seconds (`0` disables the app timeout) | `15`          |
| `HEMMELIG_BASE_URL`        | Public URL of your instance (required for OAuth)              | -             |
| `HEMMELIG_TRUSTED_ORIGIN`  | Additional trusted origin for CORS                            | -             |

## General Settings

| Variable                        | Description                                   | Default |
| ------------------------------- | --------------------------------------------- | ------- |
| `HEMMELIG_INSTANCE_NAME`        | Custom name for your instance                 | -       |
| `HEMMELIG_INSTANCE_DESCRIPTION` | Custom description for your instance          | -       |
| `HEMMELIG_ALLOW_REGISTRATION`   | Allow new user registrations (`true`/`false`) | `true`  |

## Security Settings

| Variable                                 | Description                                                   | Default |
| ---------------------------------------- | ------------------------------------------------------------- | ------- |
| `HEMMELIG_ALLOW_PASSWORD_PROTECTION`     | Allow password-protected secrets                              | `true`  |
| `HEMMELIG_ALLOW_IP_RESTRICTION`          | Allow IP range restrictions on secrets                        | `true`  |
| `HEMMELIG_ALLOW_FILE_UPLOADS`            | Allow users to attach files to secrets                        | `true`  |
| `HEMMELIG_DISABLE_EMAIL_PASSWORD_SIGNUP` | Disable email/password registration (social login only)       | `false` |
| `HEMMELIG_MAX_ENCRYPTED_PAYLOAD_SIZE`    | Hard ceiling for encrypted payloads in KB (parsed at startup) | `1024`  |

## Analytics

| Variable                         | Description                             | Default        |
| -------------------------------- | --------------------------------------- | -------------- |
| `HEMMELIG_ANALYTICS_ENABLED`     | Enable privacy-focused analytics        | `true`         |
| `HEMMELIG_ANALYTICS_HMAC_SECRET` | HMAC secret for anonymizing visitor IDs | auto-generated |

## Social Login Providers

See [Social Login Documentation](./social-login.md) for detailed setup instructions.

### GitHub

| Variable                      | Description                    |
| ----------------------------- | ------------------------------ |
| `HEMMELIG_AUTH_GITHUB_ID`     | GitHub OAuth App Client ID     |
| `HEMMELIG_AUTH_GITHUB_SECRET` | GitHub OAuth App Client Secret |

### Google

| Variable                      | Description                |
| ----------------------------- | -------------------------- |
| `HEMMELIG_AUTH_GOOGLE_ID`     | Google OAuth Client ID     |
| `HEMMELIG_AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |

### Microsoft (Azure AD)

| Variable                            | Description                                         |
| ----------------------------------- | --------------------------------------------------- |
| `HEMMELIG_AUTH_MICROSOFT_ID`        | Microsoft Application (client) ID                   |
| `HEMMELIG_AUTH_MICROSOFT_SECRET`    | Microsoft Client Secret                             |
| `HEMMELIG_AUTH_MICROSOFT_TENANT_ID` | Azure AD Tenant ID (optional, defaults to "common") |

### Discord

| Variable                       | Description                       |
| ------------------------------ | --------------------------------- |
| `HEMMELIG_AUTH_DISCORD_ID`     | Discord Application Client ID     |
| `HEMMELIG_AUTH_DISCORD_SECRET` | Discord Application Client Secret |

### GitLab

| Variable                      | Description               |
| ----------------------------- | ------------------------- |
| `HEMMELIG_AUTH_GITLAB_ID`     | GitLab Application ID     |
| `HEMMELIG_AUTH_GITLAB_SECRET` | GitLab Application Secret |

### Apple

| Variable                     | Description         |
| ---------------------------- | ------------------- |
| `HEMMELIG_AUTH_APPLE_ID`     | Apple Services ID   |
| `HEMMELIG_AUTH_APPLE_SECRET` | Apple Client Secret |

### Twitter/X

| Variable                       | Description                     |
| ------------------------------ | ------------------------------- |
| `HEMMELIG_AUTH_TWITTER_ID`     | Twitter OAuth 2.0 Client ID     |
| `HEMMELIG_AUTH_TWITTER_SECRET` | Twitter OAuth 2.0 Client Secret |

### Generic OAuth

Hemmelig supports any OAuth 2.0 / OpenID Connect provider through generic OAuth configuration.

| Variable                      | Description                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `HEMMELIG_AUTH_GENERIC_OAUTH` | JSON array of generic OAuth provider configurations. See [Social Login docs](./social-login.md) for details. |

**Example**:

```bash
HEMMELIG_AUTH_GENERIC_OAUTH='[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/.well-known/openid-configuration","clientId":"client-id","clientSecret":"secret","scopes":["openid","profile","email"]}]'
```

Supported generic providers include: Authentik, Authelia, Keycloak, Zitadel, Ory Hydra, and any OAuth 2.0 / OIDC-compatible identity provider.

## Example Configuration

### Minimal Setup

```bash
# Required
DATABASE_URL=file:./data/hemmelig.db
BETTER_AUTH_SECRET=your-secret-key-min-32-chars-long
BETTER_AUTH_URL=https://secrets.example.com
```

### Production Setup

```bash
# Required
DATABASE_URL=file:./data/hemmelig.db
BETTER_AUTH_SECRET=your-very-secure-secret-key-here
BETTER_AUTH_URL=https://secrets.example.com

# Server
NODE_ENV=production
HEMMELIG_PORT=3000
HEMMELIG_REQUEST_TIMEOUT=60
HEMMELIG_TRUSTED_ORIGIN=https://secrets.example.com

# Instance
HEMMELIG_INSTANCE_NAME=Company Secrets
HEMMELIG_INSTANCE_DESCRIPTION=Secure secret sharing for our team

# Security
HEMMELIG_ENABLE_RATE_LIMITING=true

# Analytics
HEMMELIG_ANALYTICS_ENABLED=true
HEMMELIG_ANALYTICS_HMAC_SECRET=your-analytics-hmac-secret

# Social Login (optional)
HEMMELIG_AUTH_GITHUB_ID=your-github-client-id
HEMMELIG_AUTH_GITHUB_SECRET=your-github-client-secret
```

### Docker Compose Example

```yaml
version: '3.8'

services:
    hemmelig:
        image: hemmelig/hemmelig:latest
        ports:
            - '3000:3000'
        environment:
            - DATABASE_URL=file:/data/hemmelig.db
            - BETTER_AUTH_SECRET=change-this-to-a-secure-secret
            - BETTER_AUTH_URL=https://secrets.example.com
            - NODE_ENV=production
            - HEMMELIG_PORT=3000
            - HEMMELIG_ANALYTICS_ENABLED=true
        volumes:
            - hemmelig_data:/data

volumes:
    hemmelig_data:
```

## Notes

- Boolean values accept `true` or `false` (case-insensitive)
- All `HEMMELIG_AUTH_*` variables require both `_ID` and `_SECRET` to enable a provider
- `BETTER_AUTH_URL` is required when using social login providers
- Generate secure secrets using: `openssl rand -base64 32`
