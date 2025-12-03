#!/bin/sh
set -e

# Fix permissions on mounted volumes
chown -R bun:bun /app/database /app/uploads

# Run migrations and start app as bun user
exec su -s /bin/sh bun -c 'bunx prisma migrate deploy && bun dist/server.js'
