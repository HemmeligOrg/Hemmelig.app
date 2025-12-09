# Hemmelig CLI (Go)

A standalone Go binary for creating encrypted, self-destructing secrets via [Hemmelig](https://hemmelig.app).

```
 _   _                               _ _
| | | | ___ _ __ ___  _ __ ___   ___| (_) __ _
| |_| |/ _ \ '_ ` _ \| '_ ` _ \ / _ \ | |/ _` |
|  _  |  __/ | | | | | | | | | |  __/ | | (_| |
|_| |_|\___|_| |_| |_|_| |_| |_|\___|_|_|\__, |
                                         |___/
```

## Installation

### Download Binary

Download the pre-built binary for your platform from the [releases page](https://github.com/HemmeligOrg/Hemmelig.app/releases).

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

#### Verify Download

```bash
curl -L https://github.com/HemmeligOrg/Hemmelig.app/releases/latest/download/checksums.txt -o checksums.txt
sha256sum -c checksums.txt --ignore-missing
```

### Build from Source

```bash
go build -o hemmelig .
```

## Usage

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

# Use a self-hosted instance
hemmelig "internal secret" -u https://secrets.company.com
```

## Options

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

## Security

- All encryption happens locally using AES-256-GCM
- Keys are derived using PBKDF2 with 600,000 iterations
- The decryption key is in the URL fragment (`#decryptionKey=...`), which is never sent to the server
- The server only stores encrypted data

## License

MIT
