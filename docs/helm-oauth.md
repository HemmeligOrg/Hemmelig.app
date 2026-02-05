# Hemmelig Helm Chart - OAuth Configuration Examples

This document demonstrates how to configure OAuth providers with the Hemmelig Helm Chart.

## Using Default Secret Management

The chart can automatically create secrets with your OAuth configuration.

The example below contains all providers supported by the Helm Chart:

```yaml
# values.yaml
config:
  betterAuthSecret: "your-auth-secret-here"
  betterAuthUrl: "https://secrets.example.com"
  baseUrl: "https://secrets.example.com"  # Required for OAuth callbacks

oauth:
  github:
    enabled: true
    clientId: "your-github-client-id"
    clientSecret: "your-github-client-secret"
  
  google:
    enabled: true
    clientId: "your-google-client-id"
    clientSecret: "your-google-client-secret"
  
  microsoft:
    enabled: true
    clientId: "your-microsoft-client-id"
    clientSecret: "your-microsoft-client-secret"
    tenantId: "your-tenant-id"  # Optional
  
  discord:
    enabled: true
    clientId: "your-discord-client-id"
    clientSecret: "your-discord-client-secret"
  
  gitlab:
    enabled: true
    clientId: "your-gitlab-client-id"
    clientSecret: "your-gitlab-client-secret"
    issuer: "https://gitlab.example.com"  # Optional, for self-hosted GitLab
  
  apple:
    enabled: true
    clientId: "your-apple-client-id"
    clientSecret: "your-apple-client-secret"
  
  twitter:
    enabled: true
    clientId: "your-twitter-client-id"
    clientSecret: "your-twitter-client-secret"
  
  generic: '[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/.well-known/openid-configuration","clientId":"client-id","clientSecret":"secret","scopes":["openid","profile","email"]}]'
```

## Using Existing Secret

If you prefer to manage secrets yourself, reference an existing secret
and enable your desired providers:

```yaml
# values.yaml
existingSecret: "hemmelig-secrets"

oauth:
  github:
    enabled: true
  google:
    enabled: true
  microsoft:
    enabled: true
  discord:
    enabled: true
  gitlab:
    enabled: true
  apple:
    enabled: true
  twitter:
    enabled: true
  generic: '[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/.well-known/openid-configuration","clientId":"client-id","clientSecret":"secret","scopes":["openid","profile","email"]}]'
```

Your referenced secret should contain the relevant keys for the providers enabled:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: hemmelig-secrets
type: Opaque
stringData:
  BETTER_AUTH_SECRET: "your-auth-secret"
  # GitHub
  HEMMELIG_AUTH_GITHUB_ID: "github-client-id"
  HEMMELIG_AUTH_GITHUB_SECRET: "github-client-secret"
  # Google
  HEMMELIG_AUTH_GOOGLE_ID: "google-client-id"
  HEMMELIG_AUTH_GOOGLE_SECRET: "google-client-secret"
  # Microsoft (Azure AD)
  HEMMELIG_AUTH_MICROSOFT_ID: "microsoft-client-id"
  HEMMELIG_AUTH_MICROSOFT_SECRET: "microsoft-client-secret"
  HEMMELIG_AUTH_MICROSOFT_TENANT_ID: "tenant-id" # Optional
  # Discord
  HEMMELIG_AUTH_DISCORD_ID: "discord-client-id"
  HEMMELIG_AUTH_DISCORD_SECRET: "discord-client-secret"
  # GitLab
  HEMMELIG_AUTH_GITLAB_ID: "gitlab-client-id"
  HEMMELIG_AUTH_GITLAB_SECRET: "gitlab-client-secret"
  HEMMELIG_AUTH_GITLAB_ISSUER: "https://gitlab.example.com"  # Optional
  # Apple
  HEMMELIG_AUTH_APPLE_ID: "apple-client-id"
  HEMMELIG_AUTH_APPLE_SECRET: "apple-client-secret"
  # Twitter/X
  HEMMELIG_AUTH_TWITTER_ID: "twitter-client-id"
  HEMMELIG_AUTH_TWITTER_SECRET: "twitter-client-secret"
  # Generic OAuth (JSON array - supports any OAuth 2.0 / OIDC provider)
  HEMMELIG_AUTH_GENERIC_OAUTH: "[{"providerId":"authentik","discoveryUrl":"https://auth.example.com/.well-known/openid-configuration","clientId":"client-id","clientSecret":"client-secret","scopes":["openid","profile","email"]}]"
```

## Notes

- All `HEMMELIG_AUTH_*` variables require both `_ID` and `_SECRET`
to enable a provider, except the "Gereric" type.

If you enable a provider and not include the required environment variables for it,
the pod will fail to start with CreateContainerConfigError, with an event
similar to the one below:

```
Error: couldn't find key HEMMELIG_AUTH_<missing_env> in Secret default/hemmelig
```

- All OAuth environment variables will be automatically injected into
the deployment, sourced either from the chart-generated secret
or your existing secret.

- If the `existingSecret` value is provided, the `clientId`, `clientSecret`, etc.
values are ignored from the `values.yaml`
