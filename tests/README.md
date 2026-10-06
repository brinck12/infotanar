# Tesztkeretrendszer (Playwright + TypeScript)

Egyetlen Playwright konfiguráció, típusos környezet, oldalobjektumok,
típusos API kliens és fixture-alapú függőségkezelés.

## Gyors indulás

```bash
cd tests
npm ci
npx playwright install chromium

npm run check      # tsc (strict) + ESLint (eslint-plugin-playwright)
npm test           # minden projekt
npm run test:e2e   # e2e-mocked: buildelt frontend, mockolt API (nem kell PHP)
npm run test:api   # api + api-rate-limit: valódi Laravel backend + Judge0 mock
npm run test:smoke # csak a @smoke tesztek
npm run test:a11y  # csak az @a11y (axe-core, WCAG 2.1 AA) tesztek
npm run test:ui    # Playwright UI mód
npm run report     # az utolsó HTML riport
```

Az API tesztekhez PHP 8.3+ és `composer install` kell a `backend/`
mappában; az E2E tesztekhez `npm ci` a `frontend/` mappában.

## Felépítés

```
tests/
├── playwright.config.ts      egyetlen konfiguráció, projektekkel
├── config/
│   ├── env.ts                zod-dal validált, típusos környezet
│   ├── environments/         <stage>.env alapértékek (local, ci, staging)
│   └── web-servers.ts        frontend / backend / Judge0 mock indítása
├── src/
│   ├── api/                  ApiClient + a backend szerződés típusai
│   ├── pages/                oldalobjektumok (BasePage, TaskListPage, TaskSolvePage)
│   │   └── components/       újrahasznosítható komponensek (MonacoEditor, ResultPanel)
│   ├── fixtures/             test.extend: pages, apiClient, mockApi, a11y (axe)
│   ├── mocks/                MockApi (route interception), Monaco CDN, Judge0 mock szerver
│   └── data/                 adatbuilderek és a seedelt fixture adatok leírása
└── specs/
    ├── e2e/                  böngészős tesztek
    └── api/                  HTTP tesztek
```

## Projektek

| Projekt | Mit tesztel | Szerverek |
|---|---|---|
| `e2e-mocked` | a buildelt frontendet, a backend route interceptionnel mockolva | frontend preview |
| `api` | a valódi backendet, sqlite fixture adatbázissal | Laravel + Judge0 mock |
| `api-rate-limit` | a rate limitet; az `api` után fut (`dependencies`), mert kimeríti a közös kvótát | Laravel + Judge0 mock |

A Playwright csak a kiválasztott projektekhez tartozó szervereket indítja
(`--project=...`), így az E2E futtatáshoz nem kell PHP.

## Környezet (TEST_ENV)

A `config/env.ts` a `TEST_ENV` alapján (`local` alapértelmezés, CI-ban
`ci`) betölti a `config/environments/<stage>.env` fájlt, és zod sémával
validálja. Elsőbbségi sorrend: valódi környezeti változó >
`<stage>.local.env` (gitignore-olt, személyes) > `<stage>.env`.

| Változó | Jelentés |
|---|---|
| `BASE_URL` | a frontend címe |
| `API_BASE_URL` | a backend `/api/v1/` gyökere (záró perjellel) |
| `START_WEB_SERVERS` | indítsa-e a Playwright a helyi szervereket |
| `JUDGE0_MOCK_PORT` | a Judge0 mock portja |
| `MONACO_SOURCE` | `local`: a Monaco a frontend `node_modules`-ából, CDN nélkül; `cdn`: jsDelivr |
| `API_DATABASE_URL` | opcionális; megadva az API tesztek backendje MySQL-en fut sqlite helyett |

Érvénytelen érték esetén a futás azonnal, érthető hibával leáll.

### API tesztek MySQL-en

Az éles adatbázis MySQL 8, a helyi futtatás alapból sqlite. A CI
`backend-mysql` jobja mindkét motoron lefuttatja az API teszteket; helyben
csak akkor kell, ha motorfüggő hibát keresel. Ehhez (és csak ehhez) Docker kell:

```bash
docker run --rm -d --name infotanar-mysql-test -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=infotanar_test mysql:8

API_DATABASE_URL=mysql://root:root@127.0.0.1:3306/infotanar_test npm run test:api

docker stop infotanar-mysql-test
```

A fixture-betöltés minden táblát eldob, ezért a backend csak `_test` végű
MySQL adatbázist fogad el, és csak `APP_ENV=testing` mellett.

## Konvenciók

- **Importálás:** a specek mindig a `src/fixtures`-ből importálják a
  `test`-et és az `expect`-et (ESLint kikényszeríti).
- **Oldalobjektumok:** lokátorokat és lépéseket adnak, elvárást nem; az
  `expect` a specben van. Lokátor: szerep, felirat vagy `data-testid`.
- **Tesztadat:** builderekkel (`aRunResponse().withResults(aTestResult().failing())`),
  a backend szerződés típusaira építve; a valódi backend seedelt adatait a
  `src/data/seed.ts` írja le (forrás: `backend/database/seeders/ApiTestSeeder.php`).
- **Mockolás:** a `mockApi` fixture az `e2e-mocked` projektben
  (`mockBackend: true`) automatikusan betölti az alap katalógust; egy teszt
  az `onRun`, `onSubmit`, `withCatalog` hívással felülírhatja.
- **Címkék:** `@smoke` a kritikus út (gyors, stagingen is futtatható),
  `@regression` minden más, `@a11y` az akadálymentességi ellenőrzés.
  Szűrés: `--grep @smoke`.
- **Akadálymentesség:** az `expectNoA11yViolations()` fixture az aktuális
  oldalt axe-core-ral ellenőrzi (WCAG 2.1 A/AA), a teljes jelentést a
  riporthoz csatolja. Szabályt kikapcsolni csak indoklással, a
  `disableRules` opcióval lehet; a Monaco szerkesztő ki van zárva.
- **Várakozás:** fix `waitForTimeout` tilos; web-first elvárásokat használunk
  (`await expect(locator).toBeVisible()`).

## Új teszt hozzáadása

1. Új oldal → `src/pages/<Nev>Page.ts` a `BasePage`-ből, majd fixture a
   `src/fixtures/index.ts`-ben.
2. Új végpont → típus a `src/api/types.ts`-be, metódus az `ApiClient`-be.
3. Spec a `specs/e2e` vagy `specs/api` alá, `@smoke`/`@regression` címkével.
