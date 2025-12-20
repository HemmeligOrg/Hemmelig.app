# Docker Deployment

Complete guide for deploying Hemmelig using Docker.

## Architecture Support

Hemmelig Docker images are built for multiple architectures:

| Architecture  | Supported | Use Case                                     |
| ------------- | --------- | -------------------------------------------- |
| `linux/amd64` | Yes       | Intel/AMD servers, most cloud providers      |
| `linux/arm64` | Yes       | Apple Silicon, AWS Graviton, Raspberry Pi 4+ |

Docker will automatically pull the correct image for your platform.

## Quick Start

```bash
docker run -d \
  --name hemmelig \
  -p 3000:3000 \
  -v hemmelig-data:/app/database \
  -v hemmelig-uploads:/app/uploads \
  -e DATABASE_URL="file:/app/database/hemmelig.db" \
  -e BETTER_AUTH_SECRET="your-secret-key-min-32-chars" \
  -e BETTER_AUTH_URL="https://your-domain.com" \
  hemmeligapp/hemmelig:v7
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
        image: hemmeligapp/hemmelig:v7
        container_name: hemmelig
        restart: unless-stopped
        volumes:
            - ./database:/app/database
            - ./uploads:/app/uploads
        environment:
            - DATABASE_URL=file:/app/database/hemmelig.db
            - BETTER_AUTH_SECRET=change-this-to-a-secure-secret-min-32-chars
            - BETTER_AUTH_URL=https://secrets.example.com
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
                    'http://localhost:3000/api/health/ready',
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

| Variable             | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `DATABASE_URL`       | Database connection string                               |
| `BETTER_AUTH_SECRET` | Authentication secret (min 32 characters)                |
| `BETTER_AUTH_URL`    | Public URL of your instance (for proper cookie handling) |

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

### Building for ARM64

To build for ARM64 (e.g., for Apple Silicon or AWS Graviton):

```bash
# Set up Docker buildx with multi-architecture support
docker buildx create --name multiarch --driver docker-container --use

# Build for ARM64
docker buildx build --platform linux/arm64 -t hemmelig:arm64 --load .

# Build for both architectures
docker buildx build --platform linux/amd64,linux/arm64 -t hemmelig:latest --push .
```

The Dockerfile uses a cross-compilation strategy where Prisma client generation runs on the build host's native architecture to avoid QEMU emulation issues.

## Reverse Proxy

### Nginx

1. Create the Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/hemmelig
```

2. Add the following configuration (HTTP only, for initial setup):

```nginx
server {
    listen 80;
    server_name your_domain.com; # Replace with your domain or IP

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/hemmelig /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Install Certbot and obtain SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your_domain.com
```

Certbot will automatically modify your Nginx configuration to use HTTPS.

````

## Health Checks

The container exposes a health endpoint at `/api/health/ready`. The built-in healthcheck uses `wget` to verify the application is responding and all dependencies (database, storage) are healthy.

To manually check:

```bash
curl http://localhost:3000/api/health/ready
# Returns: JSON with status and component health details
````

## Updating

```bash
# Pull latest image
docker pull hemmeligapp/hemmelig:v7

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
