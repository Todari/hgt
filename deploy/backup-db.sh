#!/usr/bin/env bash
# Daily Postgres backup for HGT. Run on the EC2 host via cron — see DEPLOY.md "백업".
#
# Dumps the dockerized Postgres (container `hgt-postgres`, works regardless of
# the host port mapping), gzips into $BACKUP_DIR, and keeps $RETENTION_DAYS days.
#
# Restore (into an empty `hgt` database):
#   gunzip -c /var/backups/hgt/hgt-YYYYMMDD-HHMMSS.sql.gz | docker exec -i hgt-postgres psql -U hgt -d hgt
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/hgt}"
CONTAINER="${CONTAINER:-hgt-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

out="$BACKUP_DIR/hgt-$(date +%Y%m%d-%H%M%S).sql.gz"

# pipefail makes a pg_dump failure fail the whole pipeline.
docker exec "$CONTAINER" pg_dump -U hgt hgt | gzip > "$out"

# A real gzipped dump of this schema is never this small — fail loudly instead
# of silently writing empty files while rotation deletes the good ones.
size="$(stat -c%s "$out" 2>/dev/null || stat -f%z "$out")"
if [ "$size" -lt 1024 ]; then
  echo "backup-db: dump suspiciously small (${size}B): $out" >&2
  exit 1
fi

# Rotation: drop dumps older than $RETENTION_DAYS days.
find "$BACKUP_DIR" -name 'hgt-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete

echo "backup-db: wrote $out (${size}B)"
