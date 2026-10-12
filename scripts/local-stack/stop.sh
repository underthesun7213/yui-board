#!/usr/bin/env bash
# Stops what start.sh started.
HERE="$(cd "$(dirname "$0")" && pwd)"
STATE="${YUNABI_LOCAL_STATE:-$(cd "$HERE/../.." && pwd)/.local-stack}"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
for s in gateway postgrest auth; do
  [ -f "$STATE/$s.pid" ] && kill "$(cat "$STATE/$s.pid")" 2>/dev/null
done
if [ -d "$STATE/pg" ]; then
  if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$PGBIN/pg_ctl" -D "$STATE/pg" -m fast stop; else "$PGBIN/pg_ctl" -D "$STATE/pg" -m fast stop; fi
fi
