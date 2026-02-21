#!/bin/sh
set -e

# Run migrations and start app
sh -c 'npx prisma migrate deploy && exec npx tsx server.ts'
