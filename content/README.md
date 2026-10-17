# Tartalmi fájlok (katalógus)

A tananyag a `content/catalog/` alatt él Markdown és YAML fájlokként; a `catalog:import` parancs tölti be az adatbázisba. A szöveg magyar.

## Mappaszerkezet

```
content/catalog/
  <track>/_track.yml
  <track>/<NN>-<modul>/_module.yml
  <track>/<NN>-<modul>/<NN>-<lecke>/lesson.md
  <track>/<NN>-<modul>/<NN>-<lecke>/exercises/<NN>-<feladat>.yml
```

A mappák és fájlok elején álló szám (`01-`, `02-`) **csak a rendezést szolgálja**, az azonosítást nem. A sorrendet az adatbázisban a `position` mező adja.

## Azonosítók

- Track, modul, lecke: a `slug` mező (kisbetűs, ékezet nélkül, kötőjellel).
- Feladat: a `slug` **pontosan a `title` Str::slug-ja** kell legyen (pl. `Köszöntés kiírása` -> `koszontes-kiirasa`). A feladatot az adatbázisban a `(lecke, title)` pár azonosítja, ezért a cím átírása új feladatot hoz létre.

## Mezők

- `_track.yml`: `slug`, `title`, `description`, `position`, `published`.
- `_module.yml`: `slug`, `title`, `description`, `position`.
- `lesson.md`: YAML fejléc (`slug`, `title`, `position`, `free`, `published`, `reviewed_by`, `reviewed_at`), alatta a lecke szövege Markdownban.
- Feladat (`*.yml`): `slug`, `title`, `position`, `kind: code`, `level` (`kozep`), `difficulty` (1..), `published`, `allowed_languages` (`python`, `csharp`), `description` (Markdown), `starter_code` és `sample_solutions` nyelvenként, `tests`.
- `published`: alapértelmezés szerint `false`. Új tartalom mindig nem publikusként készül, a szerző átnézése után kapcsolható `true`-ra.
- `reviewed_by` / `reviewed_at`: ki és mikor nézte át a leckét; csak a fájlban élnek, az adatbázisba nem kerülnek (a `catalog:export` megőrzi).

## Tesztek (`tests`)

Egy lista, elemei: `{ stdin: "...", expected: "...", hidden: true|false }`. A `hidden: false` esetek látszanak a diáknak a futtatáskor, a `hidden: true` esetek csak beküldéskor futnak, és az eredményükből semmi sem látszik. A bemenet és az elvárt kimenet végén legyen sortörés (`\n`), hacsak nem szándékosan ezt teszteled.

A feladat leírásába a segítséget záró `Tipp:` bekezdésként írd.

## Kódblokkok és nyelvi fülek

A leckeszövegben a Python és C# példát **közvetlenül egymás után** álló kódblokkokként írd, a nyelvjelölő pontosan kisbetűs `python` és `csharp`. A leckeoldal ezeket egy lapfüles blokkba vonja össze, a diák a választott nyelvét látja. C# feladatban a kód **teljes program** legyen (`using System;`, `class Program`, `static void Main()`), mert a Judge0 Mono fordítóval fordít: nincs top-level utasítás és nincs `!` (null-forgiving), C# 7 szintaxist használj.

Más jelölővel (pl. `py`, `cs`, `c#`) a blokk nem lesz fül.

### Nyelvfüggő szövegrészek

Ha a lecke magyarázata is nyelvenként más, zárd a részt egy `::: python` vagy `::: csharp` sorba és egy `:::` sorba (a jelölők külön bekezdések, előttük és utánuk üres sor kell):

```
::: python

A kiírást a `print` végzi.

:::
```

A leckeoldal tetején nyelvválasztó jelenik meg, és csak a választott nyelv részei látszanak. A jelölőkön kívüli szöveg mindenkinek szól. A szekción belül egyetlen nyelvű kódblokk áll, ezért ott nem lesz lapfül. Minden nyitó jelölőnek legyen záró párja, különben a jelölő szövegként látszik.

A tesztekben szereplő ékezetes szöveget mindig ellenőrizd valódi Judge0-n (`catalog:verify --drafts --negative`): a Mono `Console` kódolása a konténer nyelvi beállításától (locale) függ, ezért C#-ban az ékezetes kimenet a helyi futtatástól eltérhet.

## Munkafolyamat

Minden parancs a `backend/` mappából fut.

1. `php artisan catalog:import --dry-run`: beolvas és ellenőriz, nem ír az adatbázisba (a CI is ezt futtatja minden pushnál). Ellenőrzi a mezőket, a nyelveket, a `constraints` szabályait (ugyanazzal a logikával, mint az admin űrlap), és azt, hogy az `sql` fajtájú feladat egyetlen nyelve az `sql` (és a csak `sql` nyelvű feladat fajtája `sql`).
2. `php artisan catalog:import`: betölti a tartalmat (a hiányzó adatot létrehozza, a változást frissíti; a `--only=<track>[/<modul>[/<lecke>]]` szűkít).
3. `php artisan catalog:verify --drafts --negative`: a mintamegoldásokat valódi Judge0-n futtatja, a `--negative` a hibás megoldásoknak a bukását is ellenőrzi.
4. Ha minden zöld és átnézted: `published: true`, majd újra `catalog:import`.

Az adatbázisban (admin felületen) készült tartalom `php artisan catalog:export` paranccsal fájlba menthető.

A 3. lépéshez Judge0 kell, ami csak a szerver localhostján érhető el: nyiss SSH-alagutat, és állítsd be a `JUDGE0_AUTH_TOKEN`-t. Részletek: [docs/runbooks/katalogus-ellenorzes.md](../docs/runbooks/katalogus-ellenorzes.md).

## Éles import a deploykor

A deploy csak a `CATALOG_IMPORT_ON_DEPLOY=true` repó-változóval importál (alapból ki van kapcsolva). Az éles importhoz kell egy létező admin felhasználó (`php artisan user:role <email> admin`). Az import a deploy végén fut, a cache-ek újraépítése és a queue újraindítása után: ha elbukik, a deploy hibás, **de az új kód már él**. Javítsd a tartalmat, majd futtasd kézzel a szerveren: `php artisan catalog:import`.
