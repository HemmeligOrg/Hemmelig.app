# Managed Mode

Run Hemmelig with all instance settings controlled via environment variables. Perfect for containerized deployments, GitOps workflows, and infrastructure-as-code setups where you want configuration locked down and version-controlled.

## Overview

When managed mode is enabled, all instance settings are read from environment variables instead of the database. The admin dashboard becomes read-only, preventing any runtime modifications.

**Key benefits:**

- **Immutable configuration** - Settings can't be changed through the UI
- **GitOps-friendly** - Version control your configuration
- **Reproducible deployments** - Same config across all environments
- **Security hardening** - No accidental configuration changes

## Quick Start

Enable managed mode by setting:

```bash
HEMMELIG_MANAGED=true
```

Then configure your settings via environment variables:

```bash
# Enable managed mode
HEMMELIG_MANAGED=true

# Instance branding
HEMMELIG_INSTANCE_NAME="Company Secrets"
HEMMELIG_INSTANCE_DESCRIPTION="Secure secret sharing for our team"

# Security
HEMMELIG_ALLOW_PASSWORD_PROTECTION=true
HEMMELIG_ALLOW_IP_RESTRICTION=true
HEMMELIG_ENABLE_RATE_LIMITING=true

# Organization
HEMMELIG_REQUIRE_REGISTERED_USER=true
HEMMELIG_ALLOWED_EMAIL_DOMAINS="company.com,partner.com"
```

## Environment Variables

### Core

| Variable           | Description         | Default |
| ------------------ | ------------------- | ------- |
| `HEMMELIG_MANAGED` | Enable managed mode | `false` |

### General Settings

| Variable                              | Description                       | Default |
| ------------------------------------- | --------------------------------- | ------- |
| `HEMMELIG_INSTANCE_NAME`              | Display name for your instance    | `""`    |
| `HEMMELIG_INSTANCE_DESCRIPTION`       | Description shown on the homepage | `""`    |
| `HEMMELIG_ALLOW_REGISTRATION`         | Allow new user signups            | `true`  |
| `HEMMELIG_REQUIRE_EMAIL_VERIFICATION` | Require email verification        | `false` |
| `HEMMELIG_DEFAULT_SECRET_EXPIRATION`  | Default expiration in hours       | `72`    |
| `HEMMELIG_MAX_SECRET_SIZE`            | Max secret size in KB             | `1024`  |
| `HEMMELIG_IMPORTANT_MESSAGE`          | Alert banner shown to all users   | `""`    |

### Security Settings

| Variable                             | Description                      | Default |
| ------------------------------------ | -------------------------------- | ------- |
| `HEMMELIG_ALLOW_PASSWORD_PROTECTION` | Allow password-protected secrets | `true`  |
| `HEMMELIG_ALLOW_IP_RESTRICTION`      | Allow IP range restrictions      | `true`  |
| `HEMMELIG_ALLOW_FILE_UPLOADS`        | Allow users to attach files      | `true`  |
| `HEMMELIG_ENABLE_RATE_LIMITING`      | Enable API rate limiting         | `true`  |
| `HEMMELIG_RATE_LIMIT_REQUESTS`       | Max requests per window          | `100`   |
| `HEMMELIG_RATE_LIMIT_WINDOW`         | Rate limit window in seconds     | `60`    |

### Organization Settings

| Variable                           | Description                                       | Default |
| ---------------------------------- | ------------------------------------------------- | ------- |
| `HEMMELIG_REQUIRE_INVITE_CODE`     | Require invite code for registration              | `false` |
| `HEMMELIG_ALLOWED_EMAIL_DOMAINS`   | Comma-separated list of allowed domains           | `""`    |
| `HEMMELIG_REQUIRE_REGISTERED_USER` | Only registered users can create and read secrets | `false` |

### Webhook Settings

| Variable                   | Description                        | Default |
| -------------------------- | ---------------------------------- | ------- |
| `HEMMELIG_WEBHOOK_ENABLED` | Enable webhook notifications       | `false` |
| `HEMMELIG_WEBHOOK_URL`     | Webhook endpoint URL               | `""`    |
| `HEMMELIG_WEBHOOK_SECRET`  | HMAC secret for webhook signatures | `""`    |
| `HEMMELIG_WEBHOOK_ON_VIEW` | Send webhook when secret is viewed | `true`  |
| `HEMMELIG_WEBHOOK_ON_BURN` | Send webhook when secret is burned | `true`  |

### Metrics Settings

| Variable                   | Description                        | Default |
| -------------------------- | ---------------------------------- | ------- |
| `HEMMELIG_METRICS_ENABLED` | Enable Prometheus metrics endpoint | `false` |
| `HEMMELIG_METRICS_SECRET`  | Bearer token for `/api/metrics`    | `""`    |

## Docker Compose Example

```yaml
services:
    hemmelig:
        image: hemmeligapp/hemmelig:v7
        restart: unless-stopped
        ports:
            - '3000:3000'
        volumes:
            - ./database:/app/database
            - ./uploads:/app/uploads
        environment:
            # Required
            - DATABASE_URL=file:/app/database/hemmelig.db
            - BETTER_AUTH_SECRET=your-secret-key-min-32-chars
            - BETTER_AUTH_URL=https://secrets.example.com
            - NODE_ENV=production

            # Enable managed mode
            - HEMMELIG_MANAGED=true

            # General
            - HEMMELIG_INSTANCE_NAME=ACME Secrets
            - HEMMELIG_INSTANCE_DESCRIPTION=Internal secret sharing
            - HEMMELIG_ALLOW_REGISTRATION=true
            - HEMMELIG_DEFAULT_SECRET_EXPIRATION=24
            - HEMMELIG_MAX_SECRET_SIZE=2048

            # Security
            - HEMMELIG_ALLOW_PASSWORD_PROTECTION=true
            - HEMMELIG_ALLOW_IP_RESTRICTION=false
            - HEMMELIG_ENABLE_RATE_LIMITING=true
            - HEMMELIG_RATE_LIMIT_REQUESTS=50
            - HEMMELIG_RATE_LIMIT_WINDOW=60

            # Organization
            - HEMMELIG_REQUIRE_REGISTERED_USER=true
            - HEMMELIG_ALLOWED_EMAIL_DOMAINS=acme.com

            # Metrics
            - HEMMELIG_METRICS_ENABLED=true
            - HEMMELIG_METRICS_SECRET=prometheus-scrape-token
```

## Kubernetes Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
    name: hemmelig-config
data:
    HEMMELIG_MANAGED: 'true'
    HEMMELIG_INSTANCE_NAME: 'ACME Secrets'
    HEMMELIG_ALLOW_REGISTRATION: 'true'
    HEMMELIG_REQUIRE_REGISTERED_USER: 'true'
    HEMMELIG_ALLOWED_EMAIL_DOMAINS: 'acme.com'
    HEMMELIG_ENABLE_RATE_LIMITING: 'true'
    HEMMELIG_METRICS_ENABLED: 'true'
---
apiVersion: v1
kind: Secret
metadata:
    name: hemmelig-secrets
type: Opaque
stringData:
    BETTER_AUTH_SECRET: 'your-secret-key-min-32-chars'
    HEMMELIG_WEBHOOK_SECRET: 'webhook-signing-secret'
    HEMMELIG_METRICS_SECRET: 'prometheus-token'
---
apiVersion: apps/v1
kind: Deployment
metadata:
    name: hemmelig
spec:
    replicas: 1
    selector:
        matchLabels:
            app: hemmelig
    template:
        metadata:
            labels:
                app: hemmelig
        spec:
            containers:
                - name: hemmelig
                  image: hemmeligapp/hemmelig:v7
                  ports:
                      - containerPort: 3000
                  envFrom:
                      - configMapRef:
                            name: hemmelig-config
                      - secretRef:
                            name: hemmelig-secrets
                  env:
                      - name: DATABASE_URL
                        value: 'file:/app/database/hemmelig.db'
                      - name: BETTER_AUTH_URL
                        value: 'https://secrets.example.com'
                      - name: NODE_ENV
                        value: 'production'
```

## Admin Dashboard Behavior

When managed mode is enabled:

1. **Settings are read-only** - All form inputs are disabled
2. **Save buttons are hidden** - No option to modify settings
3. **Banner is displayed** - Admins see a clear "Managed Mode" indicator
4. **API rejects updates** - `PUT /api/instance/settings` returns `403 Forbidden`

Admins can still **view** all settings, making it easy to verify the configuration.

## API Behavior

### Check Managed Mode Status

```bash
curl https://secrets.example.com/api/instance/managed
```

Response:

```json
{
    "managed": true
}
```

### Settings Update (Blocked)

When managed mode is enabled, attempting to update settings returns:

```bash
curl -X PUT https://secrets.example.com/api/instance/settings \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "New Name"}'
```

Response:

```json
{
    "error": "Instance is in managed mode. Settings cannot be modified."
}
```

## Migration Guide

### From Database Settings to Managed Mode

1. **Export current settings** - Note your current configuration from the admin dashboard

2. **Create environment configuration** - Translate settings to environment variables

3. **Enable managed mode** - Set `HEMMELIG_MANAGED=true`

4. **Deploy** - Restart with new configuration

Your database settings will be ignored once managed mode is active. The database is still used for secrets, users, and other data - only instance settings come from environment variables.

### Reverting to Database Settings

Simply remove or set `HEMMELIG_MANAGED=false`. Settings will be read from the database again, and the admin dashboard becomes editable.

## Best Practices

1. **Use secrets management** - Store sensitive values like `HEMMELIG_WEBHOOK_SECRET` and `HEMMELIG_METRICS_SECRET` in a secrets manager (Vault, AWS Secrets Manager, etc.)

2. **Version control your config** - Keep your docker-compose or Kubernetes manifests in git

3. **Use CI/CD for changes** - Deploy configuration changes through your pipeline, not manual edits

4. **Document your settings** - Add comments in your configuration files explaining each setting

5. **Test in staging first** - Validate configuration changes in a non-production environment

## Troubleshooting

### Settings Not Applying

- Verify `HEMMELIG_MANAGED=true` is set (case-insensitive)
- Check environment variables are being passed to the container
- Restart the application after changing environment variables

### Dashboard Still Editable

- Clear your browser cache
- Verify the `/api/instance/managed` endpoint returns `{"managed": true}`
- Check server logs for configuration errors

### Rate Limiting Not Working

- Ensure `HEMMELIG_ENABLE_RATE_LIMITING=true`
- Verify `HEMMELIG_RATE_LIMIT_REQUESTS` and `HEMMELIG_RATE_LIMIT_WINDOW` are set
- Rate limiting applies per IP address
