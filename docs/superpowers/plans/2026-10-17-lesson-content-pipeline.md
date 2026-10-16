# Tananyag-csővezeték: megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A tananyag Markdown/YAML fájlokból kerül az adatbázisba (`catalog:import`), visszaírható (`catalog:export`), valódi Judge0-n ellenőrizhető piszkozatként is (`catalog:verify --drafts`), és a leckeoldalon a Python/C# kódblokkok lapfülekként jelennek meg.

**Architecture:** Egy fájlolvasó (`ContentReader`) a fát típusos csomópontokká olvassa, egy validátor (`ContentValidator`) a szabályokat ellenőrzi, egy tervező (`ContentPlanner`) az adatbázissal veti össze, egy alkalmazó (`ContentImporter`) egyetlen tranzakcióban a **meglévő admin Actionökön** át ír (közzétételi őrök és audit változatlanul). A frontenden egy remark-bővítmény egymás utáni nyelvi kódblokkokat `code-tabs` elemmé fog össze.

**Tech Stack:** Laravel 12 / PHP 8.3, `symfony/yaml`, Larastan max, Playwright (`api` és `e2e-mocked` projekt), React 19 + react-markdown 10.

**Spec:** `docs/superpowers/specs/2026-10-17-lesson-content-pipeline-design.md`

## Global Constraints

- Kód, megjegyzés, UI-szöveg és hibaüzenet **magyar**; a felhasználónak szóló backend-szöveg a `backend/lang/hu/*.php`-ból jön (`__()`). Konzol-kimenet a parancsokban is magyar.
- Minden PHP osztály `declare(strict_types=1)`, a hatás-osztályok `final readonly`; `composer lint` és `composer analyse` (Larastan `max`) zöld: teljes `@param`/`@return`/`@throws` típusozás.
- A `docs/api-endpoints.md` nem változik (nincs új HTTP végpont); a parancsok csak CLI-ből futnak.
- Migrációt nem szerkesztünk; ez a terv **nem ad új migrációt**.
- Frontend: csak `src/shared/ui` komponensek és design tokenek (nincs `[...]` érték), `import type`, nincs `any`, nincs `!`, nincs `console.log`.
- Tesztek: `test`/`expect` csak a `src/fixtures`-ből; page objectben nincs assertion; nincs `waitForTimeout`. Mindig `--project=` megadva.
- A szerző-oldali azonosító a **slug-útvonal** (`track/modul/lecke[/feladat]`). Az import **sosem töröl**; ami eltűnik a fájlokból, azt `is_published=false`-ra állítja.
- Egy feladat `level` értéke `kozep|emelt`, `difficulty` 1..5, `starter_code.*` ≤ 20 000 és `sample_solutions.*` ≤ 50 000 karakter, nyelvek: `python|csharp|sql` (ugyanaz, mint `ExerciseRequest`).

## Review Focus

1. **CRLF és BOM**: Windowson szerkesztett `lesson.md`/`.yml` sorvég `\r\n`, esetleg BOM-mal: ugyanúgy kell parse-olódnia, mint LF-fel (Task 1).
2. **Vízszintes vonal a törzsben**: a fejléc utáni `---` sor a szövegben nem zárhatja le újra a fejlécet, és nem vághatja le a törzset (Task 1).
3. **Ismeretlen/elgépelt kulcs** a fejlécben vagy a YAML-ban (`publised:`): hiba, nem csendes figyelmen kívül hagyás (Task 2).
4. **Nyelv a `sample_solutions`-ben, ami nincs az `allowed_languages`-ben** (és fordítva: engedélyezett nyelvhez nincs mintamegoldás) (Task 2, 4).
5. **Ismétlődő slug ugyanabban a szülőben**, vagy két lecke ugyanazzal a `position`-nel (Task 2).
6. **Tesztesetek `stdin`/`expected` záró sortörés nélkül**, és ékezetes/emoji szöveg szó szerinti megőrzése (Task 3).
7. **Importálás kétszer egymás után**: nulla változás, és a `--dry-run` után sem módosult semmi (Task 3).
8. **Nyelvi blokkok, amiket nem szabad összevonni**: szöveg választja el őket, vagy egyik sem `python`/`csharp`; három blokk egy sorban (Task 6).

---

## Fájlstruktúra

| Fájl | Felelősség |
|---|---|
| `backend/app/Services/Catalog/Content/ContentSet.php` + csomópont-osztályok | típusos fa: `TrackNode`, `ModuleNode`, `LessonNode`, `ExerciseNode`, `ContentProblem` |
| `backend/app/Services/Catalog/Content/ContentReader.php` | könyvtárfa és fájlok beolvasása, fejléc/törzs szétválasztás |
| `backend/app/Services/Catalog/Content/ContentValidator.php` | séma- és üzleti szabályok, magyar hibalista |
| `backend/app/Services/Catalog/Content/ContentPlanner.php` | összevetés az adatbázissal (`ImportPlan`) |
| `backend/app/Services/Catalog/Content/ContentImporter.php` | tranzakciós alkalmazás Actionökön át |
| `backend/app/Services/Catalog/Content/ContentExporter.php` | adatbázis → fájlok |
| `backend/app/Console/Commands/ImportCatalogCommand.php`, `ExportCatalogCommand.php` | `catalog:import`, `catalog:export` |
| `backend/app/Console/Commands/VerifyCatalogCommand.php` | `--drafts`, `--negative`, nyelvenkénti mintamegoldás |
| `frontend/src/shared/ui/CodeTabs.tsx`, `codeTabs.ts` | fülsor-komponens, remark-bővítmény |
| `frontend/src/shared/domain/lessonLanguage.ts` | választott nyelv tárolása és megosztása |
| `tests/specs/api/catalog-import.spec.ts`, `tests/specs/e2e/lesson-tabs.spec.ts` | tesztek |
| `tests/fixtures/catalog/**` | tesztfájlok (érvényes és hibás fa) |
| `content/catalog/**` | a valódi tananyag (Task 7: 1. lecke) |

---

### Task 1: Fájlolvasó és validátor, `catalog:import --dry-run` (csak olvas és ellenőriz)

**Files:**
- Create: `backend/app/Services/Catalog/Content/{ContentSet,TrackNode,ModuleNode,LessonNode,ExerciseNode,ContentProblem,ContentReader,ContentValidator}.php`, `backend/app/Console/Commands/ImportCatalogCommand.php`
- Create: `tests/fixtures/catalog/valid/**`, `tests/fixtures/catalog/invalid/**`, `tests/specs/api/catalog-import.spec.ts`
- Modify: `tests/src/support/artisan.ts` (új `artisanResult`), `backend/composer.json` (`composer require symfony/yaml`)

**Interfaces:**
- Produces: `ContentReader::read(string $root): ContentSet` (fájlrendszer-hiba/üres gyökér esetén `ContentSet` problémával, nem kivétellel); `ContentSet{ list<TrackNode> $tracks; list<ContentProblem> $problems }`; `LessonNode{ string $path; array<string,mixed> $attributes; string $content; list<ExerciseNode> $exercises; ?string $reviewedBy; ?string $reviewedAt }` (az `$attributes` kulcsai már adatbázis-mezőnevek: `slug,title,position,is_free,is_published`); `ExerciseNode{ string $path; array<string,mixed> $attributes; list<array{stdin:string,expected_stdout:string,is_hidden:bool,order:int}> $testCases }`; `TrackNode{path, attributes, list<ModuleNode> modules}`; `ModuleNode{path, attributes, list<LessonNode> lessons}`; `ContentProblem{ string $file; string $message }`.
- Produces: `ContentValidator::problems(ContentSet $set): list<ContentProblem>`.
- Produces: `artisanResult(args: string[]): { status: number; stdout: string; stderr: string }` a `tests/src/support/artisan.ts`-ben (nem dob nem-nulla kilépési kódra).
- Produces: `php artisan catalog:import {--dry-run} {--path=content/catalog} {--only=}`; relatív `--path` a repó gyökeréhez (`base_path('..')`) képest, abszolút is jó.

- [ ] **Step 1: Failing API tests** (`catalog-import.spec.ts`, `@regression`): (a) `valid` fa `--dry-run`-nal: kilépési kód 0, a kimenet tartalmazza a `1 új lecke` és `2 új feladat` szöveget, és az adatbázisban a `pw-import-` előtagú track **nem** jött létre (`tinkerJson`); (b) `invalid` fa (ismeretlen fejlécmező `publised`, ékezetes slug, `level: nehez`, `allowed_languages: [ruby]`, kettős slug): kilépési kód 1, a kimenet minden hibás fájl útvonalát és magyar üzenetet tartalmaz; (c) CRLF-es és BOM-os `lesson.md` ugyanúgy olvasódik; (d) a törzsben lévő `---` vízszintes vonal megmarad a `content`-ben (a teszt `--dry-run` kimenete a törzs hosszát is kiírja: `törzs: N karakter`).
- [ ] **Step 2: Futtatás: bukik** — `npx playwright test --project=api specs/api/catalog-import.spec.ts` → a parancs nem létezik.
- [ ] **Step 3: `composer require symfony/yaml`** (a `backend/`-ben), majd `ContentReader::read` implementálása: `Symfony\Component\Yaml\Yaml::parse` a `.yml`-re és a `lesson.md` fejlécére; a fejlécet a **fájl első sorától** az **első** önálló `---` sorig vágja (BOM és `\r\n` normalizálás előbb), a maradék a törzs szó szerint. A fejlécmezők leképezése: `free→is_free`, `published→is_published`, a feladatnál `tests[].expected→expected_stdout`, `hidden→is_hidden`, a tesztek `order` a lista sorrendje (0-tól).
- [ ] **Step 4: `ContentValidator::problems`**: a Global Constraints értékhatárai, kötelező mezők (`slug,title,position`; feladatnál `kind ∈ {code,sql}`, `level,difficulty,allowed_languages,description`, legalább egy `tests`), ismeretlen kulcs hiba (a `reviewed_by`/`reviewed_at` megengedett), `sample_solutions`/`starter_code` kulcsai ⊆ `allowed_languages`, slug csak `[a-z0-9-]` ASCII, kettős slug és kettős `position` a szülőn belül. Üzenetek magyarul, `fájl: üzenet` formában.
- [ ] **Step 5: `ImportCatalogCommand` (csak `--dry-run` ág)**: beolvas, validál; hibánál `1`, különben összefoglaló (`N új/módosított lecke, M feladat`, törzs hossza) és `0`; **semmit nem ír**. Az `--only` útvonal-előtagra szűr.
- [ ] **Step 6: Zöld teszt, majd** `cd backend && composer lint && composer analyse` zöld; commit: `feat: catalog:import olvasó és validátor (dry-run)`.

---

### Task 2: Tervező: az adatbázissal való összevetés

**Files:**
- Create: `backend/app/Services/Catalog/Content/{ContentPlanner,ImportPlan,PlanEntry}.php`
- Modify: `backend/app/Console/Commands/ImportCatalogCommand.php` (a `--dry-run` a tervet írja ki), `tests/specs/api/catalog-import.spec.ts`

**Interfaces:**
- Consumes: `ContentSet` (Task 1); modellek `Track`, `Module`, `Lesson`, `Exercise`, `TestCase`.
- Produces: `ContentPlanner::plan(ContentSet $set): ImportPlan`; `ImportPlan{ list<PlanEntry> $entries; list<PlanEntry> $unpublish }`; `PlanEntry{ string $kind /* track|module|lesson|exercise */; string $path; string $action /* create|update|unchanged|unpublish */; list<string> $changedFields }`.

- [ ] **Step 1: Failing tests**: (a) üres adatbázison a `valid` fa minden eleme `create`; (b) import után (Task 3 előtt `tinkerJson` fixture-rel létrehozva) ugyanaz a fa `unchanged`, és egy megváltozott `title` pontosan `['title']`-t jelöl; (c) egy, a fájlokból hiányzó (de az adatbázisban lévő, importált) lecke `unpublish` bejegyzés; (d) a dry-run kimenete soronként `~ módosít lecke programozas/alapok/kiiras (title)` formátumú.
- [ ] **Step 2: Bukó futtatás.**
- [ ] **Step 3: `ContentPlanner::plan`**: egy track/modul/lecke/feladat azonosítása a slug-útvonallal (`Lesson` a `(module_id, slug)` kulccsal; `Exercise` a `lesson_id` + a fájl `slug` mezője → a `exercises` táblának **nincs slug oszlopa**, ezért az azonosító a `(lesson_id, title)` pár; a fájl `slug` mezője csak a fájlnév/ellenőrzés, és az import ugyanazzal a `Str::slug(title)`-lel egyezteti, amit a `CatalogSeeder` használ). Mezőnkénti összehasonlítás típushelyesen (JSON mezők kanonikus sorrenddel).
- [ ] **Step 4: A parancs `--dry-run` ága** kiírja a tervet, `0`-val lép ki hibamentes fán; semmit nem ír. Zöld teszt, lint, analyse, commit: `feat: catalog:import terv az adatbázis összevetéséből`.

---

### Task 3: Tranzakciós alkalmazás Actionökön át

**Files:**
- Create: `backend/app/Services/Catalog/Content/ContentImporter.php`
- Modify: `backend/app/Console/Commands/ImportCatalogCommand.php` (éles ág), `backend/app/Enums/AuditAction.php` (új eset `CatalogImported`), `tests/specs/api/catalog-import.spec.ts`

**Interfaces:**
- Consumes: `ImportPlan`, `ContentSet`; `CreateLesson::handle(array $attributes, User $admin): Lesson`, `UpdateLesson::handle(Lesson $lesson, array $attributes, User $admin): Lesson`, `CreateExercise::handle(array $attributes, User $admin): Exercise`, `UpdateExercise::handle(Exercise $exercise, array $attributes, User $admin): Exercise`, `ManageCatalogItem::create(Model $item, ?string $parentKey, User $actor)`/`update(...)` track/modul létrehozásához, `ManageTestCase::create(Exercise, array, User): TestCase` és `delete(TestCase, User): void`.
- Produces: `ContentImporter::apply(ContentSet $set, ImportPlan $plan, User $actor): ImportSummary` (`ImportSummary{ int $created; int $updated; int $unpublished }`).
- Az importáló felhasználó: a parancs a legkisebb azonosítójú `admin` szerepű felhasználót használja; ha nincs, hibaüzenettel áll le (`user:role {email} admin` a teendő).

- [ ] **Step 1: Failing tests**: (a) éles import a `valid` fán: a lecke/feladat/tesztesetek létrejönnek, a `content` szó szerint egyezik (ékezet, emoji, záró sortörés nélküli `stdin`); (b) **második futtatás nulla változtatás** (`updated_at` nem módosul, `ImportSummary` 0/0/0); (c) hibás fa esetén **semmi nem íródik**; (d) `published: true` feladat látható teszteset vagy mintamegoldás nélkül → az **egész** import elutasítva, a meglévő `PublishedExerciseNeedsVisibleTestCase` üzenettel, és az adatbázis változatlan; (e) eltűnt lecke nem publikált lesz, nem törlődik; (f) a tesztesetek a fájl sorrendjében felülíródnak (egy kivett teszt eltűnik); (g) az audit naplóban megjelenik a `catalog_imported` összefoglaló esemény (PII nélkül, csak darabszámok).
- [ ] **Step 2: Bukó futtatás.**
- [ ] **Step 3: `ContentImporter::apply`**: egy `DB::transaction`; sorrend track → modul → lecke → feladat → tesztesetek; csak a `create`/`update` bejegyzéseket futtatja, a `changedFields` üres bejegyzést kihagyja; a `unpublish` bejegyzések az `UpdateLesson`/`UpdateExercise`-on át `is_published=false`-t írnak. A feladatnál `starter_code`/`sample_solutions` tömbként, `constraints` null-kezeléssel.
- [ ] **Step 4: `ImportCatalogCommand` éles ága** (`--dry-run` nélkül), kilépési kód 0/1, `AuditAction::CatalogImported` rögzítése `RecordAuditEvent`-tel a darabszámokkal.
- [ ] **Step 5: Zöld teszt, `composer lint`, `composer analyse`, `php artisan docs:endpoints --check`; commit: `feat: catalog:import tranzakciós alkalmazás`.**

---

### Task 4: `catalog:verify` bővítése

**Files:**
- Modify: `backend/app/Console/Commands/VerifyCatalogCommand.php`, `backend/app/Services/Catalog/ExerciseVerifier.php`, `tests/specs/api/catalog-verify.spec.ts`, `docs/runbooks/katalogus-ellenorzes.md`

**Interfaces:**
- Produces: új opciók `--drafts` (a nem publikált feladatokat is ellenőrzi, `--track`-kal szűkíthető) és `--negative` (az üres program nem mehet át minden teszten). **A specifikáció 5.3 szakaszának `--source=files` javaslata helyett** a munkamenet `import` (piszkozat) → `verify --track=… --drafts` → publikálás; nincs külön fájl-alapú ellenőrző.
- `ExerciseVerifier::verify(Exercise $exercise): ExerciseVerification` kiegészítése: minden `allowed_languages`-beli nyelvhez mintamegoldás kell, különben `ExerciseVerification` hibával tér vissza (üzenet: melyik nyelv hiányzik).

- [ ] **Step 1: Failing tests** (a Judge0 mock `JUDGE0_CONTROL.forceWrong` jelzőivel, mint a meglévő spec): (a) kétnyelvű feladat csak Python mintamegoldással → hiba, benne `csharp`; (b) piszkozat feladat `--drafts` nélkül kimarad, vele ellenőrzött; (c) `--negative`: ha az üres program minden teszten átmegy (mock-vezérelt), a feladat hibás.
- [ ] **Step 2: Bukó futtatás.**
- [ ] **Step 3: Implementáció** az `ExerciseVerifier::solutionsOf` meglévő segítségére építve; `--negative` az üres kódot ugyanazzal a `SolutionEvaluator`-ral futtatja.
- [ ] **Step 4: Runbook frissítése** (az új munkamenet és a két opció, magyarul). Zöld teszt, lint, analyse; commit: `feat: catalog:verify --drafts, --negative, nyelvenkénti mintamegoldás`.

---

### Task 5: `catalog:export`

**Files:**
- Create: `backend/app/Services/Catalog/Content/ContentExporter.php`, `backend/app/Console/Commands/ExportCatalogCommand.php`
- Modify: `tests/specs/api/catalog-import.spec.ts`

**Interfaces:**
- Produces: `ContentExporter::export(string $root, bool $force): list<string>` (a kiírt fájlok relatív útvonalai); parancs `catalog:export {--path=content/catalog} {--force}`. Meglévő fájlt csak `--force`-szal ír felül, és a `lesson.md` `reviewed_by`/`reviewed_at` fejlécmezőit megőrzi.

- [ ] **Step 1: Failing tests**: körút: `valid` fa importja → export üres könyvtárba → **újraimport = nulla változás** (Task 3 (b) szerinti); `--force` nélkül meglévő fájlra hiba; ékezetes cím és sortörések szó szerint maradnak.
- [ ] **Step 2: Bukó futtatás, majd implementáció**: a slug-útvonalból mappanevek (`NN-slug`, a `position` szerint), `Symfony\Component\Yaml\Yaml::dump` (`inline` szint és `DUMP_MULTI_LINE_LITERAL_BLOCK` a `description`/kódmezőkhöz).
- [ ] **Step 3: Zöld, lint, analyse; commit: `feat: catalog:export`.**

---

### Task 6: Frontend: nyelvi lapfülek

**Files:**
- Create: `frontend/src/shared/ui/codeTabs.ts` (remark-bővítmény), `frontend/src/shared/ui/CodeTabs.tsx`, `frontend/src/shared/domain/lessonLanguage.ts`
- Modify: `frontend/src/shared/ui/Prose.tsx` (a `codeBlocks` módban bekötés)
- Create: `tests/specs/e2e/lesson-tabs.spec.ts`; modify a `tests/src/mocks/MockApi.ts` fixture-jét (lecke `content` mezője)

**Interfaces:**
- Produces: `remarkCodeTabs(): (tree: Root) => void` (mdast `Root`, `mdast` típusok a `react-markdown` függőségeiből): egymás utáni, **közvetlenül szomszédos** (köztük más csomópont nincs) `code` csomópontok, amelyek `lang`-ja `python` vagy `csharp`, egy `{ type: 'code-tabs' }` csomópont alá kerülnek (`data.hName = 'code-tabs'`), a szövegbeli sorrendben; egyetlen ilyen blokk **nem** válik fülsorrá.
- Produces: `useLessonLanguage(): readonly [StudyLanguage, (language: StudyLanguage) => void]` (`StudyLanguage` a `shared/domain/preferences.ts`-ből), kulcs `infotanar.lessonLanguage.v1`, alapérték `python`, `useSyncExternalStore`-ral megosztva az oldal összes fülsorán; a tárolás `try/catch` mögött, tároló nélkül is működik.
- Produces: `CodeTabs({ blocks }: { blocks: ReadonlyArray<{ language: StudyLanguage; code: string }> })`: `role="tablist"`, `aria-selected`, nyilakkal váltható, 44 px magas fülek, a kiválasztott fül a `useLessonLanguage` értékéhez igazodik; ha a választott nyelv nincs a blokkban, az elsőt mutatja.

- [ ] **Step 1: Failing e2e-mocked tests** (`@regression`, plusz `@a11y` az axe-vizsgálathoz): egy leckében `python` + `csharp` blokk egy fülsor; a C# fülre kattintva az oldal **összes** fülsora C#-ra vált; újratöltés után a C# marad; két blokk, köztük bekezdés: **nem** vonódik össze; csak `python` blokk: nincs fülsor; három szomszédos blokk (`python`, `csharp`, `sql`) → a fülsor csak a `python|csharp` párt vonja össze (a `sql` külön blokk marad); billentyűzettel (nyilak) váltható; `axe` hiba nélkül.
- [ ] **Step 2: Bukó futtatás** — `npx playwright test --project=e2e-mocked specs/e2e/lesson-tabs.spec.ts`.
- [ ] **Step 3: `codeTabs.ts`** a fenti szerződéssel (kézi bejárás, külön `unist-util-visit` függőség nélkül); **Step 4: `lessonLanguage.ts`**; **Step 5: `CodeTabs.tsx`** a `CodeBlock` komponenst használva, csak design tokenekkel; **Step 6: `Prose.tsx`** (`codeBlocks` módban a `remarkPlugins`-hez adás és `components['code-tabs']`).
- [ ] **Step 7: `cd frontend && npm run lint && npm run typecheck && npm run build`, `cd tests && npm run check`, majd** `npm run test:e2e` a teljes e2e-mocked készlettel; commit: `feat: nyelvi lapfülek a leckeszövegben`.

---

### Task 7: 1. lecke mint referencia, CI és deploy

**Files:**
- Create: `content/catalog/programozas/_track.yml`, `.../01-alapok/_module.yml`, `.../01-alapok/01-kiiras-es-bevitel/lesson.md`, `.../exercises/01-*.yml`, `02-*.yml`, `03-*.yml` (3 feladat, mindkét nyelven mintamegoldás)
- Create: `content/README.md` (szerzői útmutató: formátum, munkafolyamat, fordítási szabályok)
- Modify: `.github/workflows/ci.yml` (új lépés a backend jobban: `php artisan catalog:import --dry-run --path=../content/catalog` a SQLite fixture-adatbázison), `.github/workflows/deploy.yml` (a `content/` rsync-je; az import **csak** a `CATALOG_IMPORT_ON_DEPLOY == 'true'` repó-változóval), `CLAUDE.md` (parancsok és mappa)

**Interfaces:**
- Consumes: Task 1–5 parancsok.

- [ ] **Step 1: A lecke megírása** a spec 4.2/4.3 formátumában (`published: false`): elmélet, Python+C# példa, 3 feladat (kiíratás, beolvasás+kiírás, két szám összege), `tests` látható és rejtett esetekkel.
- [ ] **Step 2: Ellenőrzés helyben**: `php artisan catalog:import --dry-run --path=../content/catalog` zöld; SSH-alagúton valódi Judge0-val `php artisan catalog:import --path=../content/catalog` (helyi DB) után `php artisan catalog:verify --track=programozas --drafts --negative` zöld (`docs/runbooks/katalogus-ellenorzes.md`).
- [ ] **Step 3: CI-lépés** a dry-run érvényesítéssel (a tartalom hibája így minden pushnál bukik); **deploy**: `rsync -az --delete content/ "$DEPLOY_PATH/content/"`, és a `catalog:import` lépés a `vars.CATALOG_IMPORT_ON_DEPLOY == 'true'` feltétellel (alapértelmezés: kikapcsolva, hogy az első deploy ne unpublikálja az admin felületen készült tartalmat; az átállás: `catalog:export` a szerveren, git-commit, majd a változó bekapcsolása).
- [ ] **Step 4: Teljes kapu helyben** (`composer lint`, `composer analyse`, frontend lint/typecheck/build, `npm run check`, `test:api`, `test:e2e`), zöld után commit: `feat: 1. lecke referenciaként, CI-érvényesítés és deploy-bekötés`.
- [ ] **Step 5: Push előtt** a szerző (te) átolvassa a lecke szövegét és a formátumot; csak utána kezdődik a 2–16. lecke.

---

## Önellenőrzés

- **Spec-lefedettség:** fájlszerkezet és formátum (Task 1); parancsok 5.1 (Task 1–3), 5.2 (Task 5), 5.3 (Task 4; a `--source=files` helyett `--drafts`, indoklással az 4. feladatban); 5.4 (lecke-`run` példák) **szándékosan kimarad**, a spec is 2. szakaszba és nem blokkolónak jelölte; frontend 6. (Task 6); tartalom-terv 7. és munkafolyamat 8. (Task 7 + `content/README.md`); tesztelés 9. (a tesztek az egyes feladatokban); hibakezelés 10. (Task 1–3: szigorú séma, tranzakció, nincs HTTP végpont); `reviewed_*` csak a fájlban (Task 5 megőrzi).
- **Eltérés a specifikációtól:** a feladat azonosítója az adatbázisban `(lesson_id, title)`, mert az `exercises` táblának nincs `slug` oszlopa, és migrációt nem adunk; a specifikáció 4. fejezetének "feladat útvonala + slug" megfogalmazását ez pontosítja. A specifikációt a megvalósítás előtt ennek megfelelően javítani kell.
- **Típus-konzisztencia:** `ContentSet/LessonNode/ExerciseNode/ImportPlan/PlanEntry/ImportSummary/ContentProblem` neve és mezői a 1–5. feladatban azonos; `StudyLanguage` a meglévő `preferences.ts`-ből jön.
- **Arányok:** a terv a spec hosszának nagyjából felét-egészét teszi ki; a kódtörzseket az implementáló írja, itt csak a szignatúrák, tesztek és rögzített értékek szerepelnek.
