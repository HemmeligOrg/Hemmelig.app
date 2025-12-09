# hemmelig

CLI and library for creating encrypted, self-destructing secrets via [Hemmelig](https://hemmelig.app).

```
 _   _                               _ _
| | | | ___ _ __ ___  _ __ ___   ___| (_) __ _
| |_| |/ _ \ '_ ` _ \| '_ ` _ \ / _ \ | |/ _` |
|  _  |  __/ | | | | | | | | | |  __/ | | (_| |
|_| |_|\___|_| |_| |_|_| |_| |_|\___|_|_|\__, |
                                         |___/
```

## Features

- **Client-side AES-256-GCM encryption** - Your secrets are encrypted before leaving your machine
- **Zero-knowledge** - The server never sees your plaintext secrets
- **Self-destructing** - Secrets auto-delete after views or expiration
- **Password protection** - Optional additional security layer
- **Works with any Hemmelig instance** - Use hemmelig.app or self-hosted

## Installation

```bash
npm install -g hemmelig
```

Or use with npx:

```bash
npx hemmelig "my secret"
```

## CLI Usage

```bash
# Create a simple secret
hemmelig "my secret message"

# With a title and custom expiration
hemmelig "API key: sk-1234" -t "Production API Key" -e 7d

# Password protected
hemmelig "sensitive data" -p "mypassword"

# Multiple views allowed
hemmelig "shared config" -v 5

# Pipe from stdin
cat config.json | hemmelig -t "Config file"
echo "my secret" | hemmelig

# Use a self-hosted instance
hemmelig "internal secret" -u https://secrets.company.com
```

### Options

| Option                  | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `-t, --title <title>`   | Set a title for the secret                             |
| `-p, --password <pass>` | Protect with a password                                |
| `-e, --expires <time>`  | Expiration: 5m, 30m, 1h, 4h, 12h, 1d, 3d, 7d, 14d, 28d |
| `-v, --views <number>`  | Max views (1-9999, default: 1)                         |
| `-b, --burnable`        | Burn after first view (default)                        |
| `--no-burnable`         | Don't burn until all views used                        |
| `-u, --url <url>`       | Base URL (default: https://hemmelig.app)               |
| `-h, --help`            | Show help                                              |
| `--version`             | Show version                                           |

## Library Usage

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

### API

#### `createSecret(options: SecretOptions): Promise<CreateSecretResult>`

Creates an encrypted secret on a Hemmelig server.

**Options:**

| Property    | Type            | Default                  | Description                   |
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

## CI/CD Integration

### GitHub Actions

```yaml
- name: Share deployment credentials
  run: |
      SECRET_URL=$(npx hemmelig "${{ secrets.DEPLOY_KEY }}" \
        -t "Deployment Key" \
        -e 1h)
      echo "Secret URL: $SECRET_URL"
```

### GitLab CI

```yaml
share-secret:
    script:
        - SECRET_URL=$(npx hemmelig "$DB_PASSWORD" -e 4h)
        - echo "Secret URL: $SECRET_URL"
```

## Security

- All encryption happens locally using AES-256-GCM
- Keys are derived using PBKDF2 with 600,000 iterations
- The decryption key is in the URL fragment (`#decryptionKey=...`), which is never sent to the server
- The server only stores encrypted data

## License

MIT
