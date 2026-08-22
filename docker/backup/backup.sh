#!/usr/bin/env bash
# Nightly Postgres backup to Cloudflare R2. Installed on the server at
# /opt/hoa-manager/backup.sh by the deploy workflow; run by deploy's crontab:
#   0 3 * * * /opt/hoa-manager/backup.sh >> /opt/hoa-manager/backup.log 2>&1
set -euo pipefail

cd /opt/hoa-manager
set -a
source ./.env
set +a

STAMP=$(date -u +%Y-%m-%d_%H%M%S)
FILE="hoa-manager-${STAMP}.sql.gz"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" |
    gzip >"/tmp/$FILE"

rclone() {
    docker run --rm \
        -v "/tmp/$FILE:/backup/$FILE:ro" \
        -e RCLONE_S3_PROVIDER=Cloudflare \
        -e "RCLONE_S3_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID" \
        -e "RCLONE_S3_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY" \
        -e "RCLONE_S3_ENDPOINT=$R2_ENDPOINT" \
        -e RCLONE_S3_NO_CHECK_BUCKET=true \
        rclone/rclone:latest "$@"
}

rclone copy "/backup/$FILE" ":s3:$R2_BUCKET/db/"
# Keep 14 days of nightly dumps.
rclone delete --min-age 14d ":s3:$R2_BUCKET/db/"

rm -f "/tmp/$FILE"
echo "$(date -u +%FT%TZ) backup ok: $FILE"
