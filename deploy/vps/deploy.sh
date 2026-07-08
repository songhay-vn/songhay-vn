#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR=/opt/songhay
SOURCE_DIR="$BASE_DIR/source"
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"
LOCK_FILE=/tmp/songhay-deploy.lock

exec 9>"$LOCK_FILE"
flock -n 9 || {
  echo "Another deploy is already running" >&2
  exit 1
}

cleanup() {
  local status=$?
  rm -f "$SOURCE_DIR/.env"
  exit "$status"
}

export BUN_INSTALL="${BUN_INSTALL:-/home/deploy/.bun}"
export PATH="$BUN_INSTALL/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if [[ ! -f "$BASE_DIR/env/build.env" ]]; then
  echo "$BASE_DIR/env/build.env is missing" >&2
  exit 1
fi

install -m 0644 "$SOURCE_DIR/deploy/vps/docker-compose.yml" "$COMPOSE_FILE"
install -m 0644 "$SOURCE_DIR/deploy/vps/Caddyfile" "$BASE_DIR/Caddyfile"

cd "$SOURCE_DIR"
cp "$BASE_DIR/env/build.env" .env
trap cleanup EXIT

# Run database migrations
bunx --bun prisma migrate deploy

# Restart containers with the newly loaded docker image
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Clean up old unused images
docker image prune -f --filter "until=24h" >/dev/null

echo "Deployed successfully!"
