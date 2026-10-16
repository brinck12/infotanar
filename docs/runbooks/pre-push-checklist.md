# Push előtti ellenőrzőlista (`fullstack/backend-platform` → `main`)

Készült: 2026-10-16. A helyi `main` már tartalmazza az összefésülést (`de7d740`), de **nincs pusholva**. A `main`-re push azonnal élesít (`deploy.yml`: rsync `--delete`, `migrate --force`, nincs visszagörgetés). Ezért a lenti lépéseket a push **előtt** kell elvégezni a szerveren.

A lista sorrendben haladjon. A `(kód)` jelű tételek a repóban már készen vannak, a `(szerver)` jelűek kézi munkát igényelnek.

## 0. Helyi kapuk (kész, 2026-10-16)

- [x] `composer lint`, `composer analyse`, `docs:endpoints --check`
- [x] frontend `lint`, `typecheck`, `build`
- [x] `tests`: `npm run check`
- [x] `test:api` (api + api-rate-limit): 363 zöld
- [x] `test:e2e` (e2e-mocked): 77 zöld
- [ ] `backend-mysql` CI job: csak a push után fut. Ha piros, a deploy nem indul (a deploy a CI sikerére vár), de a REL-1 versenytesztek így először a pusholt kódon futnak.

## 1. Mentés és visszaút (szerver)

- [ ] Friss adatbázis-mentés, és a mentés mérete/ideje ellenőrizve (`docs/runbooks/backup-restore.md`). Valódi visszaállítási próba még nem volt: legalább egy mentést állíts vissza egy ideiglenes adatbázisba, és jegyezd fel az időt.
- [ ] A jelenlegi `.env` másolata: `cp .env .env.bak-$(date +%F)`, a jelszókezelőbe is (az `APP_KEY` elvesztése a titkosított oszlopokat olvashatatlanná teszi).
- [ ] A jelenlegi éles kiadás azonosítója (`git rev-parse HEAD` a szerveren, vagy a legutóbbi sikeres deploy SHA-ja): erre kell visszaállni, ha baj van.
- [ ] Az új migrációk átnézve: 2026-10-10 óta ~15 új migráció (típusos feladatok, vizsgák, fájlbeadások, szóbeli gyakorlás, `sample_solutions`, regisztrációs kapu). Mind additív, de a `exercises` és `submissions` táblát módosítók nagy táblán lassúak lehetnek. Ha az éles `submissions` több százezer soros, tervezz karbantartási ablakot.

## 2. Redis (szerver, OPS-9) — `docs/runbooks/redis.md`

A legfontosabb előfeltétel: az új párhuzamossági korlát és a limiterek cache-zárakat használnak, adatbázis-gyorsítótáron terhelés alatt versenyeznek.

- [ ] `redis-server` és `php-redis` telepítve, `php -m | grep -i redis` kimenetében `redis`.
- [ ] `/etc/redis/redis.conf`: `bind 127.0.0.1 -::1`, `requirepass`, `maxmemory 256mb`, `maxmemory-policy noeviction`, `appendonly yes`.
- [ ] `redis-cli -a '<jelszó>' ping` → `PONG`; `ss -ltnp | grep 6379` csak localhostot mutat; az `ufw` nem engedi a 6379-et.
- [ ] A cutover **a push után ugyanabban az ablakban** vagy előtte? Javasolt: **előtte**, a régi kóddal is működik (`CACHE_STORE`, `QUEUE_CONNECTION`, `SESSION_DRIVER` → `redis`). Lépések a runbook 4. pontja szerint (sor kiürítése, `.env`, `config:cache`, `queue:restart`, readiness).
- [ ] `/var/lib/redis/appendonlydir` bekerült a mentésbe (a sor tartalma nem építhető újra).
- [ ] `infotanar-queue.service` frissítve (`After=redis-server.service`, lásd 4. pont).

## 3. A szerver `.env`-jének új kulcsai (szerver)

A deploy **nem** írja felül az `.env`-et. Minden új kulcsnak itt kell lennie, különben az `app:check-config` figyelmeztet, `DEPLOY_STRICT_CONFIG=true` mellett pedig a deploy meg is bukhat.

**Kötelező**

- [ ] `REGISTRATION_MODE=invite` — **az alapértelmezés `open`!** E nélkül a zárt béta nyitott regisztrációval indul.
- [ ] `ALERT_EMAIL=<a te címed>` — az 5xx riasztások és a kliens-hiba napi összefoglaló ide jön.
- [ ] `HEALTH_TOKEN=<openssl rand -hex 32>` — ugyanez a GitHub `HEALTH_TOKEN` secret is.
- [ ] `MAIL_MAILER=smtp` (nem `log`/`array`), valódi `MAIL_HOST/PORT/USERNAME/PASSWORD`, `MAIL_FROM_ADDRESS` a saját domainről, SPF + DKIM.
- [ ] `LOG_LEVEL=warning`
- [ ] `APP_DEBUG=false`, `APP_ENV=production`, `APP_URL` és `FRONTEND_URL` végleges `https://`.
- [ ] `CACHE_STORE=redis`, `QUEUE_CONNECTION=redis`, `SESSION_DRIVER=redis`, `REDIS_HOST/PORT/PASSWORD`.
- [ ] `JUDGE0_URL`, `JUDGE0_AUTH_TOKEN`.
- [ ] `SANCTUM_EXPIRATION` megadva.

**Ajánlott (ellenőrizd az alapértéket a kapacitásodhoz)**

- [ ] `JUDGE0_MAX_CONCURRENT` (alap 20): legyen ≤ a Judge0 `COUNT`-ja és ≤ a php-fpm pool munkásainak ~60%-a. Ha több, a diákok `busy` választ kapnak.
- [ ] `JUDGE0_SLOT_TTL` (alap 55) legyen kicsit nagyobb, mint `JUDGE0_EVALUATION_DEADLINE` (45).
- [ ] `JUDGE0_QUEUE_WARN_DEPTH` (alap 50).
- [ ] `FILETASKS_MAX_CONCURRENT_EVALUATIONS` (alap 4).
- [ ] `CATALOG_FREE_LESSONS_PER_TRACK` (alap 2).
- [ ] `BACKUP_REMOTE` (az off-site cél, a `docs/privacy/ropa.md`-hez is kell).
- [ ] A Barion/Számlázz kulcsok **nem** kellenek a bétához (számlázás halasztva). Ha az `app:check-config --strict` ezek hiányát blokkolónak jelzi, a `DEPLOY_STRICT_CONFIG` maradjon `false` a béta idejére, vagy a hiányt a kód kezelje opcionálisként (ellenőrizendő: lásd 7. pont).

Ellenőrzés a szerveren:

```bash
php artisan config:clear && php artisan config:cache
php artisan app:check-config            # figyelmeztetés nélkül
php artisan app:check-config --strict   # a deploy ezt futtatja, ha DEPLOY_STRICT_CONFIG=true
```

## 4. Szolgáltatások és fájlok (szerver)

- [ ] `deploy/systemd/*` frissítve a szerveren (OPS-12 keményítés: `OnFailure=`, `--memory`, `--max-jobs`, `TimeoutStopSec`, `After=redis-server.service`), majd `systemctl daemon-reload` és újraindítás. A deploy a systemd egységeket **nem** másolja.
- [ ] `deploy/php-fpm/pool.conf` és a külön `/run`, `/submissions` pool telepítve (OPS-4), nginx location hozzá. Az `nginx -t` hibátlan, utána reload.
- [ ] `deploy/judge0/` — `docker compose up -d`, `judge0.conf` a saját tokennel, `127.0.0.1`-re kötve; a readiness sorhossz sora `ok`.
- [ ] `deploy/nginx/infotanar.conf` frissítve (CSP kényszerítve, `server_tokens off`); a CSP-t `docs/runbooks/csp.md` szerint böngészőben kipróbálni (Monaco, Barion pixel nincs).
- [ ] PHP-FPM feltöltési korlátok (`upload_max_filesize=12M`, `post_max_size=14M`, `max_file_uploads=5`, `memory_limit=256M`) és `zip`, `intl`, `dom`, `fileinfo` kiterjesztések.
- [ ] Python 3 telepítve (a feladat-korlátok AST ellenőrzése nélküle csendben kimarad).

## 5. GitHub (böngészőben)

- [ ] Secretek/változók: `DEPLOY_URL`, `HEALTH_TOKEN`, `DEPLOY_STRICT_CONFIG`.
- [ ] `VITE_SITE_URL` beállítva a deploy buildhez (a `robots.txt` és `sitemap.xml` ebből készül).
- [ ] Később, az `ops-deploy-releases` ág előtt: `production` Environment kötelező jóváhagyóval és `DEPLOY_KNOWN_HOSTS` secret. **Ez az ág most nincs a `main`-ben, szándékosan.**

## 6. Push

- [ ] Az 1–5. pont kész, a readiness a szerveren zöld.
- [ ] `git push origin main`.
- [ ] Figyelni: GitHub Actions CI (a `backend-mysql` job is), majd a deploy. A deploy végén a readiness-próba 10 újrapróbával fut.
- [ ] Bukás esetén: **nincs automatikus visszagörgetés.** Visszaút: az előző SHA kézi telepítése, `.env.bak` visszamásolása, `php artisan migrate:rollback --step=<n>` csak ha biztosan szükséges (az új migrációk additívak, a régi kód valószínűleg fut az új sémán).

## 7. Push utáni ellenőrzés (az első 30 percben)

- [ ] `curl -s -H "X-Health-Token: <token>" https://<domain>/api/v1/health/ready` — minden sor `ok` (`scheduler`, `queue_worker`, `backup`, Judge0 sor).
- [ ] Regisztráció meghívókód nélkül **elutasítva**; meghívókóddal sikeres; a megerősítő levél megérkezik és nem a spamben.
- [ ] Admin: meghívókód létrehozása, várólista oldal megnyílik, "Mintamegoldás" fül látszik.
- [ ] Ingyenes lecke megnyílik, egy feladat futtatása (`/run`) és beadása működik, a Judge0 ténylegesen fut.
- [ ] `php artisan catalog:verify` (valódi Judge0-n) zöld, vagy a hibák ismertek.
- [ ] Egy szándékosan kiváltott 5xx (pl. admin végpont rossz paraméterrel nem jó; inkább `php artisan tinker` -> `OperatorAlert::raise`) levelet küld az `ALERT_EMAIL` címre.
- [ ] Külső uptime figyelő beállítva a `/api/v1/health` végpontra (`docs/runbooks/uptime-monitor.md`), dead-man's-switch ping a schedulerből.
- [ ] 24 óra múlva: `storage/logs/client-*.log` és az 5xx összefoglaló átnézése.

## Ismert nyitott kérdések

- A `--strict` ellenőrzés a Barion/Számlázz kulcsok hiányát **blokkolónak** veszi-e a béta alatt (számlázás halasztva)? A `ProductionConfigAudit` a kulcsokat `required`-ként jelöli, de `blocking` nélkül; a `DEPLOY_STRICT_CONFIG=true` ezeket is hibává teheti. Első deploy előtt futtasd a szerveren a `--strict`-et és nézd meg a kimenetet.
- A `submissions` tábla mérete az éles adatbázisban (migráció ideje).
- A Judge0 és az alkalmazás ugyanazon a gépen fut-e (kapacitás, `ropa.md`).
