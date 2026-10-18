---
slug: osszesito-fuggvenyek
title: Összesítő függvények
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Sorokból egyetlen szám

Eddig a lekérdezések minden tábla-sorból egy eredménysort adtak. Gyakran viszont nem a sorokra vagyunk kíváncsiak, hanem az egészre: hány fuvar volt, mennyi a bevétel, mekkora a leghosszabb út? Erre valók az **összesítő (aggregáló) függvények**. Több sorból egyetlen értéket számolnak.

Az öt alapvető függvény:

| Függvény | Mit ad |
|---|---|
| `COUNT` | a sorok (értékek) darabszámát |
| `SUM` | az értékek összegét |
| `AVG` | az értékek átlagát |
| `MIN` | a legkisebb értéket |
| `MAX` | a legnagyobb értéket |

A lecke példáihoz a taxi fuvarait tartalmazó táblát használjuk:

A `fuvar` tábla:

| `id` | `rendszam` | `indulas` | `km` | `dij` | `fizetes` | `ertekeles` |
|---|---|---|---|---|---|---|
| 1 | ABC-123 | 2025-03-02 07:45:00 | 6 | 2500 | kartya | 5 |
| 2 | DEF-456 | 2025-03-02 22:10:00 | 14 | 4900 | keszpenz | NULL |
| 3 | ABC-123 | 2025-03-09 18:30:00 | 9 | 3400 | kartya | 4 |
| 4 | ABC-123 | 2025-04-01 23:50:00 | 3 | 1600 | keszpenz | 3 |
| 5 | DEF-456 | 2025-04-03 09:05:00 | 20 | 6700 | kartya | NULL |
| 6 | GHI-789 | 2025-04-07 12:00:00 | 11 | 4000 | keszpenz | 5 |

## COUNT: darabszám

A `COUNT(*)` a tábla sorainak számát adja:

```sql
SELECT COUNT(*) AS darab
FROM fuvar;
```

Eredmény:

| `darab` |
|---|
| 6 |

Az eredmény egyetlen sor, egyetlen oszloppal. A `*` itt azt jelenti: "minden sor".

## SUM és AVG: összeg és átlag

A `SUM(oszlop)` összead, az `AVG(oszlop)` átlagot számol:

```sql
SELECT SUM(dij) AS osszesen, AVG(km) AS atlag_km
FROM fuvar;
```

Eredmény:

| `osszesen` | `atlag_km` |
|---|---|
| 23100 | 10.5 |

Az átlag általában tizedes tört. Kerekítsd a `ROUND`-dal: a függvényt az összesítő köré kell írni, `ROUND(AVG(km), 2)`.

```sql
SELECT ROUND(AVG(km), 2) AS atlag_km
FROM fuvar;
```

Eredmény:

| `atlag_km` |
|---|
| 10.5 |

## MIN és MAX

A `MIN` és a `MAX` a legkisebb és a legnagyobb értéket adja. Szövegre és dátumra is működnek (betűrend, illetve időrend szerint):

```sql
SELECT MIN(km) AS legrovidebb, MAX(km) AS leghosszabb, MIN(indulas) AS elso_fuvar
FROM fuvar;
```

Eredmény:

| `legrovidebb` | `leghosszabb` | `elso_fuvar` |
|---|---|---|
| 3 | 20 | 2025-03-02 07:45:00 |

Az összesítők eredményével számolni is lehet, például a különbség: `MAX(km) - MIN(km)`.

**Próbáld ki:** add meg a legnagyobb díjat és a legkisebb díjat egy lekérdezésben!

## Szűrés összesítés előtt

A `WHERE` szokás szerint előbb szűr, az összesítő függvény csak a megmaradt sorokból számol. Így kapod meg például csak a kártyás fuvarok összegét:

```sql
SELECT COUNT(*) AS darab, SUM(dij) AS osszeg
FROM fuvar
WHERE fizetes = 'kartya';
```

Eredmény:

| `darab` | `osszeg` |
|---|---|
| 3 | 12600 |

## A NULL és az összesítők

A `NULL` azt jelenti: nincs érték. A fuvar táblában az `ertekeles` hiányzik, ha az utas nem értékelt. Az összesítő függvények a `NULL` értékeket **kihagyják**. Kivétel a `COUNT(*)`, amely a sorokat számolja:

```sql
SELECT COUNT(*) AS osszes,
       COUNT(ertekeles) AS ertekelt,
       ROUND(AVG(ertekeles), 2) AS atlag
FROM fuvar;
```

Eredmény:

| `osszes` | `ertekelt` | `atlag` |
|---|---|---|
| 6 | 4 | 4.25 |

Hat fuvar van, de csak négy értékelt, és az átlagot is csak ebből a négyből számolja: (5 + 4 + 3 + 5) / 4. Ha a `NULL`-okat nullának számolná, az átlag kisebb lenne.

Ha egyetlen sor sem felel meg a szűrésnek, a `COUNT` 0-t ad, a `SUM`, `AVG`, `MIN`, `MAX` viszont `NULL`-t.

## Egyszerre sok mindent

Egy `SELECT`-ben több összesítő is állhat, de **sima oszlopot nem keverhetsz hozzájuk**. A `SELECT rendszam, COUNT(*) FROM fuvar` hibás gondolat lenne: a `COUNT` egy számot ad, a `rendszam` viszont minden sorban más. Ennek a problémának a megoldása a következő lecke témája, a `GROUP BY`.

MariaDB-ben ugyanezek a függvények ugyanígy működnek (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `ROUND`).

## Gyakori hibák

- `COUNT(*)` és `COUNT(oszlop)` összekeverése: az előbbi a sorokat, az utóbbi a nem `NULL` értékeket számolja.
- Sima oszlop és összesítő keverése csoportosítás nélkül.
- Összesítő függvény a `WHERE`-ben: a `WHERE SUM(dij) > 100` hibás. Az összesített értékre később a `HAVING` szűr.
- Kerekítés rossz helyen: `AVG(ROUND(km, 2))` nem ugyanaz, mint `ROUND(AVG(km), 2)`. Előbb átlagolj, aztán kerekíts.
- Az `AVG` egészekre is tizedest adhat (`10.0`), ez normális.

## Összefoglalás

- Az összesítő függvények több sorból egyetlen értéket számolnak: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`.
- A `COUNT(*)` a sorokat számolja, a `COUNT(oszlop)` a nem `NULL` értékeket.
- A `NULL`-okat az összesítők kihagyják.
- A `WHERE` az összesítés előtt szűr.
- A `ROUND(AVG(...), 2)` kerekíti az átlagot.
