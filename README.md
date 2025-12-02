<div align="center">
  <img src="banner.png" alt="hemmelig" />
</div>

<h1 align="center">Hemmelig - Encrypted Secret Sharing</h1>

<p align="center">
  Share sensitive information securely with client-side encryption and self-destructing messages.
</p>

<p align="center">
  <a href="https://hemmelig.app">Try it online</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="docs/docker.md">Docker Guide</a> •
  <a href="docs/env.md">Configuration</a>
</p>

## How It Works

1. Enter your secret on [hemmelig.app](https://hemmelig.app) or your self-hosted instance
2. Set expiration time, view limits, and optional password
3. Share the generated link with your recipient
4. The secret is automatically deleted after being viewed or expired

**Zero-knowledge architecture:** All encryption happens in your browser. The server only stores encrypted data and never sees your secrets or encryption keys.

## Features

- **Client-side AES-256-GCM encryption** - Your data is encrypted before leaving your browser
- **Self-destructing secrets** - Configurable expiration and view limits
- **Password protection** - Optional additional security layer
- **IP restrictions** - Limit access to specific IP ranges
- **File uploads** - Share encrypted files (authenticated users)
- **Rich text editor** - Format your secrets with inline images
- **QR codes** - Easy mobile sharing
- **Multi-language support** - Available in multiple languages

## Quick Start

### Docker (Recommended)

```bash
docker run -d \
  --name hemmelig \
  -p 3000:3000 \
  -v hemmelig-data:/app/data \
  -v hemmelig-uploads:/app/uploads \
  -e DATABASE_URL="file:/app/data/hemmelig.db" \
  -e BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  hemmelig/hemmelig:v7
```

### Docker Compose

```bash
git clone https://github.com/HemmeligOrg/Hemmelig.app.git
cd Hemmelig.app

# Edit docker-compose.yml with your settings
docker compose up -d
```

See [Docker Guide](docs/docker.md) for detailed deployment instructions.

## Documentation

- [Docker Deployment](docs/docker.md) - Complete Docker setup guide
- [Environment Variables](docs/env.md) - All configuration options
- [Social Login](docs/social-login.md) - OAuth provider setup (GitHub, Google, etc.)

## Development

```bash
bun install
bun run dev        # Frontend only
bun run dev:api    # Full stack with database
```

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

<a href="https://github.com/HemmeligOrg/Hemmelig.app/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=HemmeligOrg/Hemmelig.app" />
</a>

## License

MIT
