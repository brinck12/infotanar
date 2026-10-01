# InfoTanár.hu

Felkészítő webalkalmazás a magyar közép- és emelt szintű **digitális kultúra érettségire**.
A felhasználó kiválaszt egy programozási feladatot, megírja a megoldást a beépített
kódszerkesztőben, lefuttatja, és automatikus kiértékelést kap.

> Prototípus. A részletes tervet lásd: [PLAN.md](PLAN.md)

## Stack

| Réteg | Technológia |
|---|---|
| Frontend | React + TypeScript, Vite, Tailwind CSS, Axios, Monaco Editor |
| Backend | PHP 8.3 + Laravel 12 (API-only) |
| Adatbázis | MySQL 8 (éles), SQLite (fejlesztés és teszt) |
| Kódfuttatás | Judge0 CE (saját hosztolás) |
| E2E teszt | Playwright |
| CI/CD | GitHub Actions → SSH deploy |

## Mappastruktúra

```
infotanar/
├── frontend/            # React + Vite app
│   ├── src/api/         # Axios kliens, végpont-wrapperek
│   ├── src/components/  # CodeEditor, TaskCard, ResultPanel
│   ├── src/pages/       # Home, TaskList, TaskSolve
│   ├── src/types/       # Megosztott TS típusok
│   └── e2e/             # Playwright tesztek (mockolt API)
├── backend/             # Laravel 12 API
│   ├── app/Services/    # Judge0Service, TaskEvaluator
│   ├── app/Http/        # Controllerek (Api/V1), RunCodeRequest
│   ├── config/judge0.php
│   └── database/        # migrációk, seederek
└── .github/workflows/   # ci.yml, deploy.yml
```

---

## Lokális fejlesztés

### Előfeltételek

- **PHP 8.3** a `mbstring`, `pdo_sqlite`, `sqlite3`, `curl`, `zip`, `fileinfo`, `intl` kiterjesztésekkel
- **Composer 2**
- **Node.js 22** + npm
- SSH-hozzáférés a szerverhez (a Judge0 tunnelhez)

Docker nem kell.

### 1. Judge0 SSH-tunnel

A Judge0 a szerveren **csak localhoston** érhető el, kifelé nincs kinyitva. Lokális
fejlesztésnél tunnelt kell nyitni, és azt nyitva hagyni egy külön terminálban:

```bash
ssh -N -L 2358:localhost:2358 <user>@<szerver>
```

Ellenőrzés:

```bash
curl -H "X-Auth-Token: <token>" http://localhost:2358/about
```

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# A .env-ben állítsd be a Judge0 tokent:
#   JUDGE0_URL=http://localhost:2358
#   JUDGE0_AUTH_TOKEN=<token>

php artisan migrate --seed          # SQLite + 5 mintafeladat betöltése
php artisan serve                   # http://127.0.0.1:8000
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env                # VITE_API_URL=http://127.0.0.1:8000/api/v1
npm run dev                         # http://localhost:5173
```

---

## Tesztek

```bash
# Frontend: lint, típusellenőrzés
cd frontend
npm run lint
npx tsc --noEmit

# Playwright: E2E (mockolt API) és API tesztek (valódi backend + hamis Judge0)
cd tests
npm run check      # típusellenőrzés + ESLint
npm test           # minden projekt
npm run test:e2e   # csak E2E (nem kell PHP)
npm run test:api   # csak API
npm run test:smoke # csak @smoke
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
| `GET` | `/tasks/{id}/hints` | **Bejelentkezés kell.** A feladat tippjeinek száma és a már megnyitottak szövege |
| `POST` | `/tasks/{id}/hints/reveal` | A következő tipp megnyitása (a szerver választja, rögzíti); nincs több tipp: 422 |
| `GET` | `/tasks/{id}/solution` | A mintamegoldás állapota: `locked` / `revealable` / `unlocked`; a megoldás csak `unlocked`-nál van a válaszban |
| `POST` | `/tasks/{id}/solution/reveal` | „Megnézem a megoldást”: `revealable` állapotban rögzíti a megnyitást és kiadja a megoldást; `locked`: 403 |
| `POST` | `/run` | Futtatás csak a nem rejtett teszteseteken, nem mentődik |
| `POST` | `/submissions` | Futtatás **minden** teszteseten, submission mentésével |

A `/run` és a `/submissions` **IP-nként 10 kérés / perc** rate limit alatt áll
(`throttle:10,1`), mert a kódfuttatás drága művelet.

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
- Limitek minden kérésben: `cpu_time_limit: 2`, `memory_limit: 128000`,
  `max_processes_and_or_threads: 60`.
- **Tippek és mintamegoldás** (csak bejelentkezve, a feladat hozzáférési szabályával): a szerver
  dönt, a kliens csak megjeleníti. A tippek egyenként nyílnak, a megnyitás rögzül. A megoldás
  elfogadott beadás után látszik; előtte `SOLUTION_UNLOCK_AFTER_FAILED_SUBMISSIONS` (alapból 5)
  sikertelen beadás után kifejezett megerősítéssel nyitható meg. Ez rögzül, és az utána készült
  beadások `assisted` jelölést kapnak (a lecke így is teljesül). A `GET /tasks/{id}` csak a
  `hint_count`-ot és a `solution_available`-t adja, szöveget soha.
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

### Mintaadatok — egyszeri seed

A deploy a `php artisan db:seed-once` parancsot futtatja, nem a sima `db:seed`-et.
Ez **csak akkor tölti be a mintafeladatokat, ha még egyetlen feladat sincs** az
adatbázisban. Így az első deploy feltölti a tartalmat, a további deployok viszont
nem írják felül a később szerkesztett feladatokat.

Ha szándékosan újra akarod tölteni a mintaadatokat, a szerveren:

```bash
cd /var/www/infotanar/backend && php artisan db:seed --force
```

### Szükséges GitHub Secrets

| Secret | Példa |
|---|---|
| `DEPLOY_HOST` | a szerver IP-je vagy domainje |
| `DEPLOY_USER` | SSH felhasználó (deploy-only user javasolt) |
| `DEPLOY_SSH_KEY` | a deploy user privát kulcsa (teljes tartalom) |
| `DEPLOY_PATH` | `/var/www/infotanar` |

Ha bármelyik hiányzik, a workflow érthető hibaüzenettel áll le, nem kriptikus
SSH-hibával.

---

## Szerveroldali előfeltételek

Ezeket **egyszer, kézzel** kell beállítani a szerveren — a pipeline nem automatizálja.

### 1. Csomagok

- nginx
- PHP 8.3 + php-fpm + `php8.3-mysql`, `php8.3-mbstring`, `php8.3-curl`, `php8.3-zip`, `php8.3-xml`
- MySQL 8
- Judge0 (`http://localhost:2358`, csak localhoston)

### 2. Adatbázis

```sql
CREATE DATABASE infotanar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'infotanar'@'localhost' IDENTIFIED BY '<jelszó>';
GRANT ALL PRIVILEGES ON infotanar.* TO 'infotanar'@'localhost';
FLUSH PRIVILEGES;
```

### 3. `.env` a szerveren

A `/var/www/infotanar/backend/.env` fájlt **kézzel** kell létrehozni; a deploy
szándékosan nem írja felül. Minimum:

```ini
APP_NAME=InfoTanar
APP_ENV=production
APP_KEY=base64:...        # php artisan key:generate --show
APP_DEBUG=false
APP_URL=https://<domain>

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=infotanar
DB_USERNAME=infotanar
DB_PASSWORD=<jelszó>

JUDGE0_URL=http://localhost:2358
JUDGE0_AUTH_TOKEN=<token>
```

### 4. Jogosultságok

```bash
chown -R <deploy_user>:www-data /var/www/infotanar
chmod -R 775 /var/www/infotanar/backend/storage /var/www/infotanar/backend/bootstrap/cache
```

A deploy usernek jelszó nélkül kell tudnia újratölteni a php-fpm-et
(`/etc/sudoers.d/deploy`):

```
<deploy_user> ALL=(root) NOPASSWD: /usr/bin/systemctl reload php8.3-fpm
```

### 5. nginx

```nginx
server {
    listen 80;
    server_name <domain>;

    # Frontend: statikus fájlok, SPA fallback
    root /var/www/infotanar/frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend: Laravel
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ ^/index\.php$ {
        root /var/www/infotanar/backend/public;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME /var/www/infotanar/backend/public/index.php;
    }

    location ~ /\. { deny all; }
}
```
