#!/bin/sh
set -e

# Fix permissions on mounted volumes (runs as root)
chown -R app:app /app/database /app/uploads 2>/dev/null || true

# Run migrations and start app as app user
exec gosu app sh -c 'npx prisma migrate deploy && exec npx tsx server.ts'
