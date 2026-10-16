# Tananyag-csővezeték és az első 16 lecke: tervezési specifikáció

Készült: 2026-10-17. Állapot: **jóváhagyásra vár** (a tervet a beszélgetésben három részben már átnézted; ez a leírt változat).
Kapcsolódó tételek: `docs/roadmap/production-readiness.md` LAUNCH-4 (import/export), LAUNCH-3 (`catalog:verify`), `docs/roadmap/next-steps-brainstorm.md`.

## 1. Cél és sikerkritérium

A zárt bétához valódi tananyag kell: a katalógusban ma 5 mintafeladat van, **üres** leckeszöveggel (`lessons.content`). Cél:

1. **16 lecke** Python és C# nyelven (a SQL-lecke SQL-ben), kb. 55 feladattal, az alapoktól (kiírás, változók) a programozási tételeken át a SQL-ig.
2. A tartalom **gitben él** (átnézhető, verziózott, tanár később külön jóváhagyhatja), és egy paranccsal kerül az adatbázisba.
3. A kódpéldák és mintamegoldások **valódi Judge0-n ellenőrzöttek** a kiadás előtt (`catalog:verify`).

Sikerkritérium: egy kezdő diák megnyit egy leckét, 5 perc alatt elolvassa, a választott nyelven megoldja a hozzá tartozó feladatokat, és az automatikus értékelés helyes választ ad.

## 2. Döntések (a beszélgetésből, megerősítve)

| Téma | Döntés |
|---|---|
| Tárgykör az első kötegben | Programozás **és** SQL (nem a teljes érettségi: táblázat, dokumentum, bemutató, web később) |
| Programozási nyelv | **Python és C# egyszerre**, lapfülekkel a leckeszövegben; feladatonként mindkét nyelven mintamegoldás |
| Szerző | Te írsz; Claude vázlatot, példát, feladatot, szerkesztést ad; tanár **később** nézi át |
| Lecketípus | Alapok: *elmélet → mintapélda → feladatok*. Gyakorló leckék: *érettségi-feladat lépésről lépésre* |
| Mennyiség | **16 lecke**, kb. 55 feladat |
| Megvalósítás | Markdown/YAML fájlok a repóban + `catalog:import`/`export`/`verify` + nyelvi lapfülek a frontenden |

## 3. Nem cél (YAGNI)

Vizuális szerkesztő, videó- vagy képfeltöltés, automatikus fordítás, tippek (`hints`) külön mezőben (nincs ilyen oszlop; a tipp a feladatleírás végére kerül), a tanári jóváhagyás adatbázis-mezője (első verzióban csak a fájl fejlécében), fájlfeladatok (táblázat, dokumentum) importja.

## 4. Fájlszerkezet

```
content/catalog/
  <track-slug>/
    _track.yml
    <modul-sorszám>-<modul-slug>/
      _module.yml
      <lecke-sorszám>-<lecke-slug>/
        lesson.md
        exercises/
          <sorszám>-<feladat-slug>.yml
```

- A **slug** a név ASCII, kisbetűs, kötőjeles változata (`alpha_dash:ascii`, mint az admin űrlapon). A mappa sorszám-előtagja (`01-`) csak rendezést segít; a **sorrendet a fejléc `position` mezője** adja, nem a mappanév.
- Egy lecke azonosítója az **útvonal** (`track/modul/lecke`; a `lessons` táblán van egyedi kulcs `(module_id, slug)`). Az `exercises` táblának **nincs slug oszlopa** (és új migrációt nem adunk), ezért egy feladat azonosítója az adatbázisban `(lesson_id, title)`: az import a feladat `title`-jéből képzett `Str::slug` értéket egyezteti (ahogy a `CatalogSeeder` is). A fájl `slug` mezője ellenőrzés: egyeznie kell a `title` slugjával. Egy feladat átnevezése tehát új feladatot jelent (a régi nem publikált lesz).

### 4.1 `_track.yml` és `_module.yml`

```yaml
# _track.yml                      # megfelel: tracks (slug, title, description, position, is_published)
slug: programozas
title: Programozás
description: Programozási alapok és tételek Python és C# nyelven.
position: 0
published: true
```

```yaml
# _module.yml                     # megfelel: modules (slug, title, description, position)
slug: alapok
title: Alapok
description: Kiírás, változók, elágazás, ciklus, lista, sztring.
position: 0
```

### 4.2 `lesson.md`

```markdown
---
slug: kiiras-es-bevitel
title: Kiírás és bevitel
position: 0
free: true            # lessons.is_free
published: false      # lessons.is_published; alapértelmezés: false
reviewed_by:          # üres, amíg tanár nem hagyta jóvá (csak a fájlban él)
reviewed_at:          # YYYY-MM-DD
---

## Mit tanulsz meg?

…szöveg (Markdown, nyers HTML nincs: a Prose escape-eli)…

```python
nev = input("Hogy hívnak? ")
print("Szia,", nev)
```
```csharp
Console.Write("Hogy hívnak? ");
var nev = Console.ReadLine();
Console.WriteLine($"Szia, {nev}");
```
```

- A törzs a `lessons.content` oszlopba kerül, **szó szerint** (a `longText` elbírja; az `engine-differences` teszt 90 000 karakterig igazolja).
- A fejléc ismeretlen kulcsára az import hibát ad (elgépelés ellen), kivéve a `reviewed_*` mezőket.

### 4.3 Feladat: `exercises/NN-<slug>.yml`

```yaml
slug: osszegzes-1
title: Egész számok összege
position: 0
kind: code                  # code | sql (a többi fajta nem része az első kötegnek)
level: kozep                # kozep | emelt   (ExerciseRequest: Rule::in)
difficulty: 1               # 1..5
published: false
allowed_languages: [python, csharp]       # sql-feladatnál: [sql]
description: |
  Olvass be egy egész számot, majd írd ki a négyzetét.
  …(Markdown; a tipp ide kerül, "Tipp:" bekezdésként)…
starter_code:
  python: |
    # ide írd a megoldást
  csharp: |
    // ide írd a megoldást
sample_solutions:
  python: |
    n = int(input())
    print(n * n)
  csharp: |
    var n = int.Parse(Console.ReadLine()!);
    Console.WriteLine(n * n);
constraints: null          # opcionális; a meglévő ValidConstraintSet szabályai
sql_order_sensitive: false # csak sql-nél
limits: { time_ms: null, memory_kb: null }   # opcionális felülírás
tests:                     # TestCase: stdin, expected_stdout, is_hidden, order
  - { stdin: "3\n", expected: "9\n", hidden: false }
  - { stdin: "-4\n", expected: "16\n", hidden: false }
  - { stdin: "0\n", expected: "0\n", hidden: true }
```

Megfeleltetés a meglévő validációhoz (`ExerciseRequest`): `starter_code.*` legfeljebb 20 000, `sample_solutions.*` legfeljebb 50 000 karakter; `allowed_languages` elemei a `config/judge0.php` nyelvei (`python`, `csharp`, `sql`) közül kerülnek ki; a `level` és `difficulty` értéktartománya megegyezik. **Az import ugyanezeket a szabályokat használja** (nem másolja): a FormRequest-szabályok kinyerhetők egy közös szabálygyűjteménybe, hogy az admin űrlap és az import ne térjen el.

## 5. Parancsok

### 5.1 `php artisan catalog:import [--dry-run] [--path=content/catalog] [--only=<track>[/<modul>[/<lecke>]]]`

1. **Beolvasás és ellenőrzés fájlonként** (YAML/Markdown fejléc parse, szabályok az 4.3 szerint). Bármely fájl hibája esetén **semmi nem íródik**; a kimenet fájl:sor szerint listázza a hibákat.
2. **Összevetés** az adatbázissal slug-útvonal szerint: *új*, *módosított* (mezőnkénti különbség), *változatlan*, *hiányzik a fájlból*.
3. `--dry-run`: csak a tervet írja ki (darabszámok és a módosuló mezők), és 0-val lép ki, ha hiba nincs.
4. **Alkalmazás egyetlen `DB::transaction`-ben**, a meglévő Actionökön át (`CreateLesson`, `UpdateLesson`, `CreateExercise`, `UpdateExercise`, `ManageCatalogItem`, `ManageTestCase`), hogy a közzétételi őrök (`ExercisePublishing::assertPublishable`, `LessonPublishing`) és az audit események (`RecordAuditEvent`) ugyanúgy lefussanak, mint az admin felületen. Ha egy feladatot `published: true` jelölnek, de nincs látható teszteset vagy mintamegoldás, a **teljes import elutasítva** (ugyanaz a magyar hibaüzenet, mint az űrlapon).
5. A tesztesetek az `order` mező szerint azonosíthatók; az import a feladat tesztjeit **a fájl sorrendjében felülírja** (a hibás/elavult teszt eltűnik).
6. **Soha nem töröl.** Ami a fájlokból eltűnik (track/modul/lecke/feladat), azt *nem publikáltra* állítja, és a végén kiírja; végleges törlés kézzel az admin felületen.
7. A kimeneti kód 0 siker, 1 hiba; a CI-ben `--dry-run`-nal is használható.

### 5.2 `php artisan catalog:export [--path=...] [--force]`

Az adatbázis jelenlegi tartalmát a 4. fejezet szerinti fájlokba írja. Első használat: **az 5 meglévő mintafeladat és az admin felületen készült tartalom átvétele**, hogy az import ne szakítson szét semmit. Meglévő fájlt csak `--force`-szal ír felül. A `reviewed_*` mező, ha nincs adatbázis-oszlop, megmarad a fájlban (az export nem írja felül, ha a fájl már létezik és a különbség csak a törzs).

### 5.3 `php artisan catalog:verify` (meglévő, bővítés)

- A kapu eddig a **publikált** feladatokat futtatta; új kapcsoló: `--drafts` a nem publikált (piszkozat) feladatokra is. Munkamenet: `catalog:import` (piszkozatként) → `catalog:verify --track=… --drafts` → `published: true` és újraimport. Külön fájl-alapú ellenőrző nincs.
- Bővítés: **minden `allowed_languages`-beli nyelvhez kell mintamegoldás**, különben hiba (ma elég egy engedélyezett nyelven).
- Új: `catalog:verify --negative`: a mintamegoldás **elrontott változata** (üres program) nem mehet át minden teszten. Ez egy tesztkészlet-gyengeség ellen véd (túl megengedő elvárt kimenet). Egyszerű: üres kód futtatása, és ha az átmegy, a feladat hibás.

### 5.4 Leckébeli kód futtatása (2. szakasz, nem blokkoló)

A leckeszövegben a ` ```python run ` és ` ```csharp run ` fenced blokk **kipróbálandó példa**: a `catalog:verify --lessons` lefuttatja, és hibával (nem nulla kilépési kód, fordítási hiba) leáll. A kimenetet nem hasonlítja; a példák helyessége a szerző felelőssége, de a futásképtelen kód kiszűrődik. A `run` jelző a megjelenítéskor eltűnik.

## 6. Frontend: nyelvi lapfülek

- Hely: `frontend/src/shared/ui/Prose.tsx` (a `codeBlocks` mód, `HighlightedBlock`).
- Szabály: egymás utáni (üres sorral elválasztott) `python` és `csharp` kódblokk (bármelyik sorrendben) **egy** `CodeTabs` komponens lesz két fülön. Más blokk változatlan marad. Három egymás után következő blokk (pl. python, csharp, sql) mind egy fülsor. A sorrend a szövegben a lapfülek sorrendje.
- Állapot: a választott nyelv a felhasználó meglévő beállításai közé kerül (`shared/domain/preferences`, vendégnek `localStorage`); az oldalon minden fülsor együtt vált, és a következő lecke is a választott nyelven nyílik.
- Hozzáférhetőség: `role="tablist"`, `aria-selected`, nyilakkal mozgatható, 44 px magas, látható fókusz; csak a design tokenek (`FRONTEND.md` 4–6. fejezet), új kártya- vagy gombstílus nélkül.
- Szerver oldalon nincs változás: a tartalom ugyanaz a Markdown, így a régi kliens is megjeleníti (két egymás utáni blokk).

## 7. A 16 lecke terve (tartalom-terv)

| # | Modul | Lecke | Feladat |
|---|---|---|---|
| 1 | alapok | Kiírás és bevitel | 3 |
| 2 | alapok | Változók, típusok, számítások | 4 |
| 3 | alapok | Elágazás (if/else) | 4 |
| 4 | alapok | Ciklusok (for, while) | 4 |
| 5 | alapok | Listák, tömbök | 4 |
| 6 | alapok | Szövegek és függvények | 4 |
| 7 | programozasi-tetelek | Összegzés tétele | 3 |
| 8 | programozasi-tetelek | Megszámlálás tétele | 3 |
| 9 | programozasi-tetelek | Maximumkiválasztás tétele | 3 |
| 10 | programozasi-tetelek | Eldöntés tétele | 3 |
| 11 | programozasi-tetelek | Kiválogatás tétele | 3 |
| 12 | adatbazis-kezeles | SELECT és oszlopok | 3 |
| 13 | adatbazis-kezeles | WHERE és rendezés | 4 |
| 14 | adatbazis-kezeles | Összesítő függvények és GROUP BY | 4 |
| 15 | adatbazis-kezeles | JOIN | 4 |
| 16 | adatbazis-kezeles | Érettségi-jellegű SQL feladat lépésről lépésre | 2 |

Összesen kb. 55 feladat. A 7–11. lecke a meglévő öt mintafeladat leckéinek (`osszegzes-tetele`, `megszamlalas-tetele`, …) slugját veszi át, így a haladás és a beadások nem vesznek el. Az 1–6. és a 12–16. lecke új. A **16. lecke** a *gyakorló* típus (egy érettségi-szerű feladat végig megoldva). A 17. és későbbi tartalom nem része ennek a specnek.

Sorrendi függőség: az 1–6. lecke után a tételek; a SQL-sáv független, de a 12. előtt nem kell programozási tudás.

## 8. Munkafolyamat (szerző és Claude)

1. Te megadod egy lecke vázlatát (célok, a fő gondolatok, 2–3 jellemző hiba).
2. Claude megírja a `lesson.md`-t és a feladatfájlokat mindkét nyelven, a fenti formátumban.
3. `catalog:import --dry-run`, majd `catalog:verify --source=files` (SSH-alagúton valódi Judge0, `docs/runbooks/katalogus-ellenorzes.md`).
4. Te végigolvasod; javítás után `published: true`, import, kiadás a `main`-en át (CI → deploy).
5. A tanár (később) a fájl `reviewed_by`/`reviewed_at` mezőjét tölti ki; ez nem látszik a diákoknak.

Minden lecke **`published: false`** indul. Publikálás tudatos, külön szerkesztés; semmi nem kerül ki véletlenül.

## 9. Tesztelés

- **API (Playwright `api` projekt):** import idempotencia (kétszeri futtatás nem változtat semmit), `--dry-run` nem ír, hibás fájl esetén nincs részleges írás, eltűnt elem csak nem publikált lesz, publikálási őr megáll mintamegoldás/látható teszt nélkül, ékezetes cím szó szerint visszajön, export→import körút azonos állapotot ad.
- **Backend egységtesztek helyett** a repó konvenciója szerint API-teszt; a `composer analyse` max szinten zöld marad (teljes típusozás, `@throws`).
- **e2e-mocked:** a `CodeTabs` renderelés, a fülváltás, a választott nyelv megmaradása, billentyűzetes kezelés, `axe` ellenőrzés a leckeoldalon.
- **Valódi Judge0 aranykészlet (REL-4):** a 16 lecke mintamegoldásai éjjel és kiadás előtt fussanak.
- **MySQL:** a `backend-mysql` CI-job az import tesztjeit is futtatja (ékezetek, hosszú szöveg, JSON oszlopok).

## 10. Hibakezelés és biztonság

- A fájlok **megbízhatatlan bemenetnek** számítanak (elgépelés, sérült YAML): szigorú séma, ismeretlen kulcs hiba, méretkorlát a törzsre (a `lessons.content` ~16 MB-os `longText` felett, gyakorlatban 200 KB-nál figyelmeztet).
- Az importot csak parancssorból lehet futtatni (nincs HTTP végpont), a szerveren a `deploy` felhasználóval. Nincs új jogosultság, nincs új admin API.
- A leckeszöveg nyers HTML-t nem hajt végre (a `Prose` escape-el), tehát a tartalom nem tud szkriptet beinjektálni.
- Titkos/rejtett teszteset **soha nem kerül a diák felé** (`HiddenResultRedactor` változatlan); a `.yml`-ben lévő rejtett tesztek a repóban vannak, a repó privát. Ha a repó valaha nyilvános lesz, a rejtett teszteket külön tárolóba kell vinni.
- Audit: az import minden módosítása a meglévő Action-ök audit eseményeit használja; plusz egy összefoglaló esemény (`catalog_imported`, darabszámokkal, PII nélkül).

## 11. Kockázatok

| Kockázat | Hatás | Kezelés |
|---|---|---|
| Hibás elvárt kimenet vagy mintamegoldás | A diákot rosszra tanítja | `catalog:verify`, kötelező mindkét nyelv, `--negative` próba, tanári átnézés később |
| A Claude által írt tartalom szakmai tévedése az érettségi követelményekről | Félrevezető tananyag | Az OH vizsgaleírása a forrás; a szerző (te) olvas, tanár később jóváhagy; `reviewed_*` mutatja, mi nincs átnézve |
| Szerzői jog (hivatalos feladatsorok) | Jogi kockázat | Csak saját, hasonló nehézségű feladatok; hivatalos szöveg nem másolható |
| Az import részleges írása | Inkonzisztens katalógus | Egy tranzakció, előzetes teljes érvényesítés |
| Két nyelv kétszeres munka | Lassú haladás | Először 1–6. lecke (a leggyakoribb beszállás), a többi folyamatosan; a C# részt lehet később pótolni, ha egy feladatnál `allowed_languages: [python]` |

## 12. Megvalósítási sorrend (a tervhez)

1. Közös szabálygyűjtemény a katalógus-validációhoz (az admin űrlap és az import is használja).
2. `catalog:export` (a meglévő 5 feladat átvételéhez), majd `catalog:import --dry-run`/éles, tesztekkel.
3. `catalog:verify` bővítések (`--source=files`, minden nyelvhez mintamegoldás, `--negative`).
4. Frontend `CodeTabs` + preferencia.
5. Tartalom: az 1. lecke mint **referencia** (teljes, mindkét nyelven), te átnézed a formátumot, ezután a többi 15.
6. (Opcionális) `run` jelölésű leckepéldák ellenőrzése.

Az 1–4. lépés kb. 4–6 munkanap egy emberre; a 5. lépés a 16 lecke írása (3–5 hét), az első 6 lecke után már indulhat a zárt béta.

## 13. Nyitott kérdések

1. A `reviewed_by`/`reviewed_at` kerüljön később adatbázis-oszlopba (admin felületen látható)? Első verzió: nem.
2. A rejtett tesztek a nyilvános repóban megengedhetők-e? Jelenleg a repó privát, ezért igen.
3. A meglévő 5 mintalecke (`osszegzes-tetele`, …) szövegét teljesen újraírjuk-e a 7–11. leckében? Terv: igen, a slug és a feladat azonosítója marad.
