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

install -m 0644 "$SOURCE_DIR/deploy/vps/docker-compose.yml" "$COMPOSE_FILE"
install -m 0644 "$SOURCE_DIR/deploy/vps/Caddyfile" "$BASE_DIR/Caddyfile"

# Restart containers with the newly loaded docker image
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Clean up all unused images and builder cache to prevent running out of space
docker image prune -a -f >/dev/null
docker builder prune -f >/dev/null

echo "Deployed successfully!"
