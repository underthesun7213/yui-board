#!/usr/bin/env bash
# Stops what start.sh started.
HERE="$(cd "$(dirname "$0")" && pwd)"
STATE="${YUNABI_LOCAL_STATE:-$(cd "$HERE/../.." && pwd)/.local-stack}"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
BIN="${YUNABI_LOCAL_BIN:-/opt/yunabi-local}"
for s in gateway postgrest auth; do
  [ -f "$STATE/$s.pid" ] && kill "$(cat "$STATE/$s.pid")" 2>/dev/null
done
# anything left from an earlier run that lost its pid file
ps -eo pid=,args= | awk -v a="$BIN/auth/auth" -v b="$BIN/postgrest" -v g="$HERE/gateway.mjs" \
  '$2 == a || $2 == b || index($0, g) { print $1 }' | xargs -r kill 2>/dev/null
sleep 0.3
if [ -d "$STATE/pg" ]; then
  if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$PGBIN/pg_ctl" -D "$STATE/pg" -m fast stop; else "$PGBIN/pg_ctl" -D "$STATE/pg" -m fast stop; fi
fi
