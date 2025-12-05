#!/bin/sh
set -e

# Run migrations and start app
npx prisma migrate deploy
exec npx tsx server.ts
