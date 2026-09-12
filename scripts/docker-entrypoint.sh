#!/bin/sh
set -e

# Start migrations and the app as the current user.
start_app() {
    npx prisma migrate deploy
    exec npx tsx server.ts
}

if [ "$(id -u)" = "0" ]; then
    # Started as root (plain `docker run` / compose default): take ownership
    # of the data dirs, which may be host-mounted volumes owned by another
    # UID, then drop privileges before touching the network.
    chown -R app:app /app/database /app/uploads 2>/dev/null || true
    exec setpriv --reuid=app --regid=app --clear-groups \
        env HOME=/home/app sh -c 'npx prisma migrate deploy && exec npx tsx server.ts'
fi

# Already non-root: `USER app` default, k8s runAsNonRoot, or an arbitrary
# `--user` UID. Nothing we can (or should) fix permission-wise here, so
# warn early if the data dirs are not writable instead of failing later
# inside `prisma migrate deploy` with a cryptic error.
if [ ! -w /app/database ] || [ ! -w /app/uploads ]; then
    echo "WARNING: /app/database or /app/uploads is not writable by UID $(id -u)." >&2
    echo "If these are mounted volumes, match their ownership to this UID, or" >&2
    echo "run the container once as root (e.g. docker run --user root) so the" >&2
    echo "entrypoint can fix ownership, then restart as non-root." >&2
fi

start_app
