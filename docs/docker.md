# Docker Deployment

Complete guide for deploying Hemmelig using Docker.

## Quick Start

```bash
docker run -d \
  --name hemmelig \
  -p 3000:3000 \
  -v hemmelig-data:/app/database \
  -v hemmelig-uploads:/app/uploads \
  -e DATABASE_URL="file:/app/database/hemmelig.db" \
  -e BETTER_AUTH_SECRET="your-secret-key-min-32-chars" \
  hemmelig/hemmelig:v7
```

## Docker Compose

The repository includes a ready-to-use `docker-compose.yml`:

```bash
# Clone the repository
git clone https://github.com/HemmeligOrg/Hemmelig.app.git
cd Hemmelig.app

# Edit environment variables
nano docker-compose.yml

# Start the application
docker compose up -d
```

### Configuration

The included `docker-compose.yml` uses SQLite:

```yaml
services:
    hemmelig:
        image: hemmelig/hemmelig:v7
        container_name: hemmelig
        restart: unless-stopped
        volumes:
            - ./database:/app/database
            - ./uploads:/app/uploads
        environment:
            - DATABASE_URL=file:/app/database/hemmelig.db
            - BETTER_AUTH_SECRET=change-this-to-a-secure-secret-min-32-chars
            - NODE_ENV=production
            - HEMMELIG_BASE_URL=https://secrets.example.com
        ports:
            - '3000:3000'
        healthcheck:
            test:
                [
                    'CMD',
                    'wget',
                    '--no-verbose',
                    '--tries=1',
                    '--spider',
                    'http://localhost:3000/api/healthz',
                ]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 10s
```

**Important:** Before starting, update the following:

- `BETTER_AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `HEMMELIG_BASE_URL` - Your public domain URL

## Volume Mounts

| Container Path  | Purpose                 | Required |
| --------------- | ----------------------- | -------- |
| `/app/database` | SQLite database storage | Yes      |
| `/app/uploads`  | File upload storage     | Yes      |

## Environment Variables

See [Environment Variables](./env.md) for a complete reference.

### Required Variables

| Variable             | Description                               |
| -------------------- | ----------------------------------------- |
| `DATABASE_URL`       | Database connection string                |
| `BETTER_AUTH_SECRET` | Authentication secret (min 32 characters) |

### Common Variables

| Variable            | Description                                    | Default       |
| ------------------- | ---------------------------------------------- | ------------- |
| `NODE_ENV`          | Set to `production` for production deployments | `development` |
| `HEMMELIG_BASE_URL` | Public URL of your instance                    | -             |
| `HEMMELIG_PORT`     | Internal port (usually leave as default)       | `3000`        |

## Troubleshooting

### Database Permission Errors

If you see errors like:

```
Error: Migration engine error:
SQLite database error
unable to open database file: /app/database/hemmelig.db
```

This means the container cannot write to the mounted volume. Fix by setting correct ownership on the host:

```bash
# Find your user ID
id -u

# Create directories and set ownership
sudo mkdir -p ./database ./uploads
sudo chown -R $(id -u):$(id -g) ./database ./uploads
```

Or use Docker named volumes instead of bind mounts:

```yaml
volumes:
    - hemmelig-data:/app/database
    - hemmelig-uploads:/app/uploads
```

### File Upload Permission Errors

If file uploads fail, ensure the uploads directory has correct permissions:

```bash
sudo chown -R $(id -u):$(id -g) ./uploads
chmod 755 ./uploads
```

### Container User

The Hemmelig container runs as user `bun` (non-root) for security. When using bind mounts, ensure the host directories are writable by UID 1000 (the default `bun` user in the container).

## Building from Source

To build the Docker image locally:

```bash
git clone https://github.com/HemmeligOrg/Hemmelig.app.git
cd Hemmelig.app
docker build -t hemmelig .
```

## Reverse Proxy

### Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name secrets.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Traefik

```yaml
services:
    hemmelig:
        image: hemmelig/hemmelig:v7
        labels:
            - 'traefik.enable=true'
            - 'traefik.http.routers.hemmelig.rule=Host(`secrets.example.com`)'
            - 'traefik.http.routers.hemmelig.tls=true'
            - 'traefik.http.routers.hemmelig.tls.certresolver=letsencrypt'
            - 'traefik.http.services.hemmelig.loadbalancer.server.port=3000'
        # ... rest of configuration
```

### Caddy

```
secrets.example.com {
    reverse_proxy hemmelig:3000
}
```

## Health Checks

The container exposes a health endpoint at `/api/healthz`. The built-in healthcheck uses `wget` to verify the application is responding.

To manually check:

```bash
curl http://localhost:3000/api/healthz
# Returns: Health OK
```

## Updating

```bash
# Pull latest image
docker pull hemmelig/hemmelig:v7

# Recreate container
docker compose down
docker compose up -d
```

Database migrations run automatically on startup.

## Security Notes

1. **Always use HTTPS** in production with a reverse proxy
2. **Generate secure secrets**: `openssl rand -base64 32`
3. **Keep the image updated** for security patches
4. **Back up your data** regularly, especially the database
