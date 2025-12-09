# Hemmelig CLI

The Hemmelig CLI allows you to create encrypted secrets directly from the command line, making it ideal for automation, CI/CD pipelines, and scripting.

```
 _   _                               _ _
| | | | ___ _ __ ___  _ __ ___   ___| (_) __ _
| |_| |/ _ \ '_ ` _ \| '_ ` _ \ / _ \ | |/ _` |
|  _  |  __/ | | | | | | | | | |  __/ | | (_| |
|_| |_|\___|_| |_| |_|_| |_| |_|\___|_|_|\__, |
                                         |___/
```

## Installation

### Binary (Recommended for CI/CD)

Download the pre-built binary for your platform:

#### Linux (amd64)

```bash
curl -L https://github.com/HemmeligOrg/Hemmelig.app/releases/latest/download/hemmelig-linux-amd64 -o hemmelig
chmod +x hemmelig
sudo mv hemmelig /usr/local/bin/
```

#### Linux (arm64)

```bash
curl -L https://github.com/HemmeligOrg/Hemmelig.app/releases/latest/download/hemmelig-linux-arm64 -o hemmelig
chmod +x hemmelig
sudo mv hemmelig /usr/local/bin/
```

#### macOS (Apple Silicon)

```bash
curl -L https://github.com/HemmeligOrg/Hemmelig.app/releases/latest/download/hemmelig-darwin-arm64 -o hemmelig
chmod +x hemmelig
sudo mv hemmelig /usr/local/bin/
```

#### macOS (Intel)

```bash
curl -L https://github.com/HemmeligOrg/Hemmelig.app/releases/latest/download/hemmelig-darwin-amd64 -o hemmelig
chmod +x hemmelig
sudo mv hemmelig /usr/local/bin/
```

#### Windows

Download `hemmelig-windows-amd64.exe` from the [releases page](https://github.com/HemmeligOrg/Hemmelig.app/releases) and add it to your PATH.

#### Verify Download

```bash
# Download checksums
curl -L https://github.com/HemmeligOrg/Hemmelig.app/releases/latest/download/checksums.txt -o checksums.txt

# Verify integrity
sha256sum -c checksums.txt --ignore-missing
```

### npm

```bash
# Install globally
npm install -g hemmelig

# Or use with npx (no installation required)
npx hemmelig "my secret"
```

## Usage

```bash
hemmelig <secret> [options]
```

Or pipe content from stdin:

```bash
echo "my secret" | hemmelig [options]
cat file.txt | hemmelig [options]
```

## Options

| Option                  | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `-t, --title <title>`   | Set a title for the secret                          |
| `-p, --password <pass>` | Protect with a password (if not set, key is in URL) |
| `-e, --expires <time>`  | Expiration time (default: 1d)                       |
| `-v, --views <number>`  | Max views before deletion (default: 1, max: 9999)   |
| `-b, --burnable`        | Burn after first view (default: true)               |
| `--no-burnable`         | Don't burn after first view                         |
| `-u, --url <url>`       | Base URL (default: https://hemmelig.app)            |
| `-h, --help`            | Show help message                                   |

### Expiration Times

Valid expiration values: `5m`, `30m`, `1h`, `4h`, `12h`, `1d`, `3d`, `7d`, `14d`, `28d`

## Examples

### Basic Usage

```bash
# Create a simple secret (expires in 1 day, 1 view)
hemmelig "my secret message"

# Create a secret with a title
hemmelig "database_password=secret123" -t "Database Credentials"

# Set custom expiration and view count
hemmelig "temporary token" -e 1h -v 3
```

### Password Protection

```bash
# Create a password-protected secret
hemmelig "sensitive data" -p "mypassword123"
```

When password-protected, the recipient must enter the password to decrypt the secret. The URL will not contain the decryption key.

### Self-Hosted Instances

```bash
# Use your own Hemmelig instance
hemmelig "internal secret" -u https://secrets.company.com
```

## CI/CD Integration

The CLI is designed for automation. It outputs only the secret URL to stdout, making it easy to capture and use in scripts.

### GitHub Actions

Share secrets securely between workflow jobs or with external parties:

```yaml
name: Deploy
on: [push]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Share deployment credentials
              run: |
                  SECRET_URL=$(npx hemmelig "${{ secrets.DEPLOY_KEY }}" \
                    -t "Deployment Key" \
                    -e 1h \
                    -v 1 \
                    -u https://secrets.company.com)
                  echo "Secure link: $SECRET_URL"
                  # Send to Slack, email, etc.
```

### GitLab CI

```yaml
share-credentials:
    stage: deploy
    script:
        - |
            SECRET_URL=$(npx hemmelig "$DB_PASSWORD" \
              -t "Database Password" \
              -e 4h \
              -u https://secrets.company.com)
            echo "Secret URL: $SECRET_URL"
```

### Jenkins Pipeline

```groovy
pipeline {
    agent any
    stages {
        stage('Share Secret') {
            steps {
                script {
                    def secretUrl = sh(
                        script: '''
                            npx hemmelig "${API_KEY}" \
                                -t "API Key for deployment" \
                                -e 1h \
                                -u https://secrets.company.com
                        ''',
                        returnStdout: true
                    ).trim()
                    echo "Secret available at: ${secretUrl}"
                }
            }
        }
    }
}
```

## Automation Use Cases

### Secure Credential Handoff

When onboarding new team members or sharing credentials with contractors:

```bash
#!/bin/bash
# generate-access.sh

DB_CREDS="host: db.internal.com
user: app_user
password: $(openssl rand -base64 32)"

SECRET_URL=$(echo "$DB_CREDS" | hemmelig \
  -t "Database Access - $(date +%Y-%m-%d)" \
  -e 24h \
  -v 1)

echo "Send this link to the new team member: $SECRET_URL"
```

### Automated Secret Rotation

Share rotated secrets with dependent services:

```bash
#!/bin/bash
# rotate-and-share.sh

NEW_PASSWORD=$(openssl rand -base64 24)

# Update the password in your system
update_service_password "$NEW_PASSWORD"

# Share with the dependent team
SECRET_URL=$(hemmelig "$NEW_PASSWORD" \
  -t "Rotated Service Password" \
  -e 1h \
  -v 1 \
  -u https://secrets.company.com)

# Notify via Slack
curl -X POST "$SLACK_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"Password rotated. New credentials: $SECRET_URL\"}"
```

### Sharing Build Artifacts Securely

```bash
#!/bin/bash
# share-artifact.sh

# Generate a signed URL or token for the artifact
ARTIFACT_TOKEN=$(generate_artifact_token)

SECRET_URL=$(hemmelig "$ARTIFACT_TOKEN" \
  -t "Build Artifact Access Token" \
  -e 4h \
  -v 5)

echo "Artifact access link: $SECRET_URL"
```

### Emergency Access Credentials

Create break-glass credentials that self-destruct:

```bash
#!/bin/bash
# emergency-access.sh

EMERGENCY_CREDS=$(cat << EOF
Emergency Admin Access
======================
URL: https://admin.company.com
Username: emergency_admin
Password: $(openssl rand -base64 32)
MFA Backup: $(generate_mfa_backup)

This access expires in 1 hour.
EOF
)

SECRET_URL=$(echo "$EMERGENCY_CREDS" | hemmelig \
  -t "Emergency Access Credentials" \
  -e 1h \
  -v 1 \
  -p "emergency-$(date +%s)")

echo "Emergency access: $SECRET_URL"
echo "Password hint: emergency-[unix timestamp]"
```

## Programmatic Usage

The CLI can also be used as a library in your Node.js projects:

```typescript
import { createSecret } from 'hemmelig';

const result = await createSecret({
    secret: 'my secret message',
    title: 'API Key',
    expiresIn: '1h',
    views: 1,
    burnable: true,
    baseUrl: 'https://hemmelig.app', // optional
});

console.log(result.url); // https://hemmelig.app/secret/abc123#decryptionKey=...
console.log(result.id); // abc123
```

### API Reference

#### `createSecret(options: SecretOptions): Promise<CreateSecretResult>`

| Option      | Type            | Default                  | Description                   |
| ----------- | --------------- | ------------------------ | ----------------------------- |
| `secret`    | `string`        | required                 | The secret content to encrypt |
| `title`     | `string`        | -                        | Optional title                |
| `password`  | `string`        | -                        | Password protection           |
| `expiresIn` | `ExpirationKey` | `'1d'`                   | Expiration time               |
| `views`     | `number`        | `1`                      | Max views (1-9999)            |
| `burnable`  | `boolean`       | `true`                   | Burn on first view            |
| `baseUrl`   | `string`        | `'https://hemmelig.app'` | Server URL                    |

**Returns:**

| Property    | Type     | Description                   |
| ----------- | -------- | ----------------------------- |
| `url`       | `string` | Full URL to access the secret |
| `id`        | `string` | The secret ID                 |
| `expiresIn` | `string` | The expiration time set       |

## Security Notes

- **Client-side encryption**: All encryption happens locally before data is sent to the server
- **Zero-knowledge**: The server never sees your plaintext secrets or encryption keys
- **URL fragments**: When not using a password, the decryption key is in the URL fragment (`#decryptionKey=...`), which is never sent to the server
- **Self-destructing**: Secrets are automatically deleted after the specified views or expiration time

## Troubleshooting

### Secret Creation Fails

If you're using a self-hosted instance and secret creation fails, ensure:

1. The instance URL is correct and accessible
2. The server is running and healthy
3. CORS is configured to allow requests from the CLI origin

### Piped Content Issues

When piping content, the CLI preserves all internal newlines and formatting. Only trailing whitespace is trimmed.

```bash
# This preserves the JSON formatting
cat config.json | hemmelig -t "Config"
```
