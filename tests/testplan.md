# Tesztterv: mennyi tesztesetet kell lefedni (API és E2E)

Állapot: 2026-10-14, a `fullstack/backend-platform` ág alapján. A számok **becslések** a végpontlistából (`docs/api-endpoints.md`: 131 végpont) és az oldalakból; a cél a döntéshez szükséges nagyságrend, nem pontos szám. A meglévő darabszámok a `npx playwright test --project=<p> --list` kimenetéből vannak.

## 1. Mi van ma

| Projekt | Meglévő tesztek | Megjegyzés |
|---|---|---|
| `api` + `api-rate-limit` | 295 (mind zöld; 289 a teljes futáskor, +6 a három záró tesztpont) | valódi Laravel, SQLite, Judge0-mock |
| `e2e-mocked` | 47 | a lefordított frontend, minden API-hívás mockolva |
| teljes verem (böngésző + valódi backend) | **0** | nincs ilyen projekt |
| backend PHPUnit | 0 | szándékosan nincs, az API-projekt fedi |

Meglévő API-tesztek területenként: admin-overview 9, admin-users 15, auth 25 (login 10, register 8, verify 7), catalog 5, checks-documents 14, checks-slides-web 20, exams 35, execution-v2 19, file-submissions 28, foundation 11, health 1, learning 41, progress-privacy 13, rubrics 14, run 5, submissions 2, typed-tasks 31, rate-limit 1.

Meglévő E2E: accessibility 4, admin-authoring 8, exam-clock 2, onboarding 6, oral 6, register 3, site 7, task-list 2, task-solve 9.

A fájlfeladat-ellenőrző csomagok (WP3–WP5) és a vizsgák (WP6) jól fedettek. A **legnagyobb lyukak**: számlázás/fizetés (0 teszt), fiókkezelés, admin katalógus-szerkesztés, jogosultsági mátrix, ütemezett feladatok, és az egész felhasználói felület a belépés, fizetés, lecke, fájlfeladat és vizsgafutó oldalakon.

## 2. API szint: cél és hiány

Elv: minden végpontra legalább (a) siker, (b) validáció, (c) jogosultság (vendég 401, diák 403, idegen erőforrás 404), (d) a végpont sajátos szabálya.

| # | Terület | Végpontok | Ma | Cél | Hiány | Prioritás |
|---|---|---|---|---|---|---|
| A1 | Jogosultsági mátrix (adatvezérelt, a `docs/api-endpoints.md`-ből generálva: minden útvonal × vendég/diák/admin) | 131 | ~0 külön | 150 | 150 | P0 |
| A2 | Számlázás: terv, profil, checkout, fizetések, lemondás/visszavonás/kártyacsere, számlaletöltés | 11 | 0 | 40 | 40 | P0 |
| A3 | Barion webhook + `SyncPaymentState`: idempotencia, ismeretlen/lemaradt callback, állapotátmenetek | 1 | 0 | 15 | 15 | P0 |
| A4 | Ütemezett feladatok (artisan-segéddel): `ProcessDueSubscriptions`, `ExpireGracePeriods`, `RetryPendingInvoices`, `SyncPendingPayments`, `IssueInvoice` | – | 0 | 15 | 15 | P0 |
| A5 | Admin számlák (retry, vevő javítása) és hozzáférés-engedélyek | 6 | 0 | 12 | 12 | P1 |
| A6 | Fiók: export, törlés (eseményvezérelt takarítás), profil, jelszó, e-mail csere + megerősítés | 8 | ~3 | 27 | 24 | P0 |
| A7 | Auth kiegészítés: elfelejtett/új jelszó, kijelentkezés, `me`, megerősítő levél újraküldése, lejárt/hamis aláírás | 8 | 25 | 40 | 15 | P1 |
| A8 | Admin katalógus CRUD: ágak, modulok, leckék, feladatok, tesztesetek, sorrend, közzétételi és törlési szabályok | 33 | ~8 | 55 | 47 | P1 |
| A9 | Nyilvános katalógus: ágak, feladatlista szűrők (szint, téma, státusz), leckék, zárolt tartalom, videó aláírt URL (lejárat, hamisítás), lecke-teljesítés | 14 | 5 | 30 | 25 | P1 |
| A10 | Kódfuttatás: kényszerek (Python AST, C#), SQL sorrendfüggés, rejtett teszt redaktálás, Judge0 kiesés → `system_error`, határidő, szerepkörönkénti rate limit | 4 | 26 | 46 | 20 | P1 |
| A11 | Haladás, előzmények, kurzoros lapozás | 4 | ~8 | 16 | 8 | P2 |
| A12 | Vizsga és fájlbeadás: párhuzamosság, méretkorlátok, retenciós job-ok szélső esetei | 7 | 63 | 73 | 10 | P2 |
| A13 | Health, readiness, client-errors, languages, topics | 6 | 1 | 7 | 6 | P2 |
| A14 | Adatbázis-semleges futtatás: a teljes API-csomag MySQL-en is (CI-job) | – | 0 | 0 új eset | konfiguráció | P0 |
| **Összesen** | | | **295** | **~670** | **~375** | |

Új infrastruktúra az API-hoz: Barion- és Számlázz.hu-stub (`BARION_BASE_URL`, `SZAMLAZZ_BASE_URL` felülírás már van; a `tests/src/mocks/` alá), egy `artisan` segéd az ütemezett feladatok futtatásához a fixture-adatbázison, és egy generátor a jogosultsági mátrixhoz.

## 3. E2E szint: cél és hiány

Két réteg: **mockolt** (gyors, minden oldal és állapot) és **teljes verem** (kevés, de valódi arany útvonalak).

### 3.1 `e2e-mocked`

| # | Terület | Ma | Cél | Hiány | Prioritás |
|---|---|---|---|---|---|
| E1 | Belépés, elfelejtett/új jelszó, e-mail megerősítés, kijelentkezés, lejárt token kezelése | 3 | 15 | 12 | P0 |
| E2 | Fiók: profil, jelszó, e-mail csere, export, törlés | 0 | 10 | 10 | P1 |
| E3 | Számlázás: árazás, feliratkozás, fizetésből visszatérés, előfizetés-kezelés, fizetési táblázat, lejárt-fizetés sáv | 0 | 18 | 18 | P0 |
| E4 | Tanulási út, ág, lecke, videó, zárolt lecke (vendég / nem megerősített / nem előfizető) | 0 | 15 | 15 | P0 |
| E5 | Kódmunkaterület: Python / C# / SQL, futtatás, beadás, hibaesetek (429, időtúllépés, kapcsolat), rejtett teszt, előzmények | 9 | 24 | 15 | P0 |
| E6 | Fájlfeladat-munkaterületek (táblázat, dokumentum, bemutató, web): feltöltés, eredmény, kézi pontozás | 0 | 14 | 14 | P1 |
| E7 | Vizsgafutó: indítás, visszaszámlálás, feltöltés, beadás, eredmény, lejárt, gyakorló mód | 2 | 16 | 14 | P1 |
| E8 | Gyakorló táblázat és dokumentum (böngészőn belüli) | 0 | 6 | 6 | P2 |
| E9 | Admin: katalógus, felhasználók, számlák, áttekintő, vizsgaszerkesztő, értékelőlap | 8 | 23 | 15 | P1 |
| E10 | Jogi oldalak, süti-hozzájárulás, hibaoldalak, ErrorBoundary, 404, offline | 7 | 19 | 12 | P2 |
| E11 | Hozzáférhetőség (axe) minden fő útvonalon, billentyűzetes végigjárás | 4 | 24 | 20 | P1 |
| E12 | Reszponzív: mobil nézetek a fő folyamatokon | 0 | 8 | 8 | P2 |
| E13 | Onboarding és szóbeli gyakorlás (már jól fedett) | 12 | 14 | 2 | P3 |
| **Összesen** | | **47** | **~210** | **~160** | |

### 3.2 Teljes verem (új projekt: `e2e-full`, valódi Laravel + Judge0-mock + fizetési stubok)

Kevés, lassú, de ezek fogják meg azt, amit a mockok nem (szerződés-eltérés a frontend típusai és a backend között). Minden teszt egy teljes felhasználói út:

| # | Út | Eset |
|---|---|---|
| F1 | Regisztráció → levélből megerősítés → belépés | 2 |
| F2 | Ingyenes feladat megoldása (Python és SQL), haladás látszik | 3 |
| F3 | Előfizetés a Barion-stubbal, prémium lecke megnyílik, számla letölthető | 3 |
| F4 | Lemondás, visszavonás, sikertelen megújítás → türelmi idő | 3 |
| F5 | Táblázat-fájlfeladat feltöltés, hibás és jó, kézi pont | 3 |
| F6 | Vizsga indítása, részek beadása, eredmény | 3 |
| F7 | Admin: új feladat + értékelőlap + közzététel, a diák látja | 3 |
| F8 | Fiók exportja és törlése | 2 |
| F9 | Jogosultság: vendég és diák nem éri el az admin és prémium tartalmat | 3 |
| | **Összesen** | **~25** |

## 4. Összegzés

| | Ma | Cél | Új |
|---|---|---|---|
| API | 295 | ~670 | ~375 |
| E2E mockolt | 47 | ~210 | ~160 |
| E2E teljes verem | 0 | ~25 | ~25 |
| **Összesen** | **342** | **~905** | **~560** |

Sorrend (érték / ár szerint): **P0** először (jogosultsági mátrix, számlázás és webhook, ütemezett feladatok, fiókkezelés, belépés/fizetés/lecke UI, MySQL-futtatás), mert ezek pénzt és adatot érintenek és ma lefedetlenek (~260 eset). Utána P1 (~260), végül P2–P3.

## 5. Nem funkcionális tesztek (nem számolva a fenti darabszámba)

- **Terhelés** (k6 vagy hasonló): `/run` és `/submissions` a Judge0-sorral, belépés, katalóglista; cél: a rate limit és a 45 s-os határidő viselkedése terhelés alatt.
- **Biztonság**: az IDOR-ok a jogosultsági mátrixban; feltöltés-fuzzing (zip bomba, makró, XXE) a meglévő fixture-ökkel kibővítve; függőségek auditja (`composer audit`, `npm audit`) a CI-ben.
- **Migrációk**: minden migráció előre és vissza MySQL-en, a `db:snapshot-before-migrate` próbája.
- **Visszaállítás**: a mentés-visszaállítás próbája (runbook), nem automata teszt.

## 6. Szabályok az új tesztekhez

A `tests/README.md` és a `CLAUDE.md` szabályai érvényesek: `test` és `expect` csak a `src/fixtures`-ből, az oldalobjektumok nem állítanak, nincs `waitForTimeout`, mindig `--project`. A seed (`ApiTestSeeder.php` és `src/data/seed.ts`) változtatásakor mindkettőt módosítani kell.
