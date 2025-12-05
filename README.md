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

<p align="center">
  <a href="https://hub.docker.com/r/hemmeligapp/hemmelig"><img src="https://img.shields.io/docker/pulls/hemmeligapp/hemmelig" alt="Docker pulls" /></a>
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
- **Webhook notifications** - Get notified when secrets are viewed or burned ([docs](docs/webhook.md))

## Quick Start

### Docker (Recommended)

```bash
docker run -d \
  --name hemmelig \
  -p 3000:3000 \
  -v hemmelig-data:/app/database \
  -v hemmelig-uploads:/app/uploads \
  -e DATABASE_URL="file:/app/database/hemmelig.db" \
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
- [Helm Chart](docs/helm.md) - Kubernetes deployment with Helm
- [Environment Variables](docs/env.md) - All configuration options
- [Social Login](docs/social-login.md) - OAuth provider setup (GitHub, Google, etc.)
- [Webhooks](docs/webhook.md) - Webhook notifications for secret events
- [API Documentation](docs/api.md) - REST API reference and OpenAPI spec
- [Upgrading from v6](docs/upgrade.md) - Migration guide for v6 to v7

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

## Hetzner Cloud Referral

Hemmelig is proudly hosted on [Hetzner Cloud](https://hetzner.cloud/?ref=Id028KbCZQoD). Hetzner provides reliable and scalable cloud solutions, making it an ideal choice for hosting secure applications like Hemmelig. By using our [referral link](https://hetzner.cloud/?ref=Id028KbCZQoD), you can join Hetzner Cloud and receive €20/$20 in credits. Once you spend at least €10/$10 (excluding credits), Hemmelig will receive €10/$10 in Hetzner Cloud credits. This is a great opportunity to explore Hetzner's services while supporting Hemmelig.

## License

O'Saasy License Agreement - Copyright © 2025, Bjarne Øverli.

This project is licensed under a modified MIT license that prohibits using the software to compete with the original licensor as a hosted SaaS product. See [LICENSE](LICENSE) for details.
