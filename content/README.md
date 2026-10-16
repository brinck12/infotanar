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

A leckeszövegben a Python és C# példát **közvetlenül egymás után** álló kódblokkokként írd, a nyelvjelölő pontosan kisbetűs `python` és `csharp`. A leckeoldal ezeket egy lapfüles blokkba vonja össze, a diák a választott nyelvét látja. Más jelölővel (pl. `py`, `cs`, `c#`) a blokk nem lesz fül.

## Munkafolyamat

Minden parancs a `backend/` mappából fut.

1. `php artisan catalog:import --dry-run`: beolvas és ellenőriz, nem ír az adatbázisba (a CI is ezt futtatja minden pushnál).
2. `php artisan catalog:import`: betölti a tartalmat (a hiányzó adatot létrehozza, a változást frissíti; a `--only=<track>[/<modul>[/<lecke>]]` szűkít).
3. `php artisan catalog:verify --drafts --negative`: a mintamegoldásokat valódi Judge0-n futtatja, a `--negative` a hibás megoldásoknak a bukását is ellenőrzi.
4. Ha minden zöld és átnézted: `published: true`, majd újra `catalog:import`.

Az adatbázisban (admin felületen) készült tartalom `php artisan catalog:export` paranccsal fájlba menthető.

A 3. lépéshez Judge0 kell, ami csak a szerver localhostján érhető el: nyiss SSH-alagutat, és állítsd be a `JUDGE0_AUTH_TOKEN`-t. Részletek: [docs/runbooks/katalogus-ellenorzes.md](../docs/runbooks/katalogus-ellenorzes.md).
