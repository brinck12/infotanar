# InfoTanar.hu — Prototípus terv (Claude Code számára)

## Cél

Kezdetleges, de működő prototípus a magyar közép- és emelt szintű **digitális kultúra érettségire** felkészítő weboldalhoz. A prototípus fő funkciója: a felhasználó kiválaszt egy programozási feladatot, megírja a megoldást a beépített kódszerkesztőben, lefuttatja, és automatikus kiértékelést kap. A kód a `https://github.com/brinck12/infotanar` repóba kerül, GitHub Actions pipeline buildeli és tölti fel a bérelt szerverre.

## Stack (eldöntött, ne térj el tőle)

| Réteg | Technológia |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, Axios, Monaco Editor (`@monaco-editor/react`) |
| Backend | PHP 8.3 + Laravel 12 (API-only) |
| Adatbázis | MySQL 8 (már telepítve a szerveren) |
| Kódfuttatás | Judge0 CE (már telepítve a szerveren, saját hosztolás) |
| E2E teszt | Playwright |
| CI/CD | GitHub Actions → SSH deploy a szerverre |

## Repo struktúra (monorepo)

```
infotanar/
├── frontend/            # React + Vite app
│   ├── src/
│   │   ├── api/         # Axios kliens, végpont-wrapper függvények
│   │   ├── components/  # UI komponensek (CodeEditor, TaskCard, ResultPanel…)
│   │   ├── pages/       # Home, TaskList, TaskSolve
│   │   └── types/       # Megosztott TS típusok (Task, Submission, JudgeResult)
│   ├── e2e/             # Playwright tesztek
│   └── vite.config.ts
├── backend/             # Laravel 12 API
│   ├── app/
│   ├── database/migrations/
│   ├── database/seeders/
│   └── routes/api.php
├── .github/workflows/
│   ├── ci.yml           # lint + build + teszt minden pushra/PR-re
│   └── deploy.yml       # deploy main branch-ről a szerverre
├── PLAN.md              # ez a fájl
└── README.md
```

## MVP scope — CSAK ez kerüljön a prototípusba

1. **Feladatlista oldal**: feladatok listázása témakör és szint (közép/emelt) szerint szűrhetően.
2. **Feladatmegoldó oldal**: feladat leírása + Monaco szerkesztő + "Futtatás" és "Beadás" gomb + eredménypanel (stdout, hibák, teszteset-eredmények).
3. **Kódfuttatás Judge0-n keresztül**, backend proxyval (lásd lejjebb). Támogatott nyelvek induláskor: **Python 3** és **C#** (Judge0 language ID-k: Python 3.8.1 = 71, C# Mono = 51 — futáskor kérdezd le a `/languages` végpontról és configból vedd, ne hardcode-old).
4. **Automatikus kiértékelés**: feladatonként több teszteset (stdin → elvárt stdout), a beadás minden tesztesetet lefuttat, az eredmény tesztesetenként PASS/FAIL.
5. **Seed adat**: legalább 5 érettségi-jellegű programozási mintafeladat tesztesetekkel (pl. sorozatfeldolgozás tételek: összegzés, megszámlálás, maximum-kiválasztás, eldöntés — ezek a magyar érettségi tipikus feladatai).

**NEM része az MVP-nek** (ne implementáld, csak az adatmodell ne zárja ki): regisztráció/bejelentkezés, haladáskövetés, nem-programozós feladattípusok (táblázatkezelés, adatbázis), admin felület.

## Adatmodell (MySQL, Laravel migrációk)

```
topics
  id, name (pl. "Programozási tételek"), slug, timestamps

tasks
  id, topic_id (FK), title, description (markdown, longtext),
  level (enum: 'kozep','emelt'), difficulty (tinyint 1–5),
  allowed_languages (json, pl. ["python","csharp"]),
  starter_code (json: nyelvenkénti kiinduló kód, nullable),
  is_published (bool), timestamps

test_cases
  id, task_id (FK), stdin (text), expected_stdout (text),
  is_hidden (bool, default true), order (int), timestamps

submissions
  id, task_id (FK), language (string), source_code (longtext),
  status (enum: 'pending','running','passed','failed','error'),
  results (json: tesztesetenkénti eredmény), created_at
  -- user_id nullable FK, egyelőre nincs auth, de a mező legyen ott
```

## Backend API (Laravel, `routes/api.php`, prefix: `/api/v1`)

```
GET  /topics                    → témakörök listája
GET  /tasks?topic=&level=       → publikált feladatok (leírás nélkül, lista-nézethez)
GET  /tasks/{id}                → feladat teljes leírással + NEM rejtett tesztesetek + starter_code
POST /run                       → { task_id, language, source_code }
                                  → csak a NEM rejtett teszteseteken futtat, szinkron válasz
POST /submissions               → { task_id, language, source_code }
                                  → MINDEN teszteseten futtat, submission mentése, eredmény vissza
GET  /health                    → { ok: true } (deploy ellenőrzéshez)
```

Válaszformátum futtatásnál/beadásnál:

```json
{
  "status": "passed",
  "results": [
    { "test_case_id": 1, "hidden": false, "passed": true,
      "stdout": "42\n", "expected": "42\n", "stderr": "", "time": 0.021, "exit_code": 0 }
  ]
}
```

## Judge0 integráció — kötelező szabályok

- A frontend **SOHA nem hívja közvetlenül** a Judge0-t. Minden futtatás a Laravel backenden megy át (`Judge0Service` osztály), mert: a Judge0 URL/token nem kerülhet a kliensbe, és a backend végzi az elvárt output összevetését.
- Judge0 hívás: `POST {JUDGE0_URL}/submissions?base64_encoded=true&wait=true` — a prototípusban a `wait=true` szinkron mód elég; a source_code/stdin/expected_output mezőket base64-eld.
- Az összevetést a backend végezze (trailing whitespace/newline normalizálással), ne bízd a Judge0 `expected_output` mezőjére — így a hibaüzenet informatívabb lehet.
- Állíts be limiteket a Judge0 kérésben: `cpu_time_limit: 2`, `memory_limit: 128000`, `max_processes_and_or_threads: 60`.
- Rate limit a Laravel oldalon: `throttle:10,1` a `/run` és `/submissions` végpontokra (10 kérés/perc/IP).
- Config: `JUDGE0_URL` és opcionális `JUDGE0_AUTH_TOKEN` a `.env`-ből, `config/judge0.php`-n keresztül.
- Hibakezelés: ha a Judge0 nem elérhető vagy timeoutol, a válasz `status: "error"` legyen értelmes magyar hibaüzenettel, ne 500-as stacktrace.

## Frontend követelmények

- Vite + React + TS + Tailwind alap, React Router (3 route: `/`, `/feladatok`, `/feladatok/:id`).
- Monaco: nyelvválasztó a feladat `allowed_languages` mezője alapján; nyelvváltáskor töltse be a megfelelő `starter_code`-ot; sötét téma (`vs-dark`).
- Futtatás közben loading állapot, az eredménypanel tesztesetenként zöld/piros jelöléssel, stdout/stderr megjelenítéssel (rejtett teszteseteknél csak PASS/FAIL, output nélkül).
- Axios kliens egy helyen (`src/api/client.ts`), base URL env-ből (`VITE_API_URL`).
- A felület nyelve **magyar**.
- Minden API-válaszhoz legyen TS típus a `src/types/`-ban.

## Playwright (prototípus szint)

`frontend/e2e/` alatt legalább 3 teszt:
1. A feladatlista betöltődik és megjelenik legalább 1 feladat.
2. Feladatra kattintva megnyílik a megoldó oldal, látszik a Monaco és a leírás.
3. (API mockkal) helyes kód "futtatása" után zöld eredmény jelenik meg.

CI-ban a Playwright mockolt API ellen fusson (route interception), hogy ne kelljen élő backend + Judge0 a pipeline-hoz.

## GitHub Actions

### `ci.yml` — minden push + PR

1. **frontend job**: `npm ci` → `npm run lint` → `tsc --noEmit` → `npm run build` → Playwright tesztek (mockolt API).
2. **tests job**: Playwright E2E + API tesztek a `tests/` alól.

### `deploy.yml` — csak `main` branch push, a CI sikere után

1. Frontend build (`npm run build` → `frontend/dist`).
2. Backend előkészítés: `composer install --no-dev --optimize-autoloader`.
3. `rsync` SSH-n a szerverre:
   - `frontend/dist/` → `/var/www/infotanar/frontend/`
   - `backend/` → `/var/www/infotanar/backend/` (kizárva: `.env`, `storage/`, `node_modules`, `tests`)
4. Szerveren SSH-n keresztül: `php artisan migrate --force && php artisan config:cache && php artisan route:cache`, majd `php-fpm reload`.
5. Deploy után smoke check: `curl -f https://<szerver>/api/v1/health`.

### Szükséges GitHub Secrets (ezeket én állítom be, te csak hivatkozz rájuk)

```
DEPLOY_HOST        # szerver IP/domain
DEPLOY_USER        # SSH user
DEPLOY_SSH_KEY     # privát kulcs (deploy-only user javasolt)
DEPLOY_PATH        # /var/www/infotanar
```

A workflow-ban a secrets hiányára adj értelmes hibát, és a deploy legyen idempotens (kétszer futtatva se törjön el).

## Szerveroldali előfeltételek (dokumentáld a README-ben, ne automatizáld most)

- Nginx: `/` → frontend statikus fájlok, `/api` → php-fpm (Laravel `public/index.php`).
- PHP 8.3 + php-fpm + composer, MySQL 8 (kész), Judge0 (kész, pl. `http://localhost:2358`).
- `.env` a szerveren kézzel: DB kapcsolat, `JUDGE0_URL`, `APP_ENV=production`, `APP_KEY`.

## Hol dolgozz — kötelező szabály

- **Minden fejlesztés lokálisan történik**, a felhasználó gépén. A szerverre kód KIZÁRÓLAG a GitHub Actions deploy pipeline-on keresztül kerülhet.
- A szerverhez SSH-n **csak akkor nyúlj, ha muszáj**: logok olvasása, éles hiba debuggolása, egyszeri szerver-konfiguráció (nginx, `.env`). Soha ne fejlessz, ne szerkessz kódot és ne futtass migrációt kézzel a szerveren — a migráció a deploy pipeline dolga.
- Lokális futtatás: `php artisan serve` + `npm run dev`. Lokális adatbázisnak SQLite is elég fejlesztésre.
- Judge0-t NE telepíts lokálisan: a szerveren futó példányt érd el SSH-tunnelen — `ssh -L 2358:localhost:2358 <user>@<szerver>` —, a lokális `.env`-ben `JUDGE0_URL=http://localhost:2358`.

## Munkasorrend (ebben a sorrendben haladj, minden lépés után commit)

1. Repo skeleton: mappastruktúra, README, `.gitignore`-ok, ez a PLAN.md.
2. Backend: Laravel install, migrációk + modellek + seederek (5 mintafeladat tesztesetekkel).
3. Backend: `Judge0Service` + `/run`, `/submissions`, `/tasks`, `/topics`, `/health` végpontok + tesztek.
4. Frontend: Vite skeleton, routing, API kliens, típusok.
5. Frontend: feladatlista + feladatmegoldó oldal Monaco-val + eredménypanel.
6. Playwright tesztek.
7. `ci.yml`, majd `deploy.yml`.
8. README: lokális fejlesztés (frontend + backend indítása, seed), deploy leírás, szerver-előfeltételek.

## Általános elvárások

- Commit üzenetek angolul, conventional commits (`feat:`, `fix:`, `chore:`).
- A kód legyen egyszerű és olvasható — ez prototípus, ne vezess be felesleges absztrakciót (ne legyen repository pattern, CQRS, stb.).
- Minden felhasználónak látszó szöveg magyarul.
- Lokális fejlesztéshez elég `php artisan serve` + `npm run dev`, Docker NEM kell.

---

## Terv-modositasok (a megvalositas soran)

- **2026-09-26 — Laravel 11 → Laravel 12.** A terv eredetileg Laravel 11-et irt elo. A teljes
  11-es agat erinti a `PKSA-mdq4-51ck-6kdq` biztonsagi serulekenyseg (`>=11.0.0,<12.0.0`), es a
  11-es ag mar nem kap javitast (az utolso kiadas, a v11.56.1 is erintett), ezert a Composer
  blokkolja a telepiteset. A projekt Laravel 12-vel keszul (v12.69.2, serulekenysegtol mentes),
  ami a legkisebb elteres a tervtol — a 11 es 12 kozott gyakorlatilag nincs toro valtozas a
  terv altal erintett teruleteken.
- **2026-09-26 — React 18 → React 19.** A Vite `react-ts` sablonja a jelenlegi
  stabil React 19-et hozza. A terv altal erintett funkciok (Monaco, React Router,
  Axios) valtozatlanul mukodnek, ezert nem forsziroztuk vissza a 18-at.
- **2026-09-26 — Playwright webServer host.** A `vite preview` alapbol csak a
  `localhost`-ra kot, amit Windowson a Playwright `127.0.0.1` cime nem ert el.
  A `playwright.config.ts` ezert explicit `--host 127.0.0.1`-gyel indit.
