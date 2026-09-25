#!/bin/sh
set -e

# Start migrations and the app as the current user.
start_app() {
    npx prisma migrate deploy
    exec npx tsx server.ts
}

# SQLite keeps its write-ahead log and journal files next to hemmelig.db, so
# the database directory itself must be writable. Fail fast with remediation
# steps instead of dying later inside `prisma migrate deploy`.
require_writable_db() {
    if [ ! -w /app/database ]; then
        echo "ERROR: /app/database is not writable by UID $(id -u) ($(id -un 2>/dev/null || echo unknown))." >&2
        echo "SQLite cannot open hemmelig.db here, so refusing to start." >&2
        echo "If this is a mounted volume, match its ownership to this UID, or" >&2
        echo "run the container once as root (e.g. docker run --user root) so the" >&2
        echo "entrypoint can fix ownership, then restart as non-root." >&2
        exit 1
    fi
}

warn_uploads() {
    if [ ! -w /app/uploads ]; then
        echo "WARNING: /app/uploads is not writable by UID $(id -u); file attachments will fail." >&2
        echo "If this is a mounted volume, match its ownership to this UID." >&2
    fi
}

# The image ships /app/database and /app/uploads owned by app, and the
# entrypoint starts as root by default (no USER directive), but operators
# may mount volumes over them owned by another UID.
# Root can repair that ownership; anyone else can only report it.
if [ "$(id -u)" = "0" ]; then
    # Started as root (plain `docker run` / compose default): take ownership
    # of the data dirs, creating them first so fresh named volumes work,
    # then drop privileges before touching the network.
    mkdir -p /app/database /app/uploads
    if ! chown -R app:app /app/database /app/uploads 2>/dev/null; then
        echo "WARNING: could not change ownership of /app/database or /app/uploads" >&2
        echo "(read-only or root-squashed mount?). Continuing as app and verifying" >&2
        echo "write access below; startup will stop with an error if it is missing." >&2
    fi
    # Verify as the user we are about to become: root can write anywhere, so
    # `-w` checks are meaningless before the drop.
    if ! setpriv --reuid=app --regid=app --clear-groups sh -c 'test -w /app/database'; then
        exec setpriv --reuid=app --regid=app --clear-groups \
            env HOME=/home/app sh -c 'echo "ERROR: /app/database is not writable by user app." >&2; echo "SQLite cannot open hemmelig.db here, so refusing to start." >&2; echo "If this is a mounted volume, match its ownership to the app UID, or use a writable volume." >&2; exit 1'
    fi
    if ! setpriv --reuid=app --regid=app --clear-groups sh -c 'test -w /app/uploads'; then
        echo "WARNING: /app/uploads is not writable by user app; file attachments will fail." >&2
    fi
    exec setpriv --reuid=app --regid=app --clear-groups \
        env HOME=/home/app sh -c 'npx prisma migrate deploy && exec npx tsx server.ts'
fi

# Already non-root: k8s runAsUser/runAsNonRoot, or an arbitrary
# `--user` UID. Nothing we can (or should) fix permission-wise here, so
# fail fast on an unwritable database dir and warn on uploads instead of
# dying later inside `prisma migrate deploy` with a cryptic error.
require_writable_db
warn_uploads

start_app
