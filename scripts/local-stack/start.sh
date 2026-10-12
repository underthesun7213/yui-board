#!/usr/bin/env bash
# A local stand-in for a Supabase project, built from the real pieces:
# Postgres 16 (+ pgTAP, PostGIS), Supabase Auth and PostgREST, behind a small
# gateway on one port. Starts from an empty database every time.
#
#   scripts/local-stack/start.sh     then   scripts/local-stack/stop.sh
#
# API:  http://127.0.0.1:54321   (/auth/v1, /rest/v1)   DB: 127.0.0.1:54322
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
BIN="${YUNABI_LOCAL_BIN:-/opt/yunabi-local}"
STATE="${YUNABI_LOCAL_STATE:-$REPO/.local-stack}"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
PGPORT=54322 AUTH_PORT=54329 REST_PORT=54330 GATEWAY_PORT=54321
eval "$(node -e 'import("'"$HERE"'/keys.mjs").then(k=>console.log(`JWT_SECRET=${k.JWT_SECRET}`))')"

"$HERE/stop.sh" >/dev/null 2>&1 || true
rm -rf "$STATE" && mkdir -p "$STATE/log"
as_pg() { if [ "$(id -u)" = 0 ]; then runuser -u postgres -- "$@"; else "$@"; fi; }
[ "$(id -u)" = 0 ] && chown -R postgres "$STATE"

as_pg "$PGBIN/initdb" -D "$STATE/pg" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
cat >> "$STATE/pg/postgresql.conf" <<CONF
port = $PGPORT
listen_addresses = '127.0.0.1'
unix_socket_directories = '$STATE'
timezone = 'UTC'
CONF
as_pg "$PGBIN/pg_ctl" -D "$STATE/pg" -l "$STATE/log/postgres.log" -w start >/dev/null
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -p $PGPORT -U postgres -d postgres)
"${PSQL[@]}" -f "$HERE/bootstrap.sql"

auth_env() {
  env GOTRUE_DB_DRIVER=postgres \
    DATABASE_URL="postgres://supabase_auth_admin:local-auth-admin@127.0.0.1:$PGPORT/postgres?sslmode=disable" \
    GOTRUE_DB_MIGRATIONS_PATH="$BIN/auth/migrations" \
    GOTRUE_API_HOST=127.0.0.1 PORT=$AUTH_PORT \
    API_EXTERNAL_URL="http://127.0.0.1:$GATEWAY_PORT/auth/v1" GOTRUE_SITE_URL="http://127.0.0.1:4173" \
    GOTRUE_JWT_SECRET="$JWT_SECRET" GOTRUE_JWT_EXP=3600 GOTRUE_JWT_AUD=authenticated \
    GOTRUE_JWT_DEFAULT_GROUP_NAME=authenticated GOTRUE_JWT_ADMIN_ROLES=service_role \
    GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=true GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
    GOTRUE_MAILER_AUTOCONFIRM=true GOTRUE_DISABLE_SIGNUP=false \
    GOTRUE_MFA_TOTP_ENROLL_ENABLED=true GOTRUE_MFA_TOTP_VERIFY_ENABLED=true \
    GOTRUE_RATE_LIMIT_ANONYMOUS_USERS=100000 GOTRUE_LOG_LEVEL=warn "$@"
}
wait_http() { for _ in $(seq 1 60); do curl -s -o /dev/null "$1" && return 0; sleep 0.5; done; echo "timed out: $1" >&2; exit 1; }

# Auth creates the auth schema on its first start …
auth_env "$BIN/auth/auth" >"$STATE/log/auth.log" 2>&1 &
echo $! >"$STATE/auth.pid"
wait_http "http://127.0.0.1:$AUTH_PORT/health"
# health answers before Auth's own migrations are done
for _ in $(seq 1 60); do
  "${PSQL[@]}" -tAc "select to_regprocedure('auth.uid()') is not null and to_regclass('auth.sessions') is not null" | grep -q t && break
  sleep 0.5
done
"${PSQL[@]}" -f "$HERE/compat.sql"

# … then the project migrations, in order.
shopt -s nullglob
for f in "$REPO"/supabase/migrations/*.sql; do
  "${PSQL[@]}" -f "$f" || { echo "migration failed: $f" >&2; exit 1; }
done
[ "${1:-}" = "--seed" ] && "${PSQL[@]}" -f "$REPO/supabase/seed/fixtures.sql"

# restart Auth with the signup hook now that it exists
kill "$(cat "$STATE/auth.pid")" && sleep 0.5
HOOK=()
if "${PSQL[@]}" -tAc "select 1 from pg_proc where proname = 'hook_before_user_created'" | grep -q 1; then
  HOOK=(GOTRUE_HOOK_BEFORE_USER_CREATED_ENABLED=true GOTRUE_HOOK_BEFORE_USER_CREATED_URI=pg-functions://postgres/app/hook_before_user_created)
fi
auth_env "${HOOK[@]}" "$BIN/auth/auth" >>"$STATE/log/auth.log" 2>&1 &
echo $! >"$STATE/auth.pid"
wait_http "http://127.0.0.1:$AUTH_PORT/health"

cat >"$STATE/postgrest.conf" <<CONF
db-uri = "postgres://authenticator:local-authenticator@127.0.0.1:$PGPORT/postgres"
db-schemas = "public"
db-anon-role = "anon"
db-pre-request = "app.db_pre_request"
jwt-secret = "$JWT_SECRET"
server-host = "127.0.0.1"
server-port = $REST_PORT
log-level = "warn"
CONF
"$BIN/postgrest" "$STATE/postgrest.conf" >"$STATE/log/postgrest.log" 2>&1 &
echo $! >"$STATE/postgrest.pid"
wait_http "http://127.0.0.1:$REST_PORT/"

GATEWAY_PORT=$GATEWAY_PORT AUTH_PORT=$AUTH_PORT REST_PORT=$REST_PORT node "$HERE/gateway.mjs" >"$STATE/log/gateway.log" 2>&1 &
echo $! >"$STATE/gateway.pid"
wait_http "http://127.0.0.1:$GATEWAY_PORT/auth/v1/health"
echo "local stack up: API http://127.0.0.1:$GATEWAY_PORT  DB postgres://postgres@127.0.0.1:$PGPORT/postgres"
