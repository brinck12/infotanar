# InfoTanár

Online felkészítő a magyar közép- és emelt szintű **digitális kultúra érettségire**.
A diák leckéket és videós magyarázatokat kap, a programozási feladatokat a
böngészőben oldja meg, a megoldását pedig a szerver elszigetelt környezetben
lefuttatja és automatikusan kiértékeli. Az első leckék ingyenesek, a többi havi
előfizetéssel érhető el.

| Dokumentum | Miről szól |
|---|---|
| [docs/architecture.md](docs/architecture.md) | felépítés, kódfuttatás, hozzáférési szabályok, számlázási folyamat |
| [docs/api-endpoints.md](docs/api-endpoints.md) | minden API végpont (generált) |
| [docs/runbooks/go-live.md](docs/runbooks/go-live.md) | élesítési ellenőrzőlista |
| [docs/runbooks/incidents.md](docs/runbooks/incidents.md) | teendők üzemzavar esetén |
| [docs/runbooks/backup-restore.md](docs/runbooks/backup-restore.md) | mentés és visszaállítás |
| [docs/adr/](docs/adr) | döntések: fizetés (Barion), számlázás (Számlázz.hu), hibakövetés |
| [tests/README.md](tests/README.md) | a tesztkeretrendszer |

## Stack

| Réteg | Technológia |
|---|---|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS 4, TanStack Query, Monaco Editor |
| Backend | PHP 8.3 + Laravel 12 (csak API), Sanctum tokenes hitelesítés |
| Adatbázis | MySQL 8 (éles), SQLite (fejlesztés és helyi teszt) |
| Háttérfeladatok | Laravel queue (adatbázis-sor) és scheduler |
| Kódfuttatás | Judge0 CE (saját hosztolás) |
| Fizetés, számlázás | Barion (ismétlődő kártyás fizetés), Számlázz.hu (Számla Agent) |
| Tesztek | Playwright (E2E mockolt API-val, API tesztek valódi backenddel) |
| CI/CD | GitHub Actions → SSH deploy |

## Mappák

```
infotanar/
├── backend/             Laravel API
│   ├── app/Actions/         egy használati eset = egy osztály
│   ├── app/Http/            vékony controllerek, FormRequestek, Resource-ok
│   ├── app/Services/        integrációk: Judge0, Barion, Számlázz.hu, kódszabály-elemzők
│   ├── app/Jobs/            sorban futó és ütemezett feladatok
│   ├── lang/hu/             minden felhasználónak szóló szöveg
│   └── routes/              api.php (végpontok), console.php (ütemezés)
├── frontend/            React alkalmazás
│   ├── src/app/             keret: útvonalak, fejléc, lábléc, szolgáltatók
│   ├── src/features/        funkciónként egy mappa (auth, workspace, billing, admin, …)
│   └── src/shared/          közös API-kliens, UI-elemek, beállítások
├── tests/               Playwright tesztek (E2E és API)
├── deploy/              nginx konfiguráció, systemd unitok, mentőszkript
├── docs/                architektúra, runbookok, ADR-ek
└── .github/workflows/   ci.yml, deploy.yml
```

## Helyi fejlesztés

### Előfeltételek

- **PHP 8.3** a `mbstring`, `pdo_sqlite`, `sqlite3`, `curl`, `zip`, `fileinfo`, `intl` kiterjesztésekkel
- **Composer 2**
- **Node.js 22** + npm
- **Python 3** a `python3` (vagy a `CONSTRAINTS_PYTHON_BINARY`-ban megadott) néven: a
  kódszabály-elemző használja. Nélküle a feladatok megkötései (pl. „ne használd a
  `sum`-ot”) csendben nem érvényesülnek.
- SSH-hozzáférés a szerverhez, ha valódi kódfuttatás kell (Judge0-tunnel)

Docker nem kell.

### Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed          # SQLite adatbázis és a mintatananyag
php artisan serve                   # http://127.0.0.1:8000
```

Külön terminálban a háttérfeladatok. E-mail, számlakiállítás és a Barion
visszajelzés feldolgozása sorból megy, nélküle ezek nem történnek meg:

```bash
php artisan queue:work              # sorban álló feladatok
php artisan schedule:work           # ütemezett feladatok (megújítás, pótlások)
```

A levelek alapból a naplóba kerülnek (`MAIL_MAILER=log`, `storage/logs`).

Az első admin:

```bash
php artisan user:role <e-mail> admin
```

A tesztkeretrendszer felépítése és konvenciói: [tests/README.md](tests/README.md).

---

## API

Minden végpont a `/api/v1` prefix alatt.

| Metódus | Útvonal | Leírás |
|---|---|---|
| `GET` | `/health` | `{ "ok": true }` — deploy smoke checkhez |
| `GET` | `/topics` | Témakörök, publikált feladatszámmal |
| `GET` | `/tasks?topic=&level=` | Publikált feladatok listája (leírás nélkül) |
| `GET` | `/tasks/{id}` | Feladat teljes leírással, starter_code-dal és a **nem rejtett** tesztesetekkel |
| `POST` | `/run` | Futtatás csak a nem rejtett teszteseteken, nem mentődik |
| `POST` | `/submissions` | Futtatás **minden** teszteseten, submission mentésével |

A `/run` és a `/submissions` közös rate limit alatt áll (`throttle:execution`),
mert a kódfuttatás drága művelet. A keret bejelentkezve **fiókonként** számít, így
egy közös IP mögött ülő osztály tagjai nem egymás elől fogyasztják el:

| Ki | Kulcs | Alapérték | Beállítás (`backend/.env`) |
|---|---|---|---|
| Vendég | IP-cím | 10 / perc | `JUDGE0_RATE_GUEST_PER_MINUTE` |
| Bejelentkezett | fiók | 20 / perc | `JUDGE0_RATE_USER_PER_MINUTE` |
| Előfizető, admin | fiók | 40 / perc | `JUDGE0_RATE_PREMIUM_PER_MINUTE` |
| Bejelentkezett (napi) | fiók | 1000 / nap | `JUDGE0_RATE_USER_PER_DAY` |
| Mindenki együtt | – | 300 / perc | `JUDGE0_RATE_GLOBAL_PER_MINUTE` |

A saját keret túllépése `429`, a közös kereté `503` (nem a kérő hibája, a futtató
telt meg). Mindkét válasz törzse megmondja, mennyit kell várni:

```json
{ "message": "Túl sok futtatás rövid idő alatt. Próbáld újra 42 másodperc múlva.",
  "reason": "rate_limited", "retry_after": 42, "guest": false }
```

A `reason` értéke `rate_limited`, `daily_limit` vagy `busy`; a `guest` csak a
`rate_limited` válaszban szerepel. A `Retry-After` fejléc is megy.

### A kódfuttatás szabályai

- A frontend **soha nem hívja közvetlenül a Judge0-t**. Minden futtatás a Laravel
  backenden megy át (`Judge0Service`): így a Judge0 URL és token nem kerül a kliensbe,
  és az elvárt kimenet összevetése is szerveroldalon történik.
- Az összevetést a `TaskEvaluator` végzi, nem a Judge0 `expected_output` mezője.
  A sorvégi whitespace-t és a záró üres sorokat normalizáljuk.
- **Rejtett teszteseteknél a válasz csak PASS/FAIL**, kimenet nélkül — különben a
  rejtett bemenetek visszafejthetők lennének.
- A nyelvek Judge0 ID-ját futásidőben a `/languages` végpontról oldjuk fel
  (`config/judge0.php` `match` mezője alapján), nem hardcode-oljuk. Ha a `/languages`
  nem elérhető, a `fallback_id` lép életbe.
- Limitek minden kérésben: alapból `cpu_time_limit: 2` (mp), `memory_limit: 128000` (KB),
  `max_processes_and_or_threads: 60`. Az idő- és memóriakorlát feladatonként
  felüldefiniálható az admin felületen (100–10 000 ms, 16 000–512 000 KB); az idő
  nyelvenként szorozható (`JUDGE0_TIME_FACTOR_CSHARP`). A feloldás sorrendje:
  feladat saját értéke → globális alapérték, majd × nyelvi szorzó, legfeljebb a
  Judge0 példány maximuma (`JUDGE0_MAX_*`). A diák a feladat oldalán látja az
  érvényes korlátot (`GET /tasks/{id}` → `limits`).
- Ha a Judge0 elérhetetlen, a válasz `status: "error"` érthető magyar üzenettel,
  nem 500-as stacktrace.

---

## Deploy

A deploy **kizárólag a GitHub Actions pipeline-on keresztül** történik. Kézzel ne
másolj kódot a szerverre, és ne futtass ott migrációt.

### Folyamat

1. Push a `main` ágra → lefut a **CI** (`ci.yml`).
2. Ha a CI sikeres, elindul a **Deploy** (`deploy.yml`), ami:
   - buildeli a frontendet (`VITE_API_URL=/api/v1`),
   - `composer install --no-dev --optimize-autoloader` a backendre,
   - `rsync`-kel feltölti a `frontend/dist/`-et és a `backend/`-et
     (a `.env`, `storage/`, `node_modules/`, `tests/` kihagyásával),
   - a szerveren lefuttatja: `migrate --force`, `db:seed-once`, `config:cache`, `route:cache`,
   - újratölti a php-fpm-et,
   - smoke checket futtat a `/api/v1/health` végpontra.

A deploy kézzel is indítható: Actions → Deploy → Run workflow.

A Judge0 a szerveren **csak localhoston** érhető el. Helyi fejlesztéshez tunnelt
kell nyitni egy külön terminálban, majd a `.env`-ben megadni a tokent:

```bash
ssh -N -L 2358:localhost:2358 <user>@<szerver>
```

```ini
JUDGE0_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=<token>
```

Tunnel nélkül az oldal működik, csak a „Futtatás” és a „Beadás” ad érthető
hibaüzenetet.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env                # VITE_API_URL=http://127.0.0.1:8000/api/v1
npm run dev                         # http://localhost:5173
```

A böngészőből csak a `CORS_ALLOWED_ORIGINS`-ban felsorolt címek hívhatják az
API-t (alapból `http://localhost:5173` és `http://127.0.0.1:5173`).

### Fizetés helyben

A fizetéshez Barion **teszt** POSKey kell (`BARION_ENVIRONMENT=test`,
`BARION_POS_KEY`, `BARION_PAYEE`), a számlához Számlázz.hu teszt Agent-kulcs
(`SZAMLAZZ_AGENT_KEY`). Nélkülük az előfizetés indítása érthető hibát ad, a
többi funkció működik.

## Ellenőrzések és tesztek

```bash
# Backend: kódstílus és statikus analízis
cd backend
composer lint                       # Pint
composer analyse                    # Larastan
php artisan docs:endpoints          # a végpontlista frissítése útvonal-változás után

# Frontend
cd frontend
npm run lint
npm run typecheck
npm run build

# Tesztek
cd tests
npm run check                       # típusellenőrzés + ESLint
npm test                            # minden
npm run test:e2e                    # böngészős tesztek mockolt API-val (nem kell PHP)
npm run test:api                    # API tesztek valódi backenddel és ál-Judge0-val
```

A CI ugyanezeket futtatja, továbbá MySQL 8-on is lefuttatja a migrációkat
(oda-vissza) és az API teszteket, kipróbálja a mentést és a visszaállítást, és
betölti az nginx referencia-konfigurációt.

## Deploy

A deploy **kizárólag a GitHub Actions pipeline-on keresztül** történik. Kézzel ne
másolj kódot a szerverre, és ne futtass ott migrációt.

1. Push a `main` ágra → lefut a **CI**.
2. Ha sikeres, elindul a **Deploy**:
   - buildeli a frontendet, telepíti a backend éles függőségeit;
   - `rsync`-kel feltölti őket (a `.env` és a `storage/` érintetlen marad);
   - a szerveren: konfiguráció-ellenőrzés (`app:check-config`), mentés a migráció
     előtt (`db:snapshot-before-migrate`), `migrate --force`, cache-ek, a queue
     worker újraindítása, php-fpm újratöltés;
   - állapot-ellenőrzés a nyilvános címen.

Kézzel is indítható: Actions → Deploy → Run workflow.

### GitHub beállítások

| Név | Típus | Mire való |
|---|---|---|
| `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH` | secret | SSH-elérés; nélkülük a deploy érthető hibával leáll |
| `DEPLOY_URL` | secret | `https://<domain>`: az állapot-ellenőrzés címe. Nélküle figyelmeztetéssel, HTTP-n fut |
| `HEALTH_TOKEN` | secret | a részletes állapot-ellenőrzéshez (ugyanaz, mint a szerver `.env`-jében). Nélküle csak azt nézzük, válaszol-e a PHP |
| `DEPLOY_STRICT_CONFIG` | változó | `true` esetén a hiányos éles konfiguráció megállítja a deployt. **Élesítéskor bekapcsolandó** |
| `BARION_PIXEL_ID`, `BARION_PIXEL_REQUIRES_CONSENT` | változó | Barion Pixel (ADR 0001) |

### Mintaadatok

A deploy a `php artisan db:seed-once` parancsot futtatja: csak akkor tölti be a
mintatananyagot, ha még egyetlen feladat sincs. A később szerkesztett tartalmat
nem írja felül.

## A szerver beállítása

Egyszeri, kézi lépések; sorrendben a [go-live runbook](docs/runbooks/go-live.md)
vezet végig rajtuk. Röviden:

- **Csomagok:** nginx, PHP 8.3 + php-fpm (`mysql`, `mbstring`, `curl`, `zip`, `xml`,
  `intl`), MySQL 8, Python 3, Judge0 (csak localhoston), certbot, rclone.
- **Adatbázis:**
  ```sql
  CREATE DATABASE infotanar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'infotanar'@'localhost' IDENTIFIED BY '<jelszó>';
  GRANT ALL PRIVILEGES ON infotanar.* TO 'infotanar'@'localhost';
  ```
- **`.env`:** kézzel készül a `/var/www/infotanar/backend/.env` helyen; a szükséges
  kulcsok a [`backend/.env.example`](backend/.env.example) „Éles környezet”
  részében vannak. Ellenőrzés: `php artisan app:check-config --strict`.
- **Jogosultságok:**
  ```bash
  chown -R <deploy_user>:www-data /var/www/infotanar
  chmod -R 775 /var/www/infotanar/backend/storage /var/www/infotanar/backend/bootstrap/cache
  ```
  A deploy usernek jelszó nélkül kell tudnia újratölteni a php-fpm-et
  (`/etc/sudoers.d/deploy`):
  ```
  <deploy_user> ALL=(root) NOPASSWD: /usr/bin/systemctl reload php8.3-fpm
  ```
- **nginx és HTTPS:** [`deploy/nginx/infotanar.conf`](deploy/nginx/infotanar.conf)
  és a hozzá tartozó [fejléc-részlet](deploy/nginx/snippets/infotanar-security-headers.conf);
  a telepítés lépései a fájl elején.
- **Háttérfolyamatok:** `deploy/systemd/infotanar-queue.service` és
  `infotanar-scheduler.service`. Nélkülük nincs e-mail, számla és megújítás.
- **Mentés:** `deploy/systemd/infotanar-backup.timer`, lásd a
  [mentési runbookot](docs/runbooks/backup-restore.md).
