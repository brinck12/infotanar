# Tesztelési útmutató

Ez a dokumentum azt írja le, **hogyan és mikor** írunk teszteket ebben a repóban, és
felsorolja azokat a buktatókat, amikbe már belefutottunk — hogy másodszor senkinek
ne kelljen ugyanazt az órát elkölteni ugyanarra a hibára.

Ha egy PR nem tartalmazza a hozzá tartozó tesztet, az nincs kész — a teszt a
GitHub issue elfogadási kritériumainak (`Acceptance criteria`) a kódba fordítása,
nem utólagos ráadás.

---

## 1. Hol élnek a tesztek

```
tests/
  e2e/      Playwright, böngészőben, mockolt API ellen (route interception)
  api/      Playwright, valódi backend + sqlite fixture + hamis Judge0 ellen
  shared/   a fenti kettő közös infrastruktúrája (pl. judge0-mock.js)
```

Nincs PHPUnit / `backend/tests`. Ezt tudatosan szüntettük meg: a cél egyetlen,
konzisztens tesztelési réteg volt a HTTP határon, ahelyett hogy a backend logika
fele PHP-osztály-szinten, fele HTTP-n keresztül lenne lefedve.

**Ez alól van egy tudatos kivétel, amire figyelni kell:** tiszta, elágazás-gazdag
logika — mint a #43-as issue AST-alapú constraint analyzere — nehezen fedhető le
jól *kizárólag* HTTP válaszokon keresztül (minden edge case-hez egy külön
API-hívást kellene összeollózni). Ha egy ilyen komponenshez érsz, és úgy érzed,
hogy a Playwright-teszt csak megkerüli a tényleges logikát ahelyett hogy
tesztelné, állj meg és jelezd — lehet, hogy azt a komponenst megéri egy vékony,
közvetlen (pl. Pest) unit teszttel is lefedni. Ez nem visszalépés a PHPUnit-hoz,
csak elismerése annak, hogy nem minden logika HTTP-alakú.

---

## 2. Melyik réteg mit fed le

| Réteg | Mit tesztel | Mit NEM tesztel |
|---|---|---|
| `tests/e2e` | Valódi felhasználói folyamatok a böngészőben (feladatlista, szerkesztő, eredménypanel) | Backend logikát — az API mockolt, route interception-nel |
| `tests/api` | A HTTP szerződést: végpontok, validáció, jogosultság, rejtett teszteset-védelem, rate limit | UI-t — nincs böngésző, csak nyers HTTP hívások |

Ökölszabály:
- **Új végpont vagy backend-viselkedés** → `tests/api` teszt.
- **Új UI-elem vagy felhasználói folyamat** → `tests/e2e` teszt.
- **Mindkettő egyszerre** (pl. egy új gomb ami egy új végpontot hív) → mindkét
  réteg kap egy tesztet, külön-külön a saját szerződésére fókuszálva. Ne próbáld
  egy e2e teszttel lefedni a backend validációs eseteit — lassú és a hibaüzenet
  nem fogja megmondani, melyik réteg romlott el.

Ne írj E2E tesztet olyanra, amit egy API teszt is le tud fedni ugyanolyan
biztonsággal, tizedannyi idő alatt. Az E2E réteg drága (böngésző indítás,
build, preview szerver) — tartsd fenn a valódi user-flow-knak.

---

## 3. Hogyan futtasd

```bash
cd tests
npm install                # első alkalommal, vagy ha a package.json változott

npm run test:e2e           # csak E2E (mockolt API, nem kell backend)
npm run test:api           # csak API (elindít egy valódi backendet sqlite fixture-rel + hamis Judge0-t)
npm test                   # mindkettő, sorban
```

Az `test:api` parancs első futtatáskor letölti a Chromiumot is, ha még nincs
telepítve: `npx playwright install chromium`.

Nincs szükség kézzel elindított backendre vagy Judge0-ra egyik parancshoz sem —
mindkét config saját maga gondoskodik a függőségeiről a Playwright `webServer`
mechanizmusán keresztül (lásd lentebb).

---

## 4. Az `api` réteg belseje — amit tudnod kell, mielőtt hozzányúlsz

A `tests/api/playwright.config.ts` két `webServer`-t indít el minden futtatáskor:

1. `tests/shared/judge0-mock.js` — egy függőség nélküli Node HTTP szerver, ami a
   valódi Judge0-t helyettesíti. Alapból "visszhangozza" a stdin-t stdout-ként.
   Két vezérlő string a beküldött `source_code`-ban tud eltérő ágakat kiváltani:
   - `PW_JUDGE0_FORCE_WRONG` → érvényes, de rossz kimenet (failed teszteléshez)
   - `PW_JUDGE0_FORCE_UNAVAILABLE` → HTTP 503 (elérhetetlen szolgáltatás
     teszteléséhez)

   Ha egy új hibaágat kell szimulálnod, itt bővítsd a mockot egy újabb
   vezérlő stringgel — ne próbálj a valódi Judge0-hoz hozzáférni tesztből.

2. Egy valódi, helyi Laravel backend, PHP beépített szerverével kiszolgálva,
   friss sqlite fixture adatbázissal. A `backend/app/Console/Commands/
   PrepareApiTestFixtures.php` parancs migrál, seedel
   (`ApiTestSeeder`) és cache-t ürít minden egyes futtatás előtt.

### Buktatók, amikbe már belefutottunk (és amiket a config most már kivéd)

Ezeket azért írjuk le, mert ha bővíted a configot vagy egy hasonló
webServer-alapú tesztet írsz, könnyű újra belefutni:

- **`baseURL` + vezető `/` a request útvonalban = csendben levágja a path
  prefixet.** A Playwright `APIRequestContext` a WHATWG URL-feloldást
  használja: ha a `baseURL` `http://host/api/v1/` (kötelező záró `/`-lel), az
  útvonalaknak **nem** szabad `/`-lel kezdődniük (`request.get('tasks')`, nem
  `request.get('/tasks')`), különben az `/api/v1` prefix eltűnik a
  kérésből, és 404-et kapsz ahelyett amit vársz.
- **`request.post()` nem küld `Accept: application/json`-t alapból.** Enélkül
  a Laravel validációs hiba 302-es redirectet ad JSON helyett (mert azt hiszi,
  böngésző kérte). A configban globálisan be van állítva az
  `extraHTTPHeaders: { Accept: 'application/json' }` — ha egy új configot
  írsz, ne felejtsd el ezt is.
- **Ne `php artisan serve`-et hívj a `webServer.command`-ban Windows alatt.**
  A `serve` egy külön gyerekfolyamatban indítja a tényleges PHP szervert
  (Symfony Process). Windows alatt ezt a Playwright leállításkor nem tudja
  megbízhatóan megölni, egy elszabadult folyamat marad a porton, és a
  KÖVETKEZŐ futtatás ezt a régi (rossz sémájú vagy üres) adatbázisú
  példányt fogja újrahasznosítani `reuseExistingServer` miatt — csendben,
  hibaüzenet nélkül. Ezért a config közvetlenül a beépített PHP szervert
  indítja (`php -S ... server.php`), és a backend webServer-nél kifejezetten
  `reuseExistingServer: false` van beállítva: inkább hangosan hibázzon egy
  foglalt porton, mint hogy csendben elavult állapotot teszteljen.
- **`CACHE_STORE=array` nem működik a beépített PHP szerverrel.** A `php -S`
  minden kérést új bootstrap-ban szolgál ki, így egy in-memory cache sosem éli
  túl a kérések közti időt — a rate-limit teszt sosem látná növekedni a
  számlálót. Ezért a backend webServer env-je `CACHE_STORE=file`-t használ.
  Ha egy új, cache-re támaszkodó tesztet írsz ez ellen a backend ellen, ne
  válts vissza `array`-re.
- **A rate-limit teszt megosztott állapotra épül, ezért fusson utoljára.** A
  `/run` és `/submissions` közös `throttle:10,1` middleware-t használ — minden
  korábbi teszt POST hívása ugyanabból a kvótából fogyaszt. A config emiatt
  `fullyParallel: false` és `workers: 1` — ha ezt megváltoztatod, a
  rate-limit teszt (és minden más, IP-kulcsos throttle-re támaszkodó teszt)
  megbízhatatlanná válik.

### Fixture-ök: mit szabad feltételezni

Az `ApiTestSeeder` (`backend/database/seeders/ApiTestSeeder.php`) determinisztikus
sorrendben hoz létre 4 feladatot **minden `test:api` futtatás előtt, friss
(`migrate:fresh`) adatbázison**:

1. `PW teszt: Összegzés` — publikált, python+csharp, 2 látható + 2 rejtett teszteset
2. `PW teszt: Nem publikus feladat` — **nem publikált**, id-je mindig `2`
3. `PW teszt: Csak C# feladat` — publikált, csak `csharp` nyelven oldható meg
4. `PW teszt: Emelt szintű feladat` — publikált, `emelt` szint

A nem publikált feladat sosem jelenik meg a `/tasks` listában, ezért az
azonosítóját (`2`) direktben, hardkódolva használja a teszt — ez egy tudatos,
dokumentált szerződés a seeder és a spec fájl között, **ne** változtasd meg az
egyiket a másik nélkül. Minden más feladatot cím alapján keres meg a teszt
(`findTaskId` helper) — ha új fixture-t adsz hozzá, adj neki egyedi,
`PW teszt: ...` prefixű címet, és inkább keress rá címmel, mint hogy új
hardkódolt ID-t vezess be.

---

## 5. Determinizmus — nincs alku

- **Nincs `sleep`/időzítés-alapú várakozás.** Playwright `expect(...).toPoll()`
  vagy a beépített auto-waiting mechanizmusait használd, sose fix
  `setTimeout`-ot.
- **Nincs valódi külső hálózat.** A Judge0-t mindig a `tests/shared/judge0-mock.js`
  helyettesíti — ha egy teszthez új Judge0-viselkedés kell, bővítsd a mockot,
  ne hívj ki éles szolgáltatást.
- **Nincs megosztott, mutálható állapot tesztek között, hacsak nem szándékos és
  dokumentált** (lásd a rate-limit tesztet fentebb). Ha egy tesztednek számítania
  kell egy korábbi teszt mellékhatására, azt írd oda kommentben, miért, és hogy
  ez miért biztonságos.
- **Egy hibásan időzített ("flaky") teszt nem "újrafuttatjuk amíg zöld nem
  lesz".** Ha egy teszt megbízhatatlanul bukik, azt a hét folyamán javítsd meg
  (vagy ideiglenesen `test.fixme`-vel jelöld meg *jegyzett indoklással*), ne
  hagyd némán retry-olni a CI-ban — a retry elrejti a problémát, nem megoldja.

---

## 6. Biztonsági / adverzális tesztek

Ez egy kódfuttató SaaS — a QA-nak tartalmaznia kell rosszindulatú/határeset
forgatókönyveket is, nem csak a boldog utat:

- A Judge0 token/URL **soha** nem szivároghat ki egy API válaszban (lásd #37).
- Rejtett teszteset stdout/stdin/expected mezője **soha** nem jelenhet meg a
  válaszban, egyik eredmény-állapotnál sem (`passed`, `failed`, `error`,
  jövőbeli `Time Limit Exceeded` / `Runtime Error` / `Constraint Violation`
  állapotoknál is — lásd #41).
- Időtúllépés / erőforrás-korlát tényleges kikényszerítése tesztelve legyen,
  ne csak feltételezve (a Judge0 konfiguráció beállítja a limiteket, de a
  válasz-feldolgozásnak helyesen kell kezelnie, ha egy teszteset TLE-t kap).
- Rate limit teszt (lásd fent) — bizonyítja, hogy a throttle tényleg működik,
  nem csak jelen van a route definícióban.

---

## 7. Definition of Done — teszt szempontból

Egy issue/PR akkor számít késznek, ha:

1. Az issue `Acceptance criteria` listájának minden pontjához van megfeleltethető
   assertion valamelyik teszt fájlban (nem kell 1:1 teszt/kritérium, de minden
   kritérium bizonyítva legyen).
2. `cd tests && npm test` zöld, lokálisan is, nem csak CI-ban.
3. Ha a változás új hibaágat/eredmény-állapotot vezet be, a `judge0-mock.js`
   vagy az `ApiTestSeeder` bővül a szimulálásához (ne mockolj a spec fájlon
   belül, ha az elvileg megosztható infrastruktúra).
4. Ha egy bugot javítasz (nem feature-t adsz hozzá), a PR tartalmaz egy
   regressziós tesztet, ami a javítás nélkül elbukna.

---

## 8. CI

A `.github/workflows/ci.yml` `tests` job-ja minden push/PR-nél lefuttatja mindkét
suite-ot (`npm run test:e2e`, majd `npm run test:api`), a backendet is
felhúzva (`composer install`, PHP 8.3). Bukás esetén a Playwright riport
feltöltődik artifactként (`tests/playwright-report/`,
`tests/api/playwright-report/`).

**Jelenlegi hiányosság:** a CI fut, de a `main` ág nincs védve — egy PR pirosan
is mergelhető. Ha az "enterprise" mércét komolyan vesszük, ehhez branch
protection rule kell a `main`-en, ami megköveteli a `tests` és `frontend` job
sikerét merge előtt.
