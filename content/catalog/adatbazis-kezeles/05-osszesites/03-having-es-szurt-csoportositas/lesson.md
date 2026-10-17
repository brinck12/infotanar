---
slug: having-es-szurt-csoportositas
title: HAVING és szűrt csoportosítás
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Szűrés a csoportokon

A `GROUP BY` után gyakori kérdés: "csak azokat az autókat mutasd, amelyeknek legalább 3 fuvara volt". Ez a feltétel a **csoport összesített értékére** vonatkozik, nem egy-egy sorra. Ezt a `WHERE` nem tudja, mert az a csoportosítás **előtt** szűr, amikor még nincs darabszám. A csoportok szűrője a **`HAVING`**.

Az alábbi taxis tábláról lesz szó:

A `fuvar` tábla:

| `id` | `rendszam` | `indulas` | `km` | `dij` | `fizetes` | `ertekeles` |
|---|---|---|---|---|---|---|
| 1 | ABC-123 | 2025-03-02 07:45:00 | 6 | 2500 | kartya | 5 |
| 2 | DEF-456 | 2025-03-02 22:10:00 | 14 | 4900 | keszpenz | NULL |
| 3 | ABC-123 | 2025-03-09 18:30:00 | 9 | 3400 | kartya | 4 |
| 4 | ABC-123 | 2025-04-01 23:50:00 | 3 | 1600 | keszpenz | 3 |
| 5 | DEF-456 | 2025-04-03 09:05:00 | 20 | 6700 | kartya | NULL |
| 6 | GHI-789 | 2025-04-07 12:00:00 | 11 | 4000 | keszpenz | 5 |

## WHERE és HAVING különbsége

| | `WHERE` | `HAVING` |
|---|---|---|
| Mikor szűr? | a csoportosítás előtt | a csoportosítás után |
| Mit szűr? | az egyes sorokat | a csoportokat |
| Használhat összesítőt? | nem | igen |

Egy egyszerű emlékeztető: a `WHERE` a **sorok** kapuőre, a `HAVING` a **csoportoké**.

## HAVING használata

A `HAVING` közvetlenül a `GROUP BY` után áll, és a feltételében összesítő függvény szerepel:

```sql
SELECT rendszam, COUNT(*) AS darab
FROM fuvar
GROUP BY rendszam
HAVING COUNT(*) >= 3;
```

Eredmény:

| `rendszam` | `darab` |
|---|---|
| ABC-123 | 3 |

A `GROUP BY` három csoportot hozott létre. A `HAVING` csak a `COUNT(*) >= 3` feltételnek megfelelő csoportot hagyta meg, vagyis az `ABC-123`-at.

**Próbáld ki:** írd át a feltételt `>= 2`-re, és nézd meg, mi változik!

## Mindkettő egy lekérdezésben

A két szűrő jól megfér egymás mellett, mert más-más dolgot szűr. A kérdés: **csak a kártyás fuvarokat** nézve, mely autóknál éri el a bevétel a 6000 Ft-ot?

```sql
SELECT rendszam, SUM(dij) AS osszeg
FROM fuvar
WHERE fizetes = 'kartya'
GROUP BY rendszam
HAVING SUM(dij) >= 6000;
```

Eredmény:

| `rendszam` | `osszeg` |
|---|---|
| DEF-456 | 6700 |

A feldolgozás sorrendje fontos, ezt érdemes megérteni:

1. a `FROM` megadja a táblát,
2. a `WHERE` kiszűri a nem kártyás fuvarokat,
3. a `GROUP BY` rendszám szerint csoportosít,
4. a `HAVING` eldobja a 6000-nél kisebb összegű csoportokat,
5. a `SELECT` kiszámolja a kimenetet,
6. az `ORDER BY` rendez.

A leírt sorrend egyben a kódban a záradékok sorrendje is, kivéve, hogy a `SELECT` elöl áll.

## Rendezés és HAVING

Az `ORDER BY` a legvégén áll, és hivatkozhat az aliasra:

```sql
SELECT strftime('%Y-%m', indulas) AS honap,
       COUNT(*) AS darab,
       ROUND(AVG(km), 1) AS atlag_km
FROM fuvar
GROUP BY strftime('%Y-%m', indulas)
HAVING COUNT(*) >= 3
ORDER BY honap;
```

Eredmény:

| `honap` | `darab` | `atlag_km` |
|---|---|---|
| 2025-03 | 3 | 9.7 |
| 2025-04 | 3 | 11.3 |

## Átlagos érték szerinti szűrés

A `HAVING` bármilyen összesítőre feltételt tehet, például az átlagra is. A kérdés: mely autók kaptak átlagosan legalább 4-es értékelést? A `NULL` értékelések (értékeletlen fuvarok) nem számítanak bele az átlagba.

```sql
SELECT rendszam, ROUND(AVG(ertekeles), 2) AS atlag
FROM fuvar
GROUP BY rendszam
HAVING AVG(ertekeles) >= 4
ORDER BY atlag DESC, rendszam;
```

Eredmény:

| `rendszam` | `atlag` |
|---|---|
| GHI-789 | 5.0 |
| ABC-123 | 4.0 |

A `DEF-456` mindkét fuvara értékeletlen (`NULL`), ezért az átlaga is `NULL`, és a `NULL >= 4` nem igaz, így az autó kiesik. Az `ABC-123` értékelései 5, 4 és 3, az átlag pontosan 4.0, ezért bekerül. A `GHI-789` egyetlen ötöse 5.0-s átlagot ad.

## Mit írjak a HAVING-be: aliast vagy összesítőt?

A `HAVING`-ben a szabványos mód, ha az összesítő függvényt írod ki (`HAVING COUNT(*) >= 3`). Az SQLite és a MariaDB is elfogad aliast (`HAVING darab >= 3`), de más rendszerek nem, ezért a függvény megadása a biztosabb szokás.

MariaDB-ben a `HAVING` és a `GROUP BY` pontosan úgy működik, mint itt.

## Gyakori hibák

- Összesítő a `WHERE`-ben (`WHERE COUNT(*) >= 3`): hibát kapsz. Csoportra a `HAVING` kell.
- Sorra vonatkozó feltétel a `HAVING`-ben: `HAVING fizetes = 'kartya'` működhet, de lassabb és zavaros. Ami egy sort szűr, az a `WHERE`-be való.
- Rossz sorrend: `HAVING` a `GROUP BY` előtt, vagy az `ORDER BY` a `HAVING` előtt.
- `HAVING` csoportosítás nélkül: ritkán van értelme, ilyenkor az egész tábla egyetlen csoport.
- A `NULL` kezelése: az `AVG` a `NULL`-t kihagyja, és ha csak `NULL` van, az átlag `NULL`.

## Összefoglalás

- A `WHERE` a sorokat szűri a csoportosítás előtt, a `HAVING` a csoportokat utána.
- Csak a `HAVING`-ben szerepelhet összesítő függvény a feltételben.
- A záradékok sorrendje: `SELECT`, `FROM`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`.
- A két szűrő együtt is használható: előbb a sorok, aztán a csoportok szűrődnek.
- A `HAVING` feltételében érdemes magát az összesítőt kiírni.
