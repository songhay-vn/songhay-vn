#!/usr/bin/env bash
set -Eeuo pipefail

BASE_DIR=/opt/songhay
COMPOSE_FILE="$BASE_DIR/docker-compose.yml"
AIVEN_ENV="$BASE_DIR/env/aiven-dump.env"
BACKUP_DIR="$BASE_DIR/backups"

if [[ ! -f "$AIVEN_ENV" ]]; then
  echo "$AIVEN_ENV is required" >&2
  exit 1
fi

install -m 0644 "$BASE_DIR/source/deploy/vps/docker-compose.yml" "$COMPOSE_FILE"
install -m 0644 "$BASE_DIR/source/deploy/vps/Caddyfile" "$BASE_DIR/Caddyfile"

docker compose -f "$COMPOSE_FILE" up -d postgres

echo "Waiting for PostgreSQL..."
for _ in {1..60}; do
  if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U songhay -d songhay >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

STAMP="$(date -u +%Y%m%d%H%M%S)"
DUMP_PATH="/backups/aiven-$STAMP.dump"
HOST_DUMP_PATH="$BACKUP_DIR/aiven-$STAMP.dump"

docker run --rm \
  --user "$(id -u):$(id -g)" \
  --env-file "$AIVEN_ENV" \
  -e DUMP_PATH="$DUMP_PATH" \
  -v "$BACKUP_DIR:/backups" \
  postgres:17-alpine \
  sh -lc 'pg_dump -Fc "$AIVEN_DATABASE_URL" -f "$DUMP_PATH"'

docker compose -f "$COMPOSE_FILE" exec -T postgres dropdb -U songhay --if-exists songhay
docker compose -f "$COMPOSE_FILE" exec -T postgres createdb -U songhay songhay
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_restore -U songhay -d songhay --no-owner --clean --if-exists "$DUMP_PATH"

chmod 600 "$HOST_DUMP_PATH"
rm -f "$AIVEN_ENV"

echo "Database migrated from Aiven backup: $HOST_DUMP_PATH"
