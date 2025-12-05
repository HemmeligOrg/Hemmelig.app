#!/bin/sh
set -e

# Fix permissions on mounted volumes
chown -R app:app /app/database /app/uploads

# Run migrations and start app as app user
exec su -s /bin/sh app -c 'npx prisma migrate deploy && npx tsx server.ts'
