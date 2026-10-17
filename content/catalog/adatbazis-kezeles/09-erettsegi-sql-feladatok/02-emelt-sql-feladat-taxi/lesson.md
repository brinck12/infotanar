---
slug: emelt-sql-feladat-taxi
title: Emelt szintű SQL-feladat, taxitársaság
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az emelt feladat felépítése

Az emelt szintű érettségi adatbázis-feladata egy kész adatbázissal kezdődik: betöltöd, majd **7–9 részfeladatot** oldasz meg, mindegyik egy lekérdezés. A részfeladatok számozása az első, importálós feladat után `2.`-től indul. A kérdések típusai ismétlődnek, ezért érdemes felismerni őket. A 2026-os emelt feladat például egy taxitársaság adatbázisán futott: nyelvtudás és engedély szerinti szűrés, összesítés a fuvarokon, egyedi nevek, intervallumok, rendszámok `LIKE`-kal, sofőrönkénti bevétel, napi összegek minimuma, százalék és feltételes számlálás.

Ebben a leckében hasonló, **saját** taxis adatbázison gyakorolod ugyanezt a nyolc típust. A feladatok nem az érettségi szövegei, de ugyanolyan jellegűek.

## Az adatbázis

A `sofor` tábla: `id`, `nev`, `szuletes`, `angol` (0/1), `nemet` (0/1), `engedely_ev`. A `fuvar` tábla: `id`, `sofor_id`, `rendszam`, `datum`, `km`, `ar`, `fizetes` (`kartya` vagy `keszpenz`). A `fuvar.sofor_id` a `sofor.id`-ra mutat, ezért a két tábla `JOIN`-nal kapcsolható. Minden teszteset ugyanezt a szerkezetet használja, de **más adatokkal**.

## A nyolc típus és a recept hozzájuk

### Szűrés logikai oszlopokkal

0/1 értékű oszlopokra (`angol = 1`) és számokra (`engedely_ev < 2010`) összetett feltételt `AND`/`OR`-ral építesz. Ha mindkét feltételnek teljesülnie kell, `AND`.

### Összesítés több oszloppal

Egyetlen `SELECT` több összesítést is tartalmazhat, mindegyiknek adj nevet:

```sql
SELECT COUNT(*) AS fuvarok, SUM(km) AS osszkm
FROM fuvar;
```

### DISTINCT összekapcsolt táblán

Ha egy sofőrnek több megfelelő fuvara van, a `JOIN` után a neve többször szerepelne. A `DISTINCT` minden nevet egyszer ad vissza:

```sql
SELECT DISTINCT sofor.nev
FROM sofor INNER JOIN fuvar ON fuvar.sofor_id = sofor.id
WHERE fuvar.fizetes = 'kartya';
```

### BETWEEN

A `BETWEEN a AND b` mindkét határt beleérti, és szövegként tárolt dátumra is működik (`'2026-03-03'`), mert az ÉÉÉÉ-HH-NN alak ábécérendben is időrend.

### LIKE minta

Az `_` pontosan egy tetszőleges karaktert, a `%` bármennyit (akár nullát) helyettesít. A `KM_-2%` mintára illik `KMB-217`, de nem illik `KMB-317` és `ABC-217`.

### JOIN, GROUP BY és ORDER BY együtt

A "sofőrönként" kérdés csoportosítás a **sofőr** szerint:

```sql
SELECT sofor.nev, SUM(fuvar.ar) AS bevetel
FROM sofor INNER JOIN fuvar ON fuvar.sofor_id = sofor.id
GROUP BY sofor.id, sofor.nev
ORDER BY bevetel DESC, sofor.nev;
```

Az `ORDER BY` használhatja a `SELECT`-ben megadott `bevetel` aliast. A második rendezési kulcs (név) az egyenlő bevételű sofőrök sorrendjét teszi egyértelművé.

### Származtatott tábla: napi összegek minimuma

A "legkisebb napi bevétel" két lépés: előbb a napi összegek, utána ezek minimuma.

```sql
SELECT MIN(napi) AS legkisebb
FROM (SELECT datum, SUM(ar) AS napi
      FROM fuvar
      GROUP BY datum) AS n;
```

### Százalék és feltételes számlálás

A feltételes számláláshoz a `CASE` kifejezés kell: `SUM(CASE WHEN fizetes = 'kartya' THEN 1 ELSE 0 END)` annyit ad, ahány sorra a feltétel igaz. A `/` osztás a MariaDB-ben tört eredményt ad (`3 / 8` értéke `0.375`), így a százalék egyszerűen `100 * rész / összes`. Példa: 8 fuvarból 3 kártyás, ez `100 * 3 / 8 = 37.5`, a `ROUND` kerekítése 38:

```sql
SELECT SUM(CASE WHEN fizetes = 'kartya' THEN 1 ELSE 0 END) AS kartyas,
       ROUND(100 * SUM(CASE WHEN fizetes = 'kartya' THEN 1 ELSE 0 END) / COUNT(*)) AS szazalek
FROM fuvar;
```

Az eredmény a példa 8 fuvarjára:

| kartyas | szazalek |
|---|---|
| 3 | 38 |

## Hogyan lásd át a feladatot?

1. Olvasd el a **teljes szöveget**, és aláhúzva keresd az oszlopneveket, a határokat és a rendezést.
2. Döntsd el, kell-e `JOIN` (két tábla adata) és kell-e csoportosítás ("-onként", "összesen").
3. Írd meg a lekérdezés vázát: `FROM`, `WHERE`, `SELECT`, `GROUP BY`, `ORDER BY` sorrendben.
4. Ellenőrizd a **határértékeket** és az **oszlopnevek helyességét**.

## MariaDB eltérések

Az érettségin is MariaDB-t használsz, a fenti lekérdezések változtatás nélkül megfelelnek. Hasznos MariaDB-függvények: az összefűzés `CONCAT(...)`, a dátum részei `YEAR(datum)`, `MONTH(datum)`, `DAY(datum)`, a feltétel `IF(feltétel, igen, nem)`, a kerekítés `ROUND(érték, tizedesek)`.

## Gyakori hibák

- **Kerekítés elhagyása:** a `/` tört eredményt ad (`3 / 8` értéke `0.375`). Ha a feladat egész százalékot kér, tedd a kifejezést a `ROUND(...)` függvénybe.
- **DISTINCT hiánya:** `JOIN` után ugyanaz a név többször jelenik meg.
- **Rossz `GROUP BY`:** csak az összesítetlen oszlopokat sorold fel a `SELECT` listából.
- **Határnap kihagyása:** a `BETWEEN` a határokat is beleérti, a `<`/`>` nem.
- **Ugyanaz az alias kétszer:** két oszlopnak ne legyen azonos neve.
- **Rossz oszlopsorrend:** a kért sorrendet kövesd; "fuvarok, osszkm, bevetel" nem cserélhető fel.

## Összefoglalás

- Az emelt feladat 8 típusa: szűrés, összesítés, `DISTINCT`, `BETWEEN`, `LIKE`, `JOIN`+`GROUP BY`+`ORDER BY`, származtatott tábla, százalék `CASE`-zel.
- A százalék: `ROUND(100 * rész / összes)`; a `/` tört eredményt ad.
- A "legkisebb napi összeg" típushoz allekérdezés kell a `FROM`-ban.
- Mindig a kért oszlopnevekkel és sorrenddel dolgozz.
