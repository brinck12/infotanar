#!/usr/bin/env bash
#
# InfoTanar - egyszeri szerver-beallitas (OPS-4, OPS-9, OPS-12, OPS-13, PRIV-5).
#
# Onallo: minden szukseges fajlt a szkript maga ir ki. Idempotens (ujrafuttathato).
# Rootkent kell futtatni:
#
#   sudo bash /tmp/infotanar-bootstrap.sh
#   sudo ALERT_EMAIL=te@example.com bash /tmp/infotanar-bootstrap.sh     # riasztasi cimmel
#   sudo ENABLE_UFW=1 bash /tmp/infotanar-bootstrap.sh                    # tuzfal is
#
# Mit csinal:
#   1. Biztonsagi mentes (adatbazis, .env, nginx, php-fpm) a /root/infotanar-bootstrap-<ido>/ mappaba.
#   2. Redis (+ php-redis) telepitese es beallitasa (csak localhost, jelszo, noeviction, AOF).
#   3. PHP feltoltesi korlatok, kulon php-fpm pool a kodfuttatashoz, nagyobb fo pool.
#   4. nginx: biztonsagi fejlecek, /assets cache, kulon /run pool, 12 MB feltoltes. Hiba eseten visszaall.
#   5. A backend .env-je: Redis, zart beta (invite), https cim, riasztas, health token, korlatok.
#   6. systemd: queue worker, scheduler, riasztas-egyseg; config:cache, queue:restart.
#   7. Helyi ejszakai adatbazis-mentes (cron), journald korlat, fail2ban; opcionalisan ufw.
#
# Amit NEM csinal (kezzel kell): SMTP/levelezes, off-site mentes (rclone), Judge0 atallitas,
# a deploy-workflow (GitHub secretek), a kod pusholasa.

set -euo pipefail

APP_DIR=/var/www/infotanar/backend
ENV_FILE="$APP_DIR/.env"
NGINX_SITE=/etc/nginx/sites-available/default
SITE_HOST="${SITE_HOST:-194-163-161-182.sslip.io}"
RUN_POOL_CHILDREN="${RUN_POOL_CHILDREN:-12}"
JUDGE0_MAX_CONCURRENT_VALUE="${JUDGE0_MAX_CONCURRENT_VALUE:-10}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="/root/infotanar-bootstrap-$STAMP"
WARNINGS=()

say()  { printf '\n\033[1;32m== %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m!! %s\033[0m\n' "$*"; WARNINGS+=("$*"); }
fail() { printf '\033[1;31mXX %s\033[0m\n' "$*" >&2; exit 1; }

trap 'printf "\n\033[1;31mA szkript megakadt a(z) %s. sornal. Mentes: %s\033[0m\n" "$LINENO" "$BACKUP_DIR" >&2' ERR

# ---------------------------------------------------------------------------
say "0. Elozetes ellenorzesek es mentes"
# ---------------------------------------------------------------------------
[ "$(id -u)" -eq 0 ] || fail "Rootkent futtasd: sudo bash $0"
[ -f "$ENV_FILE" ] || fail "Nincs $ENV_FILE"
[ -d /etc/nginx ] && [ -d /etc/php/8.3/fpm ] || fail "nginx vagy php8.3-fpm hianyzik"
grep -q 'Ubuntu' /etc/os-release || warn "Nem Ubuntu rendszer: a csomagnevek eltrhetnek."

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
cp -a "$ENV_FILE" "$BACKUP_DIR/env.bak"
cp -a /etc/nginx "$BACKUP_DIR/nginx"
cp -a /etc/php/8.3/fpm "$BACKUP_DIR/php-fpm"
[ -f /etc/redis/redis.conf ] && cp -a /etc/redis/redis.conf "$BACKUP_DIR/redis.conf.orig" || true

# Helyi mentes szkript (a cron is ezt hasznalja). Elso hivas: most, a valtoztatasok elott.
cat > /usr/local/bin/infotanar-local-backup.sh <<'BACKUP_SH'
#!/usr/bin/env bash
# InfoTanar helyi adatbazis- es .env-mentes. NEM szerveren kivuli: lemezhiba ellen nem ved.
set -euo pipefail
APP_DIR=/var/www/infotanar/backend
DEST="${1:-/var/backups/infotanar}"
KEEP_DAYS=14
envv() { grep -E "^$1=" "$APP_DIR/.env" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
umask 077
mkdir -p "$DEST"
cnf="$(mktemp)"; trap 'rm -f "$cnf"' EXIT
printf '[client]\nuser=%s\npassword=%s\nhost=%s\nport=%s\n' \
  "$(envv DB_USERNAME)" "$(envv DB_PASSWORD)" "$(envv DB_HOST || echo 127.0.0.1)" "$(envv DB_PORT || echo 3306)" > "$cnf"
day="$(date +%F-%H%M)"
mysqldump --defaults-extra-file="$cnf" --no-tablespaces --single-transaction --routines --triggers "$(envv DB_DATABASE)" | gzip -9 > "$DEST/db-$day.sql.gz"
gzip -t "$DEST/db-$day.sql.gz"
cp -a "$APP_DIR/.env" "$DEST/env-$day"
find "$DEST" -type f -mtime +"$KEEP_DAYS" -delete
echo "[$(date '+%F %T')] mentes kesz: $DEST/db-$day.sql.gz"
BACKUP_SH
chmod 755 /usr/local/bin/infotanar-local-backup.sh
/usr/local/bin/infotanar-local-backup.sh "$BACKUP_DIR" || fail "Az elozetes adatbazis-mentes nem sikerult: nem megyek tovabb."
echo "Elozetes mentes: $BACKUP_DIR"

# ---------------------------------------------------------------------------
say "1. Csomagok: redis-server, php-redis"
# ---------------------------------------------------------------------------
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq redis-server php-redis >/dev/null
php -m | grep -qix redis || fail "A php-redis kiterjesztes nem toltodott be."
echo "php-redis: rendben"

# ---------------------------------------------------------------------------
say "2. Redis beallitas"
# ---------------------------------------------------------------------------
REDIS_PASS_FILE=/root/.infotanar-redis-password
if [ ! -s "$REDIS_PASS_FILE" ]; then
    (umask 077; openssl rand -hex 24 > "$REDIS_PASS_FILE")
fi
REDIS_PASS="$(cat "$REDIS_PASS_FILE")"

redis_set() { # kulcs ertek: a regi sor torlese, az uj a vegere
    sed -i -E "/^[[:space:]]*$1[[:space:]]/d" /etc/redis/redis.conf
    printf '%s %s\n' "$1" "$2" >> /etc/redis/redis.conf
}
redis_set bind "127.0.0.1 -::1"
redis_set protected-mode yes
redis_set port 6379
redis_set requirepass "$REDIS_PASS"
redis_set maxmemory 256mb
redis_set maxmemory-policy noeviction
redis_set appendonly yes
redis_set appendfsync everysec
redis_set supervised systemd
systemctl enable redis-server >/dev/null 2>&1
systemctl restart redis-server
sleep 1
[ "$(REDISCLI_AUTH="$REDIS_PASS" redis-cli ping)" = "PONG" ] || fail "A Redis nem valaszol PONG-gal."
ss -ltn | grep -q '0.0.0.0:6379' && fail "A Redis kifele is hallgat!" || true
echo "Redis: PONG, csak localhost"

# ---------------------------------------------------------------------------
say "3. PHP korlatok es php-fpm poolok"
# ---------------------------------------------------------------------------
cat > /etc/php/8.3/fpm/conf.d/99-infotanar.ini <<'PHPINI'
; InfoTanar fajlfeladatok (docs/runbooks/go-live.md). Az nginx client_max_body_size 12m a parja.
upload_max_filesize = 12M
post_max_size = 14M
max_file_uploads = 5
memory_limit = 256M
PHPINI

# Kulon pool a kodfuttatashoz (deploy/php-fpm/pool.conf), hogy egy osztalynyi futtatas ne allitsa le a belepest.
cat > /etc/php/8.3/fpm/pool.d/infotanar-run.conf <<RUNPOOL
; Kulon php-fpm pool a POST /api/v1/run es /api/v1/submissions vegpontoknak.
[infotanar-run]
user = www-data
group = www-data
listen = /run/php/php8.3-fpm-run.sock
listen.owner = www-data
listen.group = www-data
pm = static
; Legyen >= JUDGE0_MAX_CONCURRENT (.env). A szerveren a memoria megosztott a Judge0-val es az AdjalPenzt-tel.
pm.max_children = ${RUN_POOL_CHILDREN}
pm.max_requests = 500
request_terminate_timeout = 55s
request_slowlog_timeout = 30s
slowlog = /var/log/php8.3-fpm-run-slow.log
clear_env = yes
php_admin_value[error_log] = /var/log/php8.3-fpm-run.log
php_admin_flag[log_errors] = on
RUNPOOL

# A fo pool (5 gyerek) tul kicsi: a phpMyAdmin es az osszes nem-futtatas kerese is itt megy.
WWW=/etc/php/8.3/fpm/pool.d/www.conf
sed -i -E \
  -e 's/^pm\.max_children *=.*/pm.max_children = 15/' \
  -e 's/^pm\.start_servers *=.*/pm.start_servers = 4/' \
  -e 's/^pm\.min_spare_servers *=.*/pm.min_spare_servers = 2/' \
  -e 's/^pm\.max_spare_servers *=.*/pm.max_spare_servers = 6/' "$WWW"

if php-fpm8.3 -t 2>/tmp/fpm-test.log; then
    systemctl restart php8.3-fpm
    echo "php-fpm: ujrainditva, ket pool (www, infotanar-run)"
else
    cat /tmp/fpm-test.log >&2
    rm -f /etc/php/8.3/fpm/pool.d/infotanar-run.conf /etc/php/8.3/fpm/conf.d/99-infotanar.ini
    cp -a "$BACKUP_DIR/php-fpm/pool.d/www.conf" "$WWW"
    fail "A php-fpm konfiguracio hibas, visszaallitva."
fi

# ---------------------------------------------------------------------------
say "4. nginx"
# ---------------------------------------------------------------------------
# A Content-Security-Policy kenyszeritese csak akkor biztonsagos, ha a feltoltott frontend build nem
# tolt kulso CDN-rol (a regi build a Monaco-t a jsdelivr-rol toltotte). Ha talal ilyet, csak jelent.
CSP_HEADER="Content-Security-Policy"
if grep -rlq 'cdn.jsdelivr.net' /var/www/infotanar/frontend/assets 2>/dev/null; then
    CSP_HEADER="Content-Security-Policy-Report-Only"
    warn "A jelenlegi frontend build jsdelivr-t hasznal: a CSP egyelore Report-Only. Az uj frontend deploy utan: sed -i 's/Content-Security-Policy-Report-Only/Content-Security-Policy/' /etc/nginx/snippets/infotanar-security-headers.conf && nginx -s reload"
fi

cat > /etc/nginx/snippets/infotanar-security-headers.conf <<NGSNIP
# InfoTanar biztonsagi fejlecek (deploy/nginx/snippets). Az add_header nem oroklodik, ezert minden location include-olja.
# HSTS egyelore 1 nap: a sslip.io cim ideiglenes; a vegleges domain utan emelheto.
add_header Strict-Transport-Security "max-age=86400" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header ${CSP_HEADER} "default-src 'self'; script-src 'self' https://pixel.barion.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: blob: https://pixel.barion.com; media-src 'self' blob:; worker-src 'self' blob:; connect-src 'self' https://pixel.barion.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;
NGSNIP

# server_tokens: ha mar van a nginx.conf-ban, a masodik direktiva hibat okoz ("duplicate").
rm -f /etc/nginx/conf.d/infotanar-hardening.conf
if ! grep -rqE '^[[:space:]]*server_tokens' /etc/nginx/nginx.conf /etc/nginx/conf.d /etc/nginx/sites-enabled 2>/dev/null; then
    echo 'server_tokens off;' > /etc/nginx/conf.d/infotanar-hardening.conf
fi

cp -a "$NGINX_SITE" "$BACKUP_DIR/nginx-default.before"
set +e
python3 - <<'PY'
import sys
p = '/etc/nginx/sites-available/default'
s = open(p, encoding='utf-8').read()
if '# infotanar-managed' in s:
    print('nginx: mar modositva, kihagyom')
    sys.exit(10)

H = '        include snippets/infotanar-security-headers.conf;\n'

old_root = '''    location / {
        try_files $uri $uri/ /index.html;
    }
'''
new_root = '''    # infotanar-managed: a Vite fajlnevei tartalom-hash-eltek, orokre cache-elhetok.
    location /assets/ {
''' + H + '''        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    # Az index.html mindig ujraellenorzendo.
    location = /index.html {
''' + H + '''        add_header Cache-Control "no-cache" always;
    }

    location / {
''' + H + '''        try_files $uri $uri/ /index.html;
    }
'''

old_api = '''    location /api {
        try_files $uri @laravel;
    }
'''
new_api = '''    # Kodfuttatas: kulon php-fpm pool; ha tele van, gyors 503 (a frontend barati uzenetet mutat).
    location ~ ^/api/v1/(run|submissions)$ {
''' + H + '''        fastcgi_pass unix:/run/php/php8.3-fpm-run.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/infotanar/backend/public/index.php;
        fastcgi_param SCRIPT_NAME /index.php;
        fastcgi_param DOCUMENT_ROOT /var/www/infotanar/backend/public;
        fastcgi_read_timeout 60s;
        client_max_body_size 1m;
        fastcgi_connect_timeout 2s;
        error_page 502 503 = @run_busy;
    }

    location @run_busy {
        default_type application/json;
        add_header Retry-After 5 always;
        return 503 '{"status":"error","message":"Most sokan futtatnak kódot. Próbáld újra pár másodperc múlva.","reason":"busy","retry_after":5,"results":[]}';
    }

    location /api {
        # Fajlfeltoltes (fajlfeladatok): a PHP-oldali parja 12M/14M (99-infotanar.ini).
        client_max_body_size 12m;
        try_files $uri @laravel;
    }
'''

old_lv = '''    location @laravel {
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;'''
new_lv = '''    location @laravel {
''' + H + '''        fastcgi_pass unix:/run/php/php8.3-fpm.sock;'''

old_to = '        fastcgi_read_timeout 120s;\n    }\n\n    # --- ACME'
new_to = '        fastcgi_read_timeout 60s;\n    }\n\n    # --- ACME'

for old, new in [(old_root, new_root), (old_api, new_api), (old_lv, new_lv), (old_to, new_to)]:
    if s.count(old) != 1:
        print('nginx: nem talalhato egyertelmuen:', old.strip().splitlines()[0])
        sys.exit(3)
    s = s.replace(old, new)

open(p + '.new', 'w', encoding='utf-8').write(s)
print('nginx: uj konfiguracio elkeszult')
PY
py=$?
set -e
if [ "$py" -eq 0 ]; then
    cp "$NGINX_SITE.new" "$NGINX_SITE"
    rm -f "$NGINX_SITE.new"
    if nginx -t 2>/tmp/nginx-test.log; then
        systemctl reload nginx
        echo "nginx: ujratoltve"
    else
        cat /tmp/nginx-test.log >&2
        cp -a "$BACKUP_DIR/nginx-default.before" "$NGINX_SITE"
        nginx -t && systemctl reload nginx
        warn "Az nginx teszt elbukott, a regi konfiguracio visszaallitva (a fejlec-snippet marad)."
    fi
elif [ "$py" -eq 10 ]; then
    nginx -t && systemctl reload nginx
else
    warn "Az nginx site nem modosult (az elvart blokkok nem egyeznek). Kezzel illeszd be: deploy/nginx/ + deploy/nginx/snippets/infotanar-run-location.conf.example"
    nginx -t && systemctl reload nginx
fi

# ---------------------------------------------------------------------------
say "5. Backend .env"
# ---------------------------------------------------------------------------
set_env() { # kulcs ertek
    local k="$1" v="$2" tmp; tmp="$(mktemp)"
    if grep -q "^${k}=" "$ENV_FILE"; then
        awk -v k="$k" -v v="$v" 'BEGIN{FS=OFS="="} $1==k {print k"="v; next} {print}' "$ENV_FILE" > "$tmp"
    else
        cp "$ENV_FILE" "$tmp"
        [ -z "$(tail -c1 "$tmp")" ] || echo >> "$tmp"
        printf '%s=%s\n' "$k" "$v" >> "$tmp"
    fi
    cat "$tmp" > "$ENV_FILE"   # a fajl tulajdonosa/jogosultsaga valtozatlan marad
    rm -f "$tmp"
}
get_env() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- || true; }

set_env APP_NAME '"InfoTanár"'
set_env APP_URL "https://$SITE_HOST"
set_env FRONTEND_URL "https://$SITE_HOST"
set_env LOG_LEVEL warning
set_env CACHE_STORE redis
set_env QUEUE_CONNECTION redis
set_env SESSION_DRIVER redis
set_env REDIS_CLIENT phpredis
set_env REDIS_HOST 127.0.0.1
set_env REDIS_PORT 6379
set_env REDIS_PASSWORD "$REDIS_PASS"
set_env REGISTRATION_MODE invite
set_env JUDGE0_MAX_CONCURRENT "$JUDGE0_MAX_CONCURRENT_VALUE"
set_env JUDGE0_SLOT_TTL 55
set_env SANCTUM_EXPIRATION 43200

if [ -z "$(get_env HEALTH_TOKEN)" ]; then
    set_env HEALTH_TOKEN "$(openssl rand -hex 32)"
fi
if [ -n "${ALERT_EMAIL:-}" ]; then
    set_env ALERT_EMAIL "$ALERT_EMAIL"
elif [ -z "$(get_env ALERT_EMAIL)" ]; then
    warn "ALERT_EMAIL nincs beallitva: futtasd ujra ALERT_EMAIL=cim megadasaval, vagy szerkeszd az .env-et."
fi
MAILER="$(get_env MAIL_MAILER)"
if [ -z "$MAILER" ] || [ "$MAILER" = "log" ] || [ "$MAILER" = "array" ]; then
    warn "MAIL_MAILER='${MAILER:-<nincs>}': a megerosito es jelszo-visszaallito levelek nem erkeznek meg. Valodi SMTP kell (MAIL_MAILER=smtp, MAIL_HOST, MAIL_PORT, MAIL_USERNAME, MAIL_PASSWORD, MAIL_FROM_ADDRESS)."
fi

# ---------------------------------------------------------------------------
say "6. systemd egysegek, config cache"
# ---------------------------------------------------------------------------
cat > /etc/systemd/system/infotanar-alert@.service <<'UNIT'
# Riasztas levelben, ha egy InfoTanar egyseg elhal. Kell hozza a `mail` parancs MTA-val (egyelore nincs: nem kuld semmit).
[Unit]
Description=InfoTanar alert for %i

[Service]
Type=oneshot
User=www-data
Group=www-data
EnvironmentFile=-/var/www/infotanar/backend/.env
ExecStart=/bin/sh -c 'if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null; then systemctl status --no-pager --lines=30 "%i" 2>&1 | mail -s "[InfoTanar] Elhalt egyseg: %i" "$ALERT_EMAIL"; fi'
UNIT

cat > /etc/systemd/system/infotanar-queue.service <<'UNIT'
[Unit]
Description=InfoTanar queue worker
After=network.target mysql.service redis-server.service
StartLimitIntervalSec=300
StartLimitBurst=5
OnFailure=infotanar-alert@%n.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/infotanar/backend
ExecStart=/usr/bin/php artisan queue:work --timeout=60 --sleep=3 --tries=3 --backoff=10 --max-time=3600 --memory=256 --max-jobs=500
Restart=always
RestartSec=5
TimeoutStopSec=120

[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/systemd/system/infotanar-scheduler.service <<'UNIT'
[Unit]
Description=InfoTanar scheduler
After=network.target mysql.service redis-server.service
StartLimitIntervalSec=300
StartLimitBurst=5
OnFailure=infotanar-alert@%n.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/infotanar/backend
ExecStart=/usr/bin/php artisan schedule:work
Restart=always
RestartSec=5
TimeoutStopSec=120

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload

# A bootstrap/cache a deploy felhasznalo tulajdona: o epiti az uj konfiguraciot.
DEPLOY_USER="$(stat -c %U "$APP_DIR/artisan")"
artisan() { runuser -u "$DEPLOY_USER" -- php "$APP_DIR/artisan" "$@"; }
( cd "$APP_DIR" && artisan config:clear && artisan config:cache ) || warn "config:cache nem sikerult (lasd fent)."
( cd "$APP_DIR" && artisan queue:restart ) || warn "queue:restart nem sikerult."

systemctl enable infotanar-queue infotanar-scheduler >/dev/null 2>&1
systemctl restart infotanar-queue infotanar-scheduler
sleep 2

# ---------------------------------------------------------------------------
say "7. Helyi mentes, journald, fail2ban, (ufw)"
# ---------------------------------------------------------------------------
install -d -m 700 /var/backups/infotanar
echo '30 2 * * * root /usr/local/bin/infotanar-local-backup.sh >> /var/log/infotanar-backup.log 2>&1' > /etc/cron.d/infotanar-backup
chmod 644 /etc/cron.d/infotanar-backup
warn "A mentes csak HELYI (/var/backups/infotanar, 14 nap). Szerveren kivuli (rclone) mentes meg kell: deploy/backup/, docs/runbooks/backup-restore.md."

mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=500M\n' > /etc/systemd/journald.conf.d/infotanar.conf
systemctl restart systemd-journald

systemctl enable --now fail2ban >/dev/null 2>&1 || warn "fail2ban nem indult el."

if [ "${ENABLE_UFW:-0}" = "1" ]; then
    if ss -ltn | grep -qE ':22\b'; then
        ufw allow 22/tcp >/dev/null
        ufw allow 80/tcp >/dev/null
        ufw allow 443/tcp >/dev/null
        ufw --force enable >/dev/null
        echo "ufw: bekapcsolva (22, 80, 443)"
    else
        warn "ufw kihagyva: nem latom az sshd-t a 22-es porton."
    fi
else
    echo "ufw: kihagyva (ENABLE_UFW=1-gyel kapcsolhato be)"
fi

# ---------------------------------------------------------------------------
say "8. Ellenorzes"
# ---------------------------------------------------------------------------
check() { # nev parancs...
    local name="$1"; shift
    if "$@" >/dev/null 2>&1; then printf '  [ OK ] %s\n' "$name"; else printf '  [HIBA] %s\n' "$name"; WARNINGS+=("Ellenorzes bukott: $name"); fi
}
check "redis PONG"                 bash -c "[ \"\$(REDISCLI_AUTH='$REDIS_PASS' redis-cli ping)\" = PONG ]"
check "php-redis (cli)"            bash -c "php -m | grep -qix redis"
check "nginx -t"                   nginx -t
check "php8.3-fpm aktiv"           systemctl is-active --quiet php8.3-fpm
check "infotanar-run socket"       test -S /run/php/php8.3-fpm-run.sock
check "infotanar-queue aktiv"      systemctl is-active --quiet infotanar-queue
check "infotanar-scheduler aktiv"  systemctl is-active --quiet infotanar-scheduler
check "HTTPS fooldal 200"          bash -c "[ \"\$(curl -sk -o /dev/null -w '%{http_code}' --resolve $SITE_HOST:443:127.0.0.1 https://$SITE_HOST/)\" = 200 ]"
check "API /health valaszol"       bash -c "curl -sk --resolve $SITE_HOST:443:127.0.0.1 https://$SITE_HOST/api/v1/health | grep -q ."

echo
echo "app:check-config:"
( cd "$APP_DIR" && artisan app:check-config ) || true

echo
echo "Judge0 (csak olvasas):"
if [ -f /opt/judge0/judge0.conf ]; then
    grep -E '^(COUNT|MAX_QUEUE_SIZE|ENABLE_NETWORK)=' /opt/judge0/judge0.conf | sed 's/^/  /' || true
    echo "  CPU magok: $(nproc). A COUNT legyen kisebb ennel; a pool ($RUN_POOL_CHILDREN) >= JUDGE0_MAX_CONCURRENT ($JUDGE0_MAX_CONCURRENT_VALUE)."
else
    echo "  /opt/judge0/judge0.conf nem talalhato."
fi

echo
printf '\033[1;32m================ KESZ ================\033[0m\n'
echo "Mentes + eredeti konfig:   $BACKUP_DIR"
echo "HEALTH_TOKEN (GitHub secret HEALTH_TOKEN-nek is ez kell):"
echo "  $(get_env HEALTH_TOKEN)"
echo "Redis jelszo:              $REDIS_PASS_FILE (root, 600)"
if [ "${#WARNINGS[@]}" -gt 0 ]; then
    printf '\n\033[1;33mTeendok / figyelmeztetesek (%d):\033[0m\n' "${#WARNINGS[@]}"
    for w in "${WARNINGS[@]}"; do printf '  - %s\n' "$w"; done
fi
cat <<ROLLBACK

Visszaallitas, ha valami elromlott:
  cp $BACKUP_DIR/env.bak $ENV_FILE && cd $APP_DIR && runuser -u $DEPLOY_USER -- php artisan config:cache
  cp $BACKUP_DIR/nginx-default.before $NGINX_SITE && nginx -t && systemctl reload nginx
  rm /etc/php/8.3/fpm/pool.d/infotanar-run.conf /etc/php/8.3/fpm/conf.d/99-infotanar.ini && systemctl restart php8.3-fpm
  systemctl disable --now infotanar-queue infotanar-scheduler
ROLLBACK
