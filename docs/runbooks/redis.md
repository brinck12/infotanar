# Redis: cache, sor és munkamenet (OPS-9)

Cél: a cache, a queue és a session az adatbázisból Redisbe kerül, hogy a
terhelés alatti cache-zárak (`cache_locks`), a limiterek és a sor sorai ne
versenyezzenek a MySQL-lel. A Redis ugyanazon a szerveren fut, mint az app,
csak localhostról érhető el.

A parancsok a `/var/www/infotanar/backend` mappából futtatandók (ahol nem jelezzük másként).

## 1. Telepítés

```bash
sudo apt update
sudo apt install -y redis-server php-redis        # a php-redis adja a phpredis klienst
php -m | grep -i redis                            # "redis" a kimenetben
sudo systemctl restart php8.3-fpm                 # a verzió a szerveré
```

A `REDIS_CLIENT=phpredis` az alapértelmezés (`config/database.php`), predis nem kell.

## 2. Beállítás (`/etc/redis/redis.conf`)

```conf
bind 127.0.0.1 -::1          # csak localhost; soha ne 0.0.0.0
protected-mode yes
port 6379
requirepass <hosszú véletlen jelszó>     # openssl rand -base64 32
maxmemory 256mb
maxmemory-policy noeviction
appendonly yes               # a sor tartalma újraindítás után is megmarad
appendfsync everysec
supervised systemd
```

Megjegyzések:

- `noeviction`: a sor és a session nem veszhet el memóriahiány miatt; ha a
  memória betelik, az írás hibázik (hangos), nem pedig csendben törli a
  feladatokat. 256 MB bőven elég a béta méretére; figyeld az `INFO memory`
  `used_memory_human` értékét (lásd 6. pont).
- Az `allkeys-lru` cache-nek jó, de a sorral és sessionnel közös példányon veszélyes.
- A tűzfalon (ufw) a 6379-es port ne legyen nyitva: `sudo ufw status`.

```bash
sudo systemctl restart redis-server
sudo systemctl enable redis-server
redis-cli -a '<jelszó>' ping                      # PONG
ss -ltnp | grep 6379                              # csak 127.0.0.1 és ::1
```

## 3. `.env` kulcsok

A szerver `.env`-je kézzel kezelt, a deploy nem írja felül. Mintát a
`backend/.env.example` "Éles környezet" blokkja ad.

```dotenv
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=<ugyanaz, mint a requirepass>
```

Ha a jelszó speciális karaktert tartalmaz, tedd idézőjelbe. A cache a 1-es,
a sor és a session a 0-s Redis adatbázist használja (`REDIS_CACHE_DB`, `REDIS_DB`).

Az `app:check-config` (a deploy is futtatja) figyelmeztet, ha a
`CACHE_STORE`, a `QUEUE_CONNECTION` vagy a `SESSION_DRIVER` még `database`,
vagy ha Redis van használatban, de a `REDIS_PASSWORD` üres.

## 4. Átállás (cutover)

Rövid, karbantartási ablakban (éjjel, kevés felhasználónál); tervezett kiesés
kb. 2-3 perc.

1. Előfeltétel: a Redis fut és a `redis-cli -a ... ping` válaszol; a jelenlegi
   `.env`-ről másolat: `cp .env .env.bak-$(date +%F)`.
2. Mentés (docs/runbooks/backup-restore.md), és a függő sor állapota:
   `php artisan queue:failed`, valamint a `jobs` tábla sorainak száma:
   `php artisan tinker --execute="echo DB::table('jobs')->count();"`.
3. Karbantartás: `php artisan down --retry=60`.
4. Az adatbázis-sor kiürítése: a régi workert hagyd lefutni, amíg a `jobs`
   tábla üres (`sudo systemctl stop infotanar-queue` csak ennek végén).
   Ha mégis maradt sor: `php artisan queue:work database --stop-when-empty`
   egyszer, kézzel, a régi `.env`-vel.
5. `.env` átírása a 3. pont szerint (`CACHE_STORE`, `QUEUE_CONNECTION`, `SESSION_DRIVER`, `REDIS_*`).
6. `php artisan config:clear && php artisan config:cache`
7. `php artisan queue:restart`, majd `sudo systemctl restart infotanar-queue infotanar-scheduler`.
8. `php artisan up`
9. Ellenőrzés:
   - `php artisan app:check-config` figyelmeztetés nélkül;
   - `curl -s -H "X-Health-Token: <token>" https://<domain>/api/v1/health/ready`: a `queue_worker` és a `scheduler` pár perc alatt `ok` lesz;
   - `redis-cli -a '<jelszó>' dbsize` növekszik; egy próbafutás (`/run`) lefut;
   - `journalctl -u infotanar-queue -n 50` nem mutat Redis-hibát.

Következmények: a bejelentkezett felhasználók **session-je megszűnik** (új
Redis-session), de a Sanctum bearer tokenek az adatbázisban vannak, így az
SPA-felhasználók bejelentkezve maradnak. A cache üresen indul; a Judge0
nyelvlista és a limiterek maguktól újratöltődnek.

## 5. Visszaállás (rollback)

Ha a cutover után a Redis hibázik, vagy a readiness nem zöld 10 percen belül:

1. `php artisan down --retry=60`
2. `.env`: `CACHE_STORE=database`, `QUEUE_CONNECTION=database`, `SESSION_DRIVER=database` (vagy `cp .env.bak-<dátum> .env`).
3. `php artisan config:clear && php artisan config:cache`
4. A Redisben maradt sorfeladatok **nem** kerülnek át automatikusan. Ha voltak
   függő jobok, nézd meg a Redisben: `redis-cli -a '<jelszó>' llen queues:default`.
   A billing jobok újraindíthatók (az `ExpireGracePeriods`, `SyncPendingPayments`,
   `RetryPendingInvoices` ütemezett, a számlázás idempotens); a levelek
   elvesznek, de az újrakérhetők.
5. `sudo systemctl restart infotanar-queue infotanar-scheduler`, `php artisan up`.

Az `infotanar-queue.service` a `After=redis-server.service` sort tartalmazza,
így a worker a Redis után indul (reboot után is).

## 6. Üzemeltetés

- Memória és kulcsok: `redis-cli -a '<jelszó>' info memory | grep used_memory_human`, `dbsize`.
- A sor hossza: `redis-cli -a '<jelszó>' llen queues:default`; a readiness `queue_backlog` sora is ezt mutatja.
- Mentés: a Redis tartalma (sor) az `appendonly` miatt a `/var/lib/redis` alatt van; a cache és a session újraépíthető, a **sor nem**. A backup runbookban a `/var/lib/redis/appendonlydir` bekerül a mentésbe (vagy a sor kiürítése a mentés előtt).
- Worker újraindítás deploykor: a deploy a `php artisan queue:restart` jelet küldi (ez is Redisen át megy); a worker a futó job végén kilép, a systemd újraindítja. Új `.env` után mindig `config:cache` és `queue:restart`.
- A Redis újraindítása (`sudo systemctl restart redis-server`) az AOF miatt nem veszíti el a sort; a workerek maguktól újracsatlakoznak, de utána `sudo systemctl restart infotanar-queue` biztos, ami biztos.
- Ha a Redis nem elérhető: a readiness `cache`/`queue` sora `failed`, a `/run` és a bejelentkezés 500-at adhat. Első lépés `systemctl status redis-server`, `journalctl -u redis-server -n 50`; ha nem javítható gyorsan, rollback (5. pont).
