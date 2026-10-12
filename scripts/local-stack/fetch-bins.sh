#!/usr/bin/env bash
# Downloads the Supabase Auth and PostgREST binaries the local stack runs.
# Postgres 16 with pgTAP and PostGIS comes from apt:
#   apt-get install postgresql-16 postgresql-16-pgtap postgresql-16-postgis-3
set -euo pipefail
BIN="${YUNABI_LOCAL_BIN:-/opt/yunabi-local}"
AUTH_VERSION=v2.197.0
PGRST_VERSION=v13.0.8
mkdir -p "$BIN/auth"
cd "$BIN"
if [ ! -x postgrest ]; then
  curl -sSLf -o pgrst.tar.xz "https://github.com/PostgREST/postgrest/releases/download/$PGRST_VERSION/postgrest-$PGRST_VERSION-linux-static-x86-64.tar.xz"
  tar xf pgrst.tar.xz && rm pgrst.tar.xz
fi
if [ ! -x auth/auth ]; then
  curl -sSLf -o auth.tgz "https://github.com/supabase/auth/releases/download/$AUTH_VERSION/auth-$AUTH_VERSION-x86.tar.gz"
  tar xzf auth.tgz -C auth && rm auth.tgz
fi
# the binaries this stack was tested with; a different file is refused
echo "43762bcbf9cc4ffa6cc803a54b425c10d48324ea1163544456112e11bc3e0b97  $BIN/postgrest
8f9ed6eb2404a422e19c57b7d3de42191b3ce997792cb354c5052201635758fe  $BIN/auth/auth" | sha256sum -c --quiet
echo "binaries in $BIN"
