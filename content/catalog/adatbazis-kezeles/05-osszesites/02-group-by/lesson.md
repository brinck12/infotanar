---
slug: group-by
title: Csoportosítás (GROUP BY)
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mennyi autónként?

Az előző leckében egyetlen számot kaptál az egész táblára. Mit tegyél, ha azt akarod tudni, hogy **autónként** hány fuvar volt, vagy **hónaponként** mennyi a bevétel? Szét kell osztani a sorokat csoportokba, és csoportonként összesíteni. Ezt végzi a **`GROUP BY`**.

Ugyanazt a fuvar-táblát használjuk, mint eddig:

A `fuvar` tábla:

| `id` | `rendszam` | `indulas` | `km` | `dij` | `fizetes` | `ertekeles` |
|---|---|---|---|---|---|---|
| 1 | ABC-123 | 2025-03-02 07:45:00 | 6 | 2500 | kartya | 5 |
| 2 | DEF-456 | 2025-03-02 22:10:00 | 14 | 4900 | keszpenz | NULL |
| 3 | ABC-123 | 2025-03-09 18:30:00 | 9 | 3400 | kartya | 4 |
| 4 | ABC-123 | 2025-04-01 23:50:00 | 3 | 1600 | keszpenz | 3 |
| 5 | DEF-456 | 2025-04-03 09:05:00 | 20 | 6700 | kartya | NULL |
| 6 | GHI-789 | 2025-04-07 12:00:00 | 11 | 4000 | keszpenz | 5 |

## Hogyan működik a GROUP BY?

A `GROUP BY oszlop` azonos értékű sorokat egy csoportba teszi. Az összesítő függvények ezután **csoportonként** számolnak, minden csoportból egy eredménysor lesz.

```sql
SELECT rendszam, COUNT(*) AS darab
FROM fuvar
GROUP BY rendszam;
```

Eredmény:

| `rendszam` | `darab` |
|---|---|
| ABC-123 | 3 |
| DEF-456 | 2 |
| GHI-789 | 1 |

Három rendszám van, ezért három sor az eredmény. Az `ABC-123` csoportba három fuvar került, a `DEF-456`-ba kettő, a `GHI-789`-be egy.

Gondolj úgy rá, mint amikor egy halom jegyzetfüzetet osztályonként kupacokba rendezel, majd minden kupacnál megszámolod, hány darab van.

## Mi állhat a SELECT-ben?

Csoportosított lekérdezésben a `SELECT` után **kétféle** dolog állhat:

1. az az oszlop (vagy kifejezés), amelyik szerint csoportosítasz,
2. összesítő függvény.

Más oszlop nem, mert annak értéke egy csoporton belül sorról sorra más lehet. A `SELECT rendszam, km FROM fuvar GROUP BY rendszam` hibás elgondolás: melyik kilométer-értéket írja ki egy csoportból?

## Több összesítő egyszerre

Egy csoportosításhoz tetszőleges számú összesítőt rakhatsz:

```sql
SELECT fizetes,
       COUNT(*) AS darab,
       SUM(dij) AS osszeg,
       ROUND(AVG(km), 1) AS atlag_km
FROM fuvar
GROUP BY fizetes;
```

Eredmény:

| `fizetes` | `darab` | `osszeg` | `atlag_km` |
|---|---|---|---|
| kartya | 3 | 12600 | 11.7 |
| keszpenz | 3 | 10500 | 9.3 |

**Próbáld ki:** add meg rendszámonként a legnagyobb díjat!

## WHERE, GROUP BY és ORDER BY együtt

Az összesítés előtt a `WHERE` szűr, a csoportosítás után az `ORDER BY` rendez. A záradékok sorrendje kötött: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `ORDER BY`.

```sql
SELECT rendszam, SUM(dij) AS bevetel
FROM fuvar
WHERE km >= 5
GROUP BY rendszam
ORDER BY bevetel DESC;
```

Eredmény:

| `rendszam` | `bevetel` |
|---|---|
| DEF-456 | 11600 |
| ABC-123 | 5900 |
| GHI-789 | 4000 |

Itt előbb kiszűrtük az 5 kilométernél rövidebb fuvarokat, a maradékot csoportosítottuk, és az eredményt bevétel szerint csökkenő sorrendbe tettük.

## Csoportosítás kifejezés szerint

Nemcsak oszlop, hanem kifejezés szerint is csoportosíthatsz. Például **hónaponként**: a dátumból a `DATE_FORMAT` kiveszi az évet és a hónapot (a `'%Y-%m'` minta `2025-03` alakot ad), és ezt használjuk csoportosító értékként. A `SELECT`-ben és a `GROUP BY`-ban ugyanazt a kifejezést írd.

```sql
SELECT DATE_FORMAT(indulas, '%Y-%m') AS honap,
       COUNT(*) AS darab,
       SUM(dij) AS bevetel
FROM fuvar
GROUP BY DATE_FORMAT(indulas, '%Y-%m')
ORDER BY honap;
```

Eredmény:

| `honap` | `darab` | `bevetel` |
|---|---|---|
| 2025-03 | 3 | 10800 |
| 2025-04 | 3 | 12300 |

A hónapot külön is kinyerheted: `YEAR(indulas)` az évet, `MONTH(indulas)` a hónap sorszámát adja, és ezekre is lehet csoportosítani.

## Mi a helyzet a NULL-lal?

A `NULL` értékek a `GROUP BY` számára egy külön csoportot alkotnak. Az `ertekeles` szerint csoportosítva így a hiányzó értékelések egy sorban jelennek meg, ahol az `ertekeles` oszlop üres.

```sql
SELECT ertekeles, COUNT(*) AS darab
FROM fuvar
GROUP BY ertekeles;
```

Eredmény:

| `ertekeles` | `darab` |
|---|---|
| NULL | 2 |
| 3 | 1 |
| 4 | 1 |
| 5 | 2 |

## Gyakori hibák

- A `SELECT`-ben szerepel olyan oszlop, amely nincs a `GROUP BY`-ban és nem összesítő. Ez értelmetlen értéket ad, vagy hibát jelez (a MariaDB szigorú beállításban hibát ad). Tartsd be: csak a csoportosító oszlop és összesítők.
- A `WHERE`-be írt összesítő (`WHERE COUNT(*) > 2`): az összesített értékre a következő lecke `HAVING`-je szűr.
- Elfelejtett `GROUP BY`: a `SELECT rendszam, COUNT(*) FROM fuvar` nem csoportosít, ezért értelmetlen.
- Rossz záradék-sorrend: az `ORDER BY` a `GROUP BY` után áll, nem elé.
- Eltérő kifejezés a `SELECT`-ben és a `GROUP BY`-ban: a kettő egyezzen.

## Összefoglalás

- A `GROUP BY oszlop` csoportokba rendezi az azonos értékű sorokat, az összesítők csoportonként számolnak.
- A `SELECT` után csak a csoportosító oszlop és összesítő függvények állhatnak.
- A záradékok sorrendje: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `ORDER BY`.
- Kifejezés szerint is csoportosíthatsz, például `DATE_FORMAT(dátum, '%Y-%m')` szerint havonta.
- A `NULL` értékek közös csoportot alkotnak.
