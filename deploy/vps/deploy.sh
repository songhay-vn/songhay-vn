#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR=/opt/songhay
SOURCE_DIR="$BASE_DIR/source"
RUNTIME_DIR="$BASE_DIR/runtime"
RELEASES_DIR="$RUNTIME_DIR/releases"
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"
LOCK_FILE=/tmp/songhay-deploy.lock

exec 9>"$LOCK_FILE"
flock -n 9 || {
  echo "Another deploy is already running" >&2
  exit 1
}

export BUN_INSTALL="${BUN_INSTALL:-/home/deploy/.bun}"
export PATH="$BUN_INSTALL/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if [[ ! -f "$BASE_DIR/env/build.env" ]]; then
  echo "$BASE_DIR/env/build.env is missing" >&2
  exit 1
fi

if [[ ! -f "$BASE_DIR/env/app.env" ]]; then
  echo "$BASE_DIR/env/app.env is missing" >&2
  exit 1
fi

install -m 0644 "$SOURCE_DIR/deploy/vps/docker-compose.yml" "$COMPOSE_FILE"
install -m 0644 "$SOURCE_DIR/deploy/vps/Caddyfile" "$BASE_DIR/Caddyfile"

cd "$SOURCE_DIR"
cp "$BASE_DIR/env/build.env" .env
trap 'rm -f "$SOURCE_DIR/.env"' EXIT

bun install --frozen-lockfile
bunx --bun prisma migrate deploy
bun run build

RELEASE_ID="$(date -u +%Y%m%d%H%M%S)"
RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
mkdir -p "$RELEASE_DIR/.next"

cp -a .next/standalone/. "$RELEASE_DIR/"
cp -a .next/static "$RELEASE_DIR/.next/static"
cp -a public "$RELEASE_DIR/public"
rm -f "$RELEASE_DIR/.env"

docker build \
  -f "$SOURCE_DIR/deploy/vps/Dockerfile.runtime" \
  -t songhay-app:latest \
  "$RELEASE_DIR"

ln -sfn "$RELEASE_DIR" "$RUNTIME_DIR/current"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

docker image prune -f --filter "until=24h" >/dev/null
find "$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d | sort -r | tail -n +4 | xargs -r rm -rf

echo "Deployed release $RELEASE_ID"
