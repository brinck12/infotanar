#!/usr/bin/env bash
#
# InfoTanar ejszakai mentes (#129): adatbazis-dump es a privat fajlok egy
# szerveren kivuli tarolora, rclone-nal.
#
# Hasznalat:  infotanar-backup.sh [konfiguracios fajl]
#             (alapertelmezes: /etc/infotanar/backup.env, minta: backup.env.example)
#
# A tavoli tarolo elrendezese:
#   db/daily/    az utolso 7 nap dumpjai
#   db/weekly/   vasarnapi dumpok, 4 hetig
#   db/monthly/  a honap elso napjanak dumpjai, 12 honapig
#   invoices/    a kiallitott szamlak PDF-jei (csak bovul, torles nem terjed at)
#   videos/      lecke-videok es feliratok (hetente, lasd VIDEO_BACKUP_WEEKDAY)
#
# Titkositas: a BACKUP_REMOTE legyen rclone "crypt" tarolo, akkor minden a
# szerveren titkositva megy fel. Visszaallitas: docs/runbooks/backup-restore.md

set -euo pipefail

CONFIG_FILE="${1:-/etc/infotanar/backup.env}"
# shellcheck source=backup.env.example
source "$CONFIG_FILE"

: "${DB_NAME:?hianyzik a konfiguraciobol}"
: "${DB_USER:?hianyzik a konfiguraciobol}"
: "${DB_PASSWORD:?hianyzik a konfiguraciobol}"
: "${BACKUP_REMOTE:?hianyzik a konfiguraciobol}"
: "${PRIVATE_STORAGE_DIR:?hianyzik a konfiguraciobol}"

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-3306}"
VIDEO_BACKUP_WEEKDAY="${VIDEO_BACKUP_WEEKDAY:-7}"
STATUS_FILE="${STATUS_FILE:-$PRIVATE_STORAGE_DIR/backup-last-success}"

today="$(date +%F)"
weekday="$(date +%u)"        # 1 = hetfo ... 7 = vasarnap
day_of_month="$(date +%d)"

work_dir="$(mktemp -d)"
trap 'rm -rf "$work_dir"' EXIT

log() {
    echo "[$(date '+%F %T')] $*"
}

dump_database() {
    local target="$1"

    # A jelszo fajlbol megy, hogy ne latsszon a folyamatlistaban.
    local credentials="$work_dir/mysql.cnf"
    printf '[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n' \
        "$DB_USER" "$DB_PASSWORD" "$DB_HOST" "$DB_PORT" > "$credentials"
    chmod 600 "$credentials"

    # --single-transaction: konzisztens kep az InnoDB tablakrol, zarolas nelkul.
    mysqldump --defaults-extra-file="$credentials" \
        --single-transaction --no-tablespaces \
        "$DB_NAME" | gzip > "$target"
}

upload_database_dump() {
    local dump="$1"
    local name
    name="$(basename "$dump")"

    rclone copyto "$dump" "$BACKUP_REMOTE/db/daily/$name"

    if [ "$weekday" = "7" ]; then
        rclone copyto "$dump" "$BACKUP_REMOTE/db/weekly/$name"
    fi

    if [ "$day_of_month" = "01" ]; then
        rclone copyto "$dump" "$BACKUP_REMOTE/db/monthly/$name"
    fi
}

prune_dumps_older_than() {
    local age="$1" directory="$BACKUP_REMOTE/db/$2"

    # Egyes tarolok hibat adnak, ha a mappa meg nem letezik (pl. az elso vasarnap elott).
    rclone mkdir "$directory"
    rclone delete --min-age "$age" "$directory"
}

# "copy", nem "sync": ami a szerverrol eltunik, a mentesben megmarad.
copy_directory() {
    local source="$1" destination="$2"

    if [ -d "$source" ]; then
        rclone copy "$source" "$destination"
    else
        log "Kihagyva, nincs ilyen mappa: $source"
    fi
}

dump="$work_dir/$DB_NAME-$today.sql.gz"

log "Adatbazis mentese: $DB_NAME"
dump_database "$dump"
upload_database_dump "$dump"
prune_dumps_older_than 7d daily
prune_dumps_older_than 28d weekly
prune_dumps_older_than 366d monthly

log "Szamlak mentese"
copy_directory "$PRIVATE_STORAGE_DIR/invoices" "$BACKUP_REMOTE/invoices"

if [ "$weekday" = "$VIDEO_BACKUP_WEEKDAY" ]; then
    log "Lecke-videok mentese"
    copy_directory "$PRIVATE_STORAGE_DIR/lesson-videos" "$BACKUP_REMOTE/videos"
fi

# A readiness vegpont (#130) ebbol latja, mikor volt az utolso sikeres mentes.
date -u +%FT%TZ > "$STATUS_FILE"
chmod 644 "$STATUS_FILE"

log "Kesz: $(du -h "$dump" | cut -f1) dump feltoltve ide: $BACKUP_REMOTE"
