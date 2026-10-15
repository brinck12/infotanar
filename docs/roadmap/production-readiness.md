# InfoTanár.hu: éles üzemi készültség (kiegészítés a `product-review.md`-hez)

Készült: 2026-10-14. A `product-review.md` a terméket nézte (diák szemmel, böngészős végigkattintással). Ez a dokumentum a **működtetést, adatvédelmet, indítást és kiadás-minőséget** nézi, négy kódaudit alapján (OPS, PRIV, LAUNCH, REL). Itt csak az szerepel, ami a `product-review.md`-ben és a `docs/runbooks/go-live.md`-ben **még nem** volt. A kettő együtt a teljes terv.

A számlázás (Barion, Számlázz.hu) továbbra is későbbre halasztva. A fázisok számozása a `product-review.md` 5. fejezetét követi, itt a **0a fázis** új.

Jelölések: **blokkoló** = nélküle nem indulhat a zárt béta; **fontos** = a béta alatt/végéig; **később** = nyitás után. Erőforrás: S (egy nap alatt), M (2-4 nap), L (hét). "Ellenőrizendő" = az ügynök következtetése, nem látta a kódban.

---

## Állapot (2026-10-15)

Az `fullstack/backend-platform` ágon elkészült és összefésülve (a teljes kapu zöld: API + rate-limit + e2e-mocked 431 teszt):
- **Kapacitás:** OPS-4 párhuzamossági korlát és `deploy/judge0/`, fpm pool, readiness sorhossz; L07 üzenet.
- **Láthatóság:** OPS-3 5xx riasztás, kliens-hiba napi összefoglaló, OPS-12 systemd keményítés, `check-config` bővítés (PRIV-5), mail márka (InfoTanár), nevesített limiterek (B02).
- **Zárt béta:** LAUNCH-2 meghívókódok, várólista, admin oldal, `register` limiter (B03).
- **Tartalom-kapu:** LAUNCH-3 `catalog:verify`, közzétételi őrök, `sample_solutions`, admin "Mintamegoldás" fül, seedelt megoldások.
- **Megbízhatóság:** B01, B07, B10/B11, B04, B09, S01, PRIV-3, PRIV-4, PRIV-10 (audit események, jelszócsere-értesítő), frontend F01-F04, F06-F08, F10-F12, CH4-CH6, PRIV-7.
- **Tesztek:** REL-1 (SQLite-on), REL-3, REL-5, REL-9, REL-10, PRIV-9 (`docs/privacy/ropa.md`).

**Kész, de még nincs a `main`-ben:** a deploy-ág (`fullstack/ops-deploy-releases`: OPS-1, OPS-2, OPS-5, REL-7, REL-15) szándékosan nincs összefésülve, amíg a szerveren el nem készül az egyszeri átállás (`docs/runbooks/release-layout.md`) és a GitHub `production` Environment + `DEPLOY_KNOWN_HOSTS` secret.

**Nyitva a 0a/0 fázisból:** OPS-9 (Redis tényleges üzembe állítása a szerveren), OPS-11 (külső uptime figyelő beállítása), F05 szerkesztő-sáv, F08 "fut egy próbálkozásod" sáv, F13 (méret-hiba sorrend, backend), F10 cellaszerkesztés a cellában, F11 mobil visszajelzés; MySQL-en a REL-1 versenytesztek még nem futottak.

---

## 1. Döntések (megerősítve)

| Téma | Döntés |
|---|---|
| Indítási modell | **Zárt béta**, osztályonként. Nyilvános regisztráció csak akkor, ha a tartalom, a jogi szöveg és a 0. fázis kész. |
| Dokumentumok nyelve | Magyar. A beszélgetés angol. |
| Redis | **Igen**, cache, queue és session. |
| Hibafigyelés | Először **e-mail riasztás minden 5xx-re** + kliens-hibák napi összefoglalója. **Sentry később** (új adatfeldolgozó, előbb a jogász lássa a listát). |
| Staging | **Később**, a számlázás élesítése előtt. A bétához a kiadás-könyvtáras visszagörgetés elég. |
| Tanári szerepkör | **Közvetlenül a béta után** (LAUNCH-8). |
| Uptime figyelő | Igen, külső, ingyenes. |

---

## 2. Fázisok (módosított sorrend)

```
0a  Élesítési kapuk (új)        blokkolók: deploy, kapacitás, tartalom-ellenőrzés, hibafigyelés, zárt béta
0   Megbízhatóság               a product-review 5. fejezete + B01 az élre + versenyhelyzetek
1   Első benyomás               + SEO, Monaco saját tárhelyről, időzóna, böngésző-mátrix
2   Tanár eszközei              + tartalom-import (Markdown/YAML) és catalog:verify
3   Tartalom                    változatlan, de a 2. fázis csővezetékén át
4   Elköteleződés               + tanári szerep, levelek, elemzés
5   Nyitás                      + életkor-kapu, DSR, staging, mentés-erősítés, számlázás
```

---

## 3. 0a fázis: élesítési kapuk (új, blokkolók)

### 3.1 Deploy biztonság

**OPS-1 Nem atomi, visszagörgethetetlen deploy** (blokkoló, M)
- Bizonyíték: `.github/workflows/deploy.yml:107-109, 118-126` `rsync -az --delete` az éles könyvtárba; `:159` `migrate --force`; `:185-215` a hibás füstpróba csak `exit 1`-et ad, semmit nem állít vissza.
- Hatás: az rsync alatt a kód félig új; a `--delete` kitörli a régi hash-elt chunkokat, miközben a megnyitott lapok a régi `index.html`-t tartják; a `routes.tsx`-ben nincs chunk-betöltési hiba kezelő.
- Javítás: `releases/<sha>` könyvtárba deploy, a közös `.env` és `storage` symlink, `config:cache` + `migrate` az új kiadásban, majd a `current` symlink átállítása és php-fpm reload. Utolsó 3 kiadás megmarad, visszagörgető szkript átállítja a symlinket. A régi `assets/` néhány napig marad. `vite:preloadError` kezelő újratölti a lapot. Az nginx `root` és a systemd egységek a `current/`-re mutatnak.

**OPS-2 Nincs expand/contract szabály, nincs karbantartási mód migráláskor** (blokkoló, S/M)
- Bizonyíték: `deploy.yml:155-159` éles forgalom alatt migrál. A CI csak azt nézi, hogy a rollback működik (`ci.yml:194-196, 240-247`), azt nem, hogy a régi kód megy az új sémán.
- Javítás: szabály a `CLAUDE.md`-be és a runbookba: **előbb additív migráció, a romboló a következő kiadásban**. Rövid `php artisan down --retry=60` csak nagy táblát átíró migrációk köré (JSON 503 az `/api`-ra). CI lépés: az előző kiadás API-tesztjei az új sémán.

**OPS-5 SSH host kulcs első használatkor megbízott** (fontos, S)
- Bizonyíték: `deploy.yml:90` minden futáskor `ssh-keyscan`; `:174` `sudo -n systemctl reload php8.3-fpm`; `:9` `workflow_dispatch`.
- Javítás: `DEPLOY_KNOWN_HOSTS` secret, csak deployra való felhasználó korlátozott sudoers-szel és kényszerített paranccsal, GitHub `production` Environment kötelező jóváhagyóval.

**REL-7 Visszagörgetés** (blokkoló, S): ugyanaz, mint OPS-1; a füstpróba (REL-15) bukásakor automatikus symlink-visszaállítás.

**REL-15 Éles füstpróba** (fontos, S): a readiness curl után 5 csak-olvasó ellenőrzés: katalógus, egy ingyenes lecke, belépés egy dedikált monitor-fiókkal, egy triviális Python-program `POST /run`-ja a valódi Judge0-n, egy aláírt videó-URL. Ugyanezt az uptime-figyelő is használja.

### 3.2 Kapacitás vizsgaidőben

**OPS-4 Szinkron futtatás php-fpm-en, méretezetlen Judge0** (blokkoló, M/L)
- Bizonyíték (ellenőrizve): `Judge0Service.php:61` blokkoló `POST /submissions?wait=true`, a határidő 45 s (`config/judge0.php:27`); minden futás egy php-fpm workert tart, akár 45 másodpercig. Az nginx `fastcgi_read_timeout 60s` (`infotanar.conf:100`). A globális limit (`judge0.php:54`, 300/perc, `ExecutionRateLimit.php:42`) kérést számol percenként, nem párhuzamosságot, a Judge0 workereket nem védi. A repóban sehol nincs Judge0 vagy php-fpm pool konfig.
- Következtetés (ellenőrizendő): egy osztálynyi egyidejű futás kimeríti a fpm poolt, és leáll az egész oldal, a belépés és a vizsga-feltöltés is.
- Javítás:
  1. `deploy/judge0/` (docker compose + `judge0.conf`: `COUNT`, `MAX_QUEUE_SIZE`, `NUMBER_OF_RUNS`, `ENABLE_NETWORK=false`, korlátok, `127.0.0.1`-re kötve) és `deploy/php-fpm/pool.conf` a repóba.
  2. Külön nginx location és fpm pool a `/run` és `/submissions` útvonalaknak.
  3. A percenkénti globális limit helyett **párhuzamossági korlát** (`Cache::lock` / Redis szemafor), gyors 503 `busy` válasszal; a frontend barátságos üzenettel kezeli.
  4. A Judge0 `/statistics` sorhossza kerüljön a readiness ellenőrzésbe.
  5. Terhelésteszt (REL-8) a valódi számokkal.

**OPS-9 Adatbázis-alapú cache, queue, session, limiter** (fontos, M, **döntve: Redis**)
- Bizonyíték: `config/cache.php:18` és `.env.example:50` `CACHE_STORE=database`; `QUEUE_CONNECTION=database`, `SESSION_DRIVER=database`. A nevesített limiterek (`AppServiceProvider.php:149`), a `RateLimiter`, az `OperatorAlert` dedupe (`:51`) és a Judge0 archív cache mind ezt használja. A queue `--sleep=3`.
- Hatás (ellenőrizendő): 200 egyidejű diáknál minden futás több MySQL cache-írást csinál (`cache_locks`, upsert verseny); a deadlock/lock wait `/run` 500-ként jelenik meg.
- Javítás: Redis a `CACHE_STORE`, `QUEUE_CONNECTION`, `SESSION_DRIVER` alá (`php-redis` már a `config/database.php`-ban); az éles `.env` blokkba felvenni; a mentési runbookba a Redis (queue tartalom). B02 (nevesített limiterek) ezzel együtt.

### 3.3 Láthatóság

**OPS-3 Szerver 500-ak nincsenek riasztva** (blokkoló, S/M)
- Bizonyíték: `bootstrap/app.php:35-70` nincs `reportable` hook; a `composer.json` és `package.json` nem tartalmaz Sentryt, Flare-t, Bugsnagot. Az `OperatorAlert` (`app/Support/Alerts/OperatorAlert.php:24-40`) csak sikertelen jobokra és számlázásra megy. A kliens-hibák a `client` log csatornába mennek (`ClientErrorController.php`), amit senki nem olvas (go-live.md: "az első napokban átnézni").
- Javítás (döntve): `reportable` hook, ami 5xx-re `OperatorAlert::raise`-t hív, deduplikálva; napi összefoglaló a `client` logból. Sentry később.

**OPS-11 Nincs uptime figyelő, a riasztási út nem független** (fontos, S)
- Bizonyíték: a readiness végpont megvan (`routes/api.php:53`, 30/perc, `X-Health-Token`), de semmi nincs beállítva. Az `OperatorAlert` ugyanazon az alkalmazáson és levelezésen megy, amit figyel; a dedupe ablak 60 perc (`config/alerts.php:61`).
- Javítás: külső figyelő (UptimeRobot vagy Healthchecks.io) a publikus `/api/v1/health`-re, plusz token-es `/ready`. Dead-man's-switch ping a scheduler `health-heartbeat`-jéből (`routes/console.php`), hogy a leállt scheduler kívülről is látszódjon. Opcionális második csatorna (Telegram/Slack) kritikus riasztásra.

**OPS-12 Queue és scheduler felügyelet** (fontos, S)
- Bizonyíték: `infotanar-queue.service:14-20`: `Restart=always`, de nincs `StartLimitBurst`, `WatchdogSec`, `OnFailure=`, `MemoryMax`, `TimeoutStopSec`; a queue `--max-time=3600`, de nincs `--max-jobs`, `--memory`.
- Javítás: `OnFailure=infotanar-alert@%n.service`, `--memory=256`, `--max-jobs=500`, `TimeoutStopSec=120`, hogy a `queue:restart` ne vágjon félbe egy számlázási jobot.

### 3.4 Tartalom-ellenőrzés és zárt béta

**LAUNCH-3 Nincs tartalom-ellenőrző kapu** (blokkoló, M)
- Bizonyíték: nincs parancs, ami egy feladat mintamegoldását a saját tesztjein futtatná (a `Console/` és a `CatalogSeeder` átnézve); az A-16 csak egy UI-gomb.
- Hatás: egy hibás elvárt kimenet a diákot rosszra tanítja, és nem különböztethető meg a diák hibájától.
- Javítás: `php artisan catalog:verify`, a közzétett feladatok mintamegoldását valódi Judge0-n a `SolutionEvaluator`-ral lefuttatja, és bármilyen nem-átment esetnél hibával áll le. Mintamegoldás nélküli feladat nem tehető közzé. Nightly és kiadás előtt fut.

**LAUNCH-2 Nincs regisztrációs kapu** (blokkoló, S/M)
- Bizonyíték: invite/beta/waitlist/regisztrációs kapcsoló sem a konfigban, sem az `Actions/Auth`-ban nincs.
- Javítás: `REGISTRATION_MODE=open|invite`, meghívókódok (vagy e-mail engedélylista), várólista oldal. Osztályonkénti bevezetés. A meghívókód a `RegisterRequest`-ben ellenőrzött, a használat naplózott.

### 3.5 Adatvédelmi mechanika (jogász nélkül megoldható)

- **PRIV-5 Naplók és levelek PII-t tartalmaznak, debug az alapértelmezés** (blokkoló, S): a `.env.example` `LOG_LEVEL=debug` és `MAIL_MAILER=log`; a log mailerrel a megerősítő és jelszó-visszaállító levelek tokenes linkjei a `storage/logs`-ba kerülnek. A `ClientErrorController.php:22-30` `user_id`-t, user agentet, URL-t, stacket ír; a kliens által küldött `url`/`message` tartalmazhat tokeneket a query stringben. Javítás: az `app:check-config` bukjon `MAIL_MAILER=log/array` és `LOG_LEVEL=debug` esetén éles módban; az URL query stringjét és fragmensét le kell vágni, az üzenetet és a stacket rövidíteni; a `client` csatorna megőrzése legfeljebb 14 nap. (Ez a S02 bővítése.)
- **PRIV-7 localStorage-kulcsok** (fontos, S): `usePersistentState.ts`, `drafts.ts`, `oral/practice.ts`, `lastTask.ts`, `preferences.ts`. A szóbeli önértékelés személyes adat, kijelentkezés után az eszközön marad (ellenőrizendő). Javítás: kulcslista célokkal és lejárattal az adatkezelési tájékoztató 4. pontjába; minden felhasználóhoz kötött kulcs törlése kijelentkezéskor és fióktörléskor.
- **PRIV-9 Adatfeldolgozók nincsenek rögzítve** (fontos, S mérnöki oldalról): új `docs/privacy/ropa.md` (GDPR 30. cikk): soronként feldolgozó, cél, adatkategória, hely, DPA állapot, átviteli mechanizmus. A rendszer-tények kitölthetők most (hosting, SMTP, off-site mentés cél `BACKUP_REMOTE`, Judge0 host: ellenőrizendő, hogy ugyanaz a szerver-e), a szerződéseket a jogász.
- **PRIV-8 Barion Pixel** (fontos, S): a számlázás halasztva, ezért **nincs Pixel-azonosító az indulásnál** (a kérdés nem merül fel). Ha mégis lesz, `VITE_BARION_PIXEL_REQUIRES_CONSENT=true` az alapértelmezés.

---

## 4. 0. fázis: kiegészítések

- **B01 előre**: a megoldott állapot nem eshet vissza (megőrzés és 365 napos job). Hibás "megoldva" állapot a diák szemében adatvesztés.
- **REL-1 Versenyhelyzetek MySQL-en** (blokkoló, M): kb. 30 helyen van `lockForUpdate` (`SyncPaymentState.php:57`, `ChargeRenewal.php:96`, `StartExamAttempt.php:57`, `SubmitExamAttempt.php:35`, `ChangeUserRole.php:29`), SQLite-on ez no-op, és az `api` projekt `workers: 1`. Új `@concurrency` spec, ~10 eset `Promise.all`-lal: dupla webhook, dupla vizsga-beadás, dupla vizsga-indítás (pontosan egy futó kísérlet), dupla előfizetés, utolsó admin szerepváltás. Csak a `backend-mysql` jobban fut, `retries: 0`.
- **REL-5 SQLite és MySQL eltérések** (fontos, S): a `users.email` egyedi index MySQL-en kis-/nagybetű-érzéketlen, SQLite-on nem (`RegisterRequest.php:20`); törölt-majd-újraregisztrált cím; raw SQL (`ExamController.php:91`, `ExerciseAttempts.php:34, 40`); ~12 JSON oszlop; enum. Célzott esetek: kisbetű/nagybetű e-mail, törölt cím újraregisztrálása, ékezetes slug, vizsga `result` JSON körút, hosszú szöveg, időzónás időbélyeg.
- **REL-6 Migráció az előző kiadás adataival** (fontos, M): a CI csak üres adatbázison migrál, és a visszaállítási próba csak sorszámot hasonlít. Anonimizált előző-kiadás dump + az új migrációk; csak a `->change()`-es vagy adat-átíró migrációknál.
- **PRIV-3 A törlés nem teljes** (blokkoló a valódi felhasználók előtt, M; a megőrzési döntés jogászi):
  - `DeleteAccount.php:41` soft delete; a `consents` sorok `ip_address` és `user_agent` mezői és az `audit_logs.ip_address`/`metadata` érintetlenek; az `AccessGrant.reason` (szabad szöveg, 500 karakter, `GrantAccessRequest.php:17`) nevezhet személyt; a `submissions.source_code` marad `user_id = null`-nal, de a kód szabad szöveg (név, osztály).
  - Mentések (`backup-restore.md:11`): 7 napi + 4 heti + 12 havi másolat, tehát egy törölt felhasználó akár 12 hónapig megmarad, és nincs "törlések újraalkalmazása visszaállítás után" lépés.
  - Javítás: a `DeleteAccount` nullázza a `consents` IP/UA mezőit és az `audit_logs.ip_address`-t, a szabad szöveges `reason`/`metadata` helyére jelölő kerül; a `submissions.source_code` törlése (alapértelmezés, jogászi megerősítéssel); runbook lépés: PII-mentes `deleted_user_ids` napló a mentéseken kívül, és újrafuttatás minden visszaállítás után; a mentési megőrzés szerepeljen a tájékoztatóban; a purge listenerek legyenek sorba állítottak és idempotensek (B05).
- **PRIV-4 Nincs megőrzési korlát IP, user agent és audit adatra** (blokkoló, S/M; az időszakokat a jogász adja): `audit_logs.ip_address` (migráció `2026_09_29_200100`), `consents.ip_address`/`user_agent` (`2026_10_01_110000`), `RecordAuditEvent.php:26`; a `routes/console.php`-ban nincs `audit_logs`/`consents` törlő job. Javítás: `audit:prune` (kb. 90 nap után az IP nullázása, N év után törlés/aggregálás); a consents IP-jét /24 vagy /48-ra csonkolni.
- **PRIV-10 Hitelesítés fiatal közönségnek** (fontos, M): jelszó `Password::min(8)->letters()->numbers()` (`AppServiceProvider.php:87`) `uncompromised()` nélkül; Sanctum token 30 nap (`sanctum.php:53`), eszköz-lista nélkül (ellenőrizendő); a "már regisztráltak" üzenet felfedi a fiókot (`RegisterRequest.php:20`, `validation.php:61`; B13); admin 2FA nincs. Javítás: `->uncompromised()` élesben; jelszócsere-értesítő levél (F04); semleges "nézd meg a leveled" válasz; admin TOTP, vagy legalább újra-hitelesítés az admin PII végpontokon (S04); admin token 7-14 nap csúszó megújítással. A 2FA M-L, a béta után is mehet, ha az admin köre 1-2 ember.
- **PRIV-11 Admin látja a kiskorúak adatát** (fontos, S/M): az admin lista és számlanézet nevet és e-mailt mutat; az audit napló csak módosítást rögzít, a megtekintést és exportot nem (ellenőrizendő). Javítás: "admin megtekintett/exportált egy felhasználót" audit esemény PII nélküli metaadattal.
- **PRIV-16 Adatminimalizálás** (később, S): a név szabad szöveg; elég egy becenév vagy keresztnév.

---

## 5. 1. fázis: kiegészítések

- **LAUNCH-1 Nincs SEO felület** (blokkoló a nyitáshoz, a zárt bétához nem; S meta, M prerender): a `frontend/index.html`-ben csak charset, viewport és egy statikus cím; nincs meta description, `og:*`, canonical, `robots.txt`, `sitemap.xml` (a `frontend/public` csak `favicon.svg` és `icons.svg`). Az nginx `try_files ... /index.html` (`deploy/nginx/infotanar.conf:75`) minden ismeretlen URL-re 200-at ad (soft 404). Javítás: statikus meta + OG kép, `robots.txt`, artisan paranccsal generált sitemap (közzétett ágak és leckék), oldalankénti cím és leírás, `noindex` a `/fiok`, `/admin`, `/vizsga` alatt; az indexelhető oldalaknak (főoldal, ágak, ingyenes leckék, jogi) build-idejű prerender vagy kis szerveroldali meta-beszúrás; igazi 404 státusz.
- **LAUNCH-6 Külső CDN és adatvédelem** (fontos, S): a CSP report-only fejléc engedi a `cdn.jsdelivr.net`-et script, style és font alá (Monaco loader alapértelmezés) és a `pixel.barion.com`-ot. Kiskorúaknál az IP harmadik félhez jut hozzájárulás nélkül, és iskolai Wi-Fin a CDN-szűrés futásidejű hibát okoz. Javítás: Monaco saját tárhelyről (`loader.config({paths})` az `/assets`-ből), jsdelivr ki a CSP-ből, utána a CSP Report-Only → enforcing (S03). A P1-gyel együtt.
- **LAUNCH-12 Időzóna** (fontos, S/M): `backend/config/app.php` időzónája `UTC` (a számlázás használja csak az `Europe/Budapest`-et). A vizsga visszaszámláló, a sorozat napjai, a napi cél és a levelek időbélyege éjfél körül eltér a magyar felhasználóknál; B15 csak egy helyet érint. Szabály: UTC-ben tárolni, a "nap" fogalmát Europe/Budapest szerint számolni, a frontend `Intl` `hu-HU` és ugyanez az időzóna.
- **LAUNCH-11 Böngésző-mátrix és mobil teljesítménykeret** (fontos, S/M): a tsconfig target `es2023`, nincs `browserslist` vagy Vite `build.target`, nincs csomagméret-kapu a CI-ben. Javítás: támogatott böngészők (utolsó 2 verzió, iOS 15+), `build.target`, `size-limit` CI kapu (kezdeti JS kb. 200 KB gzip alatt, Monaco csak lusta betöltéssel), próba 4x CPU lassítással és Slow 4G-vel.
- **LAUNCH-10 Telepíthetőség telefonon** (fontos, S): nincs manifest, service worker, `vite-plugin-pwa`, ikon vagy `apple-touch-icon`. Elég egy web manifest + ikonok + `theme-color`; service worker nem kell; barátságos "nincs hálózat" állapot a SPA héjban.
- **LAUNCH-13 Állapot- és karbantartási oldal** (fontos, S): nincs nginx `error_page 502 503` magyar oldal; az API leállásakor a SPA nyers hibát mutat. Javítás: statikus magyar 502/503 oldal, `php artisan down --retry` a deployban (OPS-2), külső uptime figyelő (OPS-11).
- **OPS-13 nginx keményítés** (fontos, S): a fejlécek csak az nginxben vannak, és az `/api` location csak a `~ ^/index\.php$`-n át adja vissza őket (`infotanar.conf:83-86`); nincs `server_tokens off`, `limit_req_zone`/`limit_conn` (csak alkalmazás-limitek, amik az adatbázist érik), OCSP stapling, cipher lista, fail2ban, ufw dokumentáció. CORS rendben (`config/cors.php`, kifejezett origin-ek, `supports_credentials=false`, és éles módban a SPA same-origin). Javítás: `server_tokens off`, `limit_req` kb. 10 r/s IP-nként burst-tel az `/api` előtt, `limit_conn`, fail2ban a `/api/v1/login` 401 és 429 mintáira, ufw alap (csak 22, 80, 443; a 2358 és 3306 zárva).
- **OPS-8 Naplók forgatása és méretei** (fontos, S): a Laravel `daily` driver 14 napig tart (`config/logging.php:68-83`), de nincs logrotate az nginx naplókra és a journalra. Javítás: `deploy/logrotate/infotanar`, journald `SystemMaxUse`, éles `LOG_LEVEL=warning`, a feltöltési könyvtárak mérete a readiness lemez-ellenőrzésbe (a `DiskSpaceCheck` csak 10% és 3% szabad helyet néz).

---

## 6. 2. fázis: kiegészítések (tartalom-csővezeték)

**LAUNCH-4 Tartalom csak admin-űrlapon** (fontos, M-L; a legnagyobb hatású a tartalom-szűk keresztmetszetre)
- Bizonyíték: a `CatalogSeeder.php` fixen kódolt PHP (5 feladat); nincs import/export útvonal az `api.php`-ban (csak fiók-export).
- Javítás: feladatonként egy Markdown vagy YAML fájl a repóban (leírás, korlátok, tesztesetek, mintamegoldás, tippek); `catalog:import --dry-run` (slug szerint idempotens) és `catalog:export`. A tartalom így gitben él, átnézhető, és ez táplálja a `catalog:verify`-t (LAUNCH-3). A 2. fázis A-19 (import/export, duplikálás) ezt valósítja meg, az űrlap marad a finomhangolásra.

---

## 7. 4. fázis: kiegészítések

- **LAUNCH-8 Tanári szerep és osztályok** (fontos, L; **közvetlenül a béta után**): a szerepkörök csak `student|admin` (`SetUserRole`, `api.php`), nincs csoport, osztálykód, feladat vagy tanári haladásnézet. Minimum: `teacher` szerep, osztály belépőkóddal, csak-olvasó haladás-tábla osztályonként (feladatonként megoldva, utolsó aktivitás). Feladatkiosztás és szülői nézet később.
- **LAUNCH-9 Tranzakciós levelek** (fontos, M): a `Notifications/` csak megerősítést, jelszó-visszaállítást, e-mail-cserét és előfizetés-értesítőt tartalmaz. Kell: üdvözlő levél és első lépés, megerősítés-emlékeztető, jelszócsere-értesítő, opt-in heti összefoglaló leiratkozási linkkel (kézbesíthetőséghez és GDPR-hoz kötelező); az `OperatorAlert` kössön a visszapattanásokhoz.
- **LAUNCH-7 Adatvédelmi szempontból barátságos elemzés** (fontos, S-M): nincs analitika vagy tölcsér (a `backend/app` és `frontend/src` átnézve). Saját üzemeltetésű Plausible/Umami (sütimentes, nem kell hozzá bannerek), vagy szerveroldali első-fél események. **Öt tölcsér-lépés előre definiálva**: regisztráció, megerősítés, első futtatás, első sikeres megoldás, második napi visszatérés.
- **LAUNCH-5 Vizsgaidőszakok** (fontos, S + M kapacitás): a dátumok fixen kódoltak (`preferences.ts` 2027-05/2027-10/2028-05; `env.ts` alapértelmezett vizsgadátum `2027-05-10`; `LearningPath.tsx` "2024-2026 május" szöveg). Legyen egy `exam_periods` konfig/tábla (írásbeli és szóbeli dátum az OH közléséből), a következő időszak automatikus kiválasztása, ebből a visszaszámláló. A tényleges csúcsra (március-május, szeptember-október) kapacitásterv, és **deploy-stop a vizsgahetekben**.
- **LAUNCH-15 Játékosítás etikája kiskorúaknál** (később, S szabály, M funkció): sorozat csak bűntudatkeltő értesítés nélkül; sorozat-fagyasztás vagy heti cél keretezés; értesítés opt-in a megfelelő pillanatban; csendes órák. Meghívó/ajánló link ("hívd meg az osztálytársad") csak a béta és a kiskorúak jogi rendezése után.
- **LAUNCH-14 Akadálymentességi nyilatkozat** (később, M): axe CI a kulcsoldalakon (REL-11), rövid nyilatkozat a jogi oldalakon, billentyűzet- és egy képernyőolvasós próba a számlázás élesítése előtt (az EU akadálymentességi irányelv a fizetős szolgáltatásokat érinti).

---

## 8. 5. fázis: kiegészítések (nyitás)

- **PRIV-1 Életkor-kapu és szülői hozzájárulás** (blokkoló kiskorúaknál, M-L; a küszöböt és a szabályt a jogász adja, a mechanikát mi építjük):
  - Bizonyíték: a `RegisterRequest.php` és `RegisterUser.php:19-33` csak nevet, e-mailt, jelszót és a feltételek/adatkezelés verzióját gyűjti; nincs életkor-mező vagy életkor-szöveg a `backend/app`, `lang` vagy `frontend` alatt; az `adatkezeles.md:51-53` a 6. pont `[KITÖLTENDŐ]`.
  - Javítás: kötelező "születési év vagy korcsoport (14 alatt / 14-15 / 16+)" mező a felhasználónál (adatminimalizálás: év, nem teljes dátum); `ConsentType::Parental` és `users.parental_status` (none/pending/confirmed); ha a jogász küszöböt ad meg (Magyarországon az információs társadalmi szolgáltatásoknál gyakran 16 év), szülői e-mail folyamat aláírt linkkel, a szülő megerősítése IP-vel és időbélyeggel rögzítve; megerősítésig korlátozott fiók (nincs számlázás, nincs nyilvános adat); a nem megerősített fiókot 7-14 nap után törli egy job. A korcsoport kerüljön az exportba és a törlésbe is. A küszöb konfigurálható, hogy a jogászi döntés ne igényeljen kódcserét.
- **PRIV-2 Az adatkezelési tájékoztató helykitöltős** (blokkoló, S mérnöki oldalról, aztán jogász): az `adatkezeles.md` 13-18. sorában a jogalap és megőrzés `[KITÖLTENDŐ]`; a 7. (adatkezelő), 30-33. (hosting, levelező, átvitel), 43., 49., 51-57. (jogok, kiskorúak, panasz) sor is üres. Mérnöki oldalról most kitölthető: a meglévő megőrzések (365 nap fájlok és vizsgák, 24 óra lejárt tokenek, 14 nap napló, 720 óra sikertelen jobok), az audit napló IP-je, a Judge0 mint feldolgozó. Jogalap, adatkezelő, átvitel a jogásznak.
- **PRIV-6 Érintetti jogok kezelése csak önkiszolgáló** (fontos, M): nincs kérelem-bejelentő csatorna, nincs napló vagy határidő, nincs korlátozás/tiltakozás, nincs admin eszköz a felhasználó nevében való törléshez; az `ExportAccountData` kihagyja az `audit_logs` bejegyzéseket, a `consents.ip_address`/`user_agent`-et és a leendő születési évet, tehát a hozzáférési jog (15. cikk) csak részben teljesül; az export jelszó-megerősítés nélküli (ellenőrizendő). Javítás: kapcsolati cím vagy űrlap adatkérésre, "DSR kezelés" runbook oldal az egy hónapos határidővel és személyazonosság-ellenőrzéssel, az export bővítése, jelszó megkövetelése exporthoz és törléshez, admin törlési művelet az érintett nevében.
- **PRIV-12 Gyermekbarát nyelv** (fontos, S): 5 soros "mit tárolunk és miért" összefoglaló a jogi szöveg fölött és a regisztrációs űrlapon, a valós megőrzési számokkal; egy 15 évessel kipróbálva. A magyar szövegezést jogász nézi át, a szerkezet most is elkészülhet. A szülői e-mail (PRIV-1) legyen egyszerű és nem technikai.
- **OPS-6 Staging** (fontos, M, **később, a számlázás előtt**): második DEPLOY_* secret készlet és workflow job `workflow_dispatch`-ra vagy `staging` ágra, `BARION_ENVIRONMENT=test`, `MAIL_MAILER` levélfogóra, `X-Robots-Tag: noindex` és basic auth.
- **OPS-7 Mentés-erősítés** (fontos, M):
  - Ellenőrizve: `deploy/backup/infotanar-backup.sh` naponta egy `mysqldump` (02:30, `infotanar-backup.timer`), nincs binlog/PITR, tehát az RPO akár ~26 óra, és minden azóta történt fizetés veszélyben van.
  - A `.env` és az `APP_KEY` nincs mentve (szkript 110-120. sor csak számlák, videók, feladatfájlok). Az `APP_KEY` elvesztése a titkosított oszlopokat és az aláírt linkeket olvashatatlanná teszi, a szerver `.env` pedig kézzel kezelt.
  - A dump nincs ellenőrizve (nincs `gzip -t`, nincs sorszám-ellenőrzés); a systemd egységnek nincs `OnFailure=` riasztása (csak a readiness `backup` kora szól 36 óra után, `config/health.php:44`, ami külső lekérdezőt igényel, lásd OPS-11).
  - A `backup-restore.md:153` táblázata szerint "valódi próba még nem volt", az RTO mérhetetlen.
  - A szkript (71-88. sor) `delete`-et használ, tehát az `rclone` jogosultság egy zsarolóvírus esetén a `db/daily`-t is törölheti.
  - Javítás: binlog 7 napos megőrzéssel és `mysqlbinlog` szállítással (vagy menedzselt MySQL PITR-rel); a `.env` titkosított mentése; `gzip -t` a dump után; `OnFailure=` egység, ami levelet küld az `ALERT_EMAIL`-re; időmért visszaállítási próba és RTO cél; off-site immutable (restic-szerű) tár.
- **OPS-15 Migráció előtti pillanatkép csak helyi** (később, S): a `SnapshotBeforeMigrate.php` helyi tárba ír, 3 darabot tart; kockázatos migráció előtt az off-site mentés fusson, vagy a pillanatkép kerüljön ki.
- **OPS-16 Konfiguráció-eltérés nem észlelhető** (később, S): az `.env` titkosított másolata jelszókezelőben vagy SOPS-szal; az `app:check-config` vesse össze a kulcsokat az `.env.example`-lel (a `config:cache` hiányzó kulcsnál csendben hibázik).
- **OPS-14 Lassú lekérdezések** (később, S): nincs `DB::listen`, `DB::whenQueryingForLongerThan` vagy MySQL slow log; a `submissions` táblán egyetlen index van `(task_id, created_at)` plusz az FK-k (`2026_09_26_160300_create_submissions_table.php:22`). A MySQL `slow_query_log` (`long_query_time=0.5`) és `EXPLAIN` a `/progress`, az admin áttekintő és a beadás-előzmény lekérdezésein a terhelésteszt után.

---

## 9. Kiadás-minőség és tesztterv módosítások

A `tests/testplan.md` célja **kb. 905 esetről kb. 560-ra** csökken (a kihagyott tesztek többsége olyan UI-állapot, amit a mockolt réteg vagy a kézi ellenőrzés már lefed).

**Javítások a `testplan.md`-hez:**
- Az A14 (API-tesztek MySQL-en) **már megvan**: a `backend-mysql` job a `ci.yml`-ben migrál, visszagörget, újramigrál, seedel, mentés-visszaállítási próbát és pre-migrate snapshot ellenőrzést futtat, majd a teljes API-készletet MySQL 8-on.
- A `tests/playwright.config.ts` "új" `e2e-full` projektet említ, de **nincs ilyen projekt**: csak `e2e-mocked`, `api`, `api-rate-limit`.
- A `deploy.yml` már futtat éles readiness-ellenőrzést (`/api/v1/health/ready`, 10 újrapróba), de nincs visszagörgetés.

**Új és módosított tételek:**
- **REL-2 A pénzfolyamat tesztjei** (magas érték, M): a számlázás, webhook, ütemezett jobok és a számlakezelő 0 tesztet tartalmaz; kell egy Barion és egy Számlázz stub forgatókönyv-vezérelt kimenetekkel (a `*_BASE_URL` felülírások a konfigban megvannak). Mivel a számlázás halasztva, ez a bétán kívül esik, **de a stubok építése a számlázás indulása előtti első lépés**.
- **REL-3 API-frontend szerződés-ellenőrzés** (magas érték, S): a TS típusok kézzel szinkronizáltak, az `e2e-mocked` mindent mockol, tehát a drift nem bukik. Kb. 25 kulcsválaszra (me, plans, subscription, lessons, exercise, run, submission, exam attempt, admin overview) zod séma az `api` projektben, amit az e2e mockok is ugyanazon fixture-ökből használnak. Alternatíva: OpenAPI generálás (Scramble/Dedoc) és `openapi-typescript` diff a CI-ben (kb. 1 nap, M).
- **REL-4 Valódi Judge0 próba** (magas érték, M): a mock (`tests/src/mocks/judge0/server.ts`, 154 sor) fix `time:'0.01'`, `memory:3000`, státusz 3, `stderr`/`compile_output` null; nincs valódi falióra-viselkedés, sor, sandbox-korlát, sqlite3 CLI sajátosság, nyelv-azonosító lista. Kb. 12 aranyeset kézi `workflow_dispatch` jobbal vagy szkripttel az SSH-alagúton: Python OK, rossz válasz, futásidejű hiba, TLE, C# fordítási hiba, SQL OK, SQL hiba. Minden kiadás előtt és éjjel is. A mockba TLE, 5xx és lassú válasz mód a 45 s határidő lefedéséhez.
- **REL-8 Terhelésteszt** (közepes, M; előbb a REL-4): k6, **stagingen vagy a bétán kívüli időben, nem élesen**. Forgatókönyvek: vizsgacsúcs (300 diák 60 másodperc alatt belép, ugyanazt a vizsgát indítja, 1 perc alatt 300 VU); automentés és lekérdezés (VU-nként 10 s-os GET 10 percig, egyszer egy 200 KB-os fájl); `/run` (60 VU, 15 s-onként egy kérés 5 percig, cél: p95 8 s alatt, 0% 5xx; Judge0 telítődésnél 429 vagy `system_error`, soha 500; a 45 s-os határidő a 60 s-os Axios időtúllépés alatt marad); katalógus-olvasás (200 req/s 2 percig, p95 300 ms alatt). Küszöbök: hibaarány 1% alatt, nincs 2 percnél hosszabb sorfelhalmozódás (a `/health/ready` figyeli).
- **REL-9 Biztonsági automatizálás CI-ben** (közepes, S): nincs `composer audit`, `npm audit` vagy dependabot (csak `CODEOWNERS` van a `.github`-ban). `composer audit` és `npm audit --omit=dev --audit-level=high` CI lépés, `.github/dependabot.yml` (composer, npm, actions), GitHub secret scanning és push protection (OPS-10 ugyanez). Az A1 jogosultsági mátrix a megfelelő OWASP A01 lefedés; plusz ~10 negatív eset (tömeges értékadás: `role` mező regisztrációnál/profilmódosításnál, CORS, token lejárat).
- **REL-10 Végpont-lefedettség sorok helyett** (közepes, S): minden CI job `coverage: none`; a teszt `ApiClient` naplózza a metódust és útvonalat, a futás végén összevetjük a `docs/api-endpoints.md`-vel, és hibával áll le, ha egy útvonalra nulla találat volt. Mutációs teszt kihagyva.
- **REL-11 Akadálymentesség automatizálva** (közepes, S): az `@axe-core/playwright` már devDependency; egy paraméterezett axe-vizsgálat kb. 14 útvonalon (főoldal, belépés, regisztráció, árak, lecke, feladat, munkaterület, vizsgafutó, fiók, 3 admin oldal, jogi, 404) asztali és egy mobil nézeten, kb. 15 eset.
- **REL-12 Vizuális regresszió** (alacsony): legfeljebb 6 `toHaveScreenshot` alap, csak a chromium CI futón; különben kihagyni.
- **REL-13 Instabil tesztek** (közepes, M): valós óra (`exams.spec.ts:399-400` a másodperc-határig polloz `Date.now()`-val; `learning.spec.ts:262`, `checks-slides-web.spec.ts:251-257` a valós időtől vagy időkerettől függ, `HOSTILE_BUDGET_MS` megosztott futón); az `api` `retries: 0` (szándékos), egy instabil teszt tehát a kiadási kaput bukja; a közös token és seed állapot egy soros készletben lavinát indíthat. Javítás: tesztóra artisan parancs (a `Carbon::setTestNow` beállítása és törlése fájl vagy cache kulcson át, csak `testing` környezetben), az alvások lecserélése, éjszakai `--repeat-each=3`.
- **REL-14 Sebesség** (alacsony, S): az `api` projekt 7 perc és soros; a MySQL job ugyanezt duplázza, összesen kb. 14 perc CI. Az SQLite `api` job csak ágakon, a MySQL a kapu a `main`-en; vagy az `api` szétválasztása csak-olvasó (párhuzamosítható) és író specekre. Nem érdemes tovább gyorsítani, amíg a készlet nem nő.

**Javasolt tesztcél:**

| Réteg | Terv | Új cél | Megjegyzés |
|---|---|---|---|
| API | 670 | ~560 | meglévő 295 + A1 150 (táblázatvezérelt, megtartva) + A2 25 (40-ből) + A3 12 + A4 12 + A6 15 + A7 8 + A8 12 + A9 8 + A10 6 + REL-1 10 + REL-5 6; A5, A11, A12, A13 külön nem |
| e2e-mocked | ~210 | ~100 | 47-ről; E1-10, E3-10, E4-10, E5-15, E7-10, E9-8, axe 15; E6, E8, E10, E12, E13 nem |
| e2e-full (új) | ~25 | ~8 | F1, egy F2, F3, F6, F9, egy F8 + REL-3 szerződés-ellenőrzés |
| Valódi Judge0 aranykészlet | – | 12 | kézi/éjszakai |

**Munkasorrend a teszteknél:** (1) pénzfolyam-stubok és tesztek (REL-2, számlázás előtt), (2) versenyhelyzetek (REL-1) és szerződés-ellenőrzés (REL-3), (3) valódi Judge0 (REL-4) és visszagörgetés (REL-7), (4) migráció adatokkal (REL-6), biztonsági automatizálás (REL-9), éles füstpróba (REL-15); a többi a nyitás utánra csúszhat.

---

## 10. Teljes követőlista (új és módosított tételek)

**0a fázis (zárt bétához kötelező)**
- [ ] OPS-1, REL-7 kiadás-könyvtáras deploy, visszagörgetés, `vite:preloadError`
- [ ] OPS-2 expand/contract szabály, karbantartási mód nagy migrációknál
- [ ] OPS-5 SSH host kulcs rögzítése, `production` Environment jóváhagyóval
- [ ] OPS-4 `deploy/judge0/`, fpm pool, külön `/run` pool, párhuzamossági korlát, readiness sorhossz
- [ ] OPS-9 Redis (cache, queue, session)
- [ ] OPS-3 5xx e-mail riasztás, kliens-hiba napi összefoglaló
- [ ] OPS-11 külső uptime figyelő, dead-man's-switch
- [ ] OPS-12 systemd `OnFailure=`, `--memory`, `--max-jobs`, `TimeoutStopSec`
- [ ] LAUNCH-3 `catalog:verify` és közzétételi tiltás mintamegoldás nélkül
- [ ] LAUNCH-2 `REGISTRATION_MODE=invite`, meghívókódok, várólista
- [ ] PRIV-5 `check-config` debug/log mailer, kliens-hiba URL tisztítás
- [ ] PRIV-7 localStorage kulcslista és törlés kijelentkezéskor/törléskor
- [ ] PRIV-9 `docs/privacy/ropa.md`
- [ ] REL-15 éles füstpróba

**0. fázis kiegészítések**
- [ ] B01 az élre
- [ ] REL-1 versenyhelyzet-tesztek MySQL-en
- [ ] REL-5 célzott SQLite/MySQL esetek
- [ ] REL-6 migráció előző kiadás adataival
- [ ] PRIV-3 teljes törlés (`consents`, `audit_logs`, `source_code`, törlési napló a mentésekhez)
- [ ] PRIV-4 `audit:prune` és IP csonkolás
- [ ] PRIV-10 `uncompromised()`, jelszócsere-értesítő, semleges regisztrációs válasz, admin újra-hitelesítés
- [ ] PRIV-11 admin megtekintés audit eseménye

**1. fázis kiegészítések**
- [ ] LAUNCH-1 meta, OG, robots, sitemap, `noindex`, valódi 404
- [ ] LAUNCH-6 Monaco saját tárhelyről, CSP enforcing
- [ ] LAUNCH-12 Europe/Budapest nap-szemantika
- [ ] LAUNCH-11 böngésző-mátrix, csomagméret-kapu
- [ ] LAUNCH-10 web manifest és ikonok
- [ ] LAUNCH-13 magyar 502/503 oldal
- [ ] OPS-13 nginx keményítés, fail2ban, ufw
- [ ] OPS-8 logrotate, journald, `LOG_LEVEL=warning`

**2. fázis kiegészítések**
- [ ] LAUNCH-4 Markdown/YAML import-export csővezeték

**4. fázis kiegészítések (béta után)**
- [ ] LAUNCH-8 tanári szerep és osztályok
- [ ] LAUNCH-9 üdvözlő levél, heti összefoglaló
- [ ] LAUNCH-7 elemzés, 5 tölcsér-lépés
- [ ] LAUNCH-5 `exam_periods`, deploy-stop a vizsgahetekben
- [ ] LAUNCH-15 játékosítási szabályok
- [ ] LAUNCH-14 akadálymentességi nyilatkozat

**5. fázis kiegészítések (nyitás)**
- [ ] PRIV-1 életkor-kapu és szülői hozzájárulás (konfigurálható küszöb)
- [ ] PRIV-2 tájékoztató mérnöki oldali kitöltése
- [ ] PRIV-6 DSR runbook, export bővítése, admin törlés
- [ ] PRIV-12 egyszerű összefoglaló
- [ ] OPS-6 staging
- [ ] OPS-7 mentés-erősítés (binlog, `.env`, `gzip -t`, `OnFailure=`, időmért próba, immutable tár)
- [ ] OPS-15, OPS-16, OPS-14
- [ ] REL-2 Barion és Számlázz stubok és tesztek (a számlázás előtt)
- [ ] REL-3 szerződés-ellenőrzés, REL-4 valódi Judge0 aranykészlet, REL-8 terhelésteszt
- [ ] REL-9 audit és dependabot, REL-10 végpont-lefedettség, REL-11 axe, REL-13 tesztóra

---

## 11. Jogász vagy te döntsd el

| Tétel | Mit |
|---|---|
| PRIV-1 | életkori küszöb és a szülői hozzájárulás szabálya |
| PRIV-2, PRIV-4 | jogalapok, megőrzési időszakok |
| PRIV-3 | megmaradhat-e a hozzájárulás-bizonyíték és az audit sor törlés után |
| PRIV-9 | átviteli szöveg, DPA-k (hosting, levelező, mentési tár) |
| PRIV-8 | Barion Pixel: számlázás előtt nincs, utána hozzájárulás-előbb |
| PRIV-10 | admin 2FA kötelező-e a béta alatt |
| Sentry | mikor kerüljön be mint új adatfeldolgozó |
| Staging | mikor (ajánlott: a számlázás előtt) |

Ellenőrizendő a környezetben, amit a repó nem mutat: a szerver tényleges php-fpm pool mérete, MySQL verzió és `my.cnf`, Judge0 beállítások, nginx logrotate, OS-javítások és `unattended-upgrades`, a `DEPLOY_STRICT_CONFIG` és `HEALTH_TOKEN` beállítottsága, a Judge0 host (ugyanaz a gép-e).
