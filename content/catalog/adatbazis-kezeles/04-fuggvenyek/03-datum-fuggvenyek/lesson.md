---
slug: datum-fuggvenyek
title: Dátumfüggvények
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Hogyan tárolja az adatbázis a dátumot?

Az érettségi feladatokban sokszor kell például az évet kinyerni egy dátumból, vagy megnézni, hogy egy fuvar este indult-e. Ehhez tudni kell, hogyan néz ki egy dátum az adatbázisban.

Az SQLite-nak nincs külön dátumtípusa. A dátumot **szövegként** tároljuk, **ISO formátumban**: `ÉÉÉÉ-HH-NN`, az időponttal együtt `ÉÉÉÉ-HH-NN ÓÓ:PP:MM`, például `2008-05-14` vagy `2025-03-02 22:10:00`. A mezők mindig azonos hosszúak, a hónap és a nap két jegyű (`05`, nem `5`).

Ebben a leckében ezt a két táblát használjuk:

A `tanulo` tábla:

| `id` | `nev` | `szuletes` |
|---|---|---|
| 1 | Kiss Anna | 2008-05-14 |
| 2 | Nagy Bela | 2009-11-02 |
| 3 | Toth Csaba | 2008-12-30 |

A `fuvar` tábla:

| `id` | `rendszam` | `indulas` | `km` | `dij` | `fizetes` | `ertekeles` |
|---|---|---|---|---|---|---|
| 1 | ABC-123 | 2025-03-02 07:45:00 | 6 | 2500 | kartya | 5 |
| 2 | DEF-456 | 2025-03-02 22:10:00 | 14 | 4900 | keszpenz | NULL |
| 3 | ABC-123 | 2025-03-09 18:30:00 | 9 | 3400 | kartya | 4 |
| 4 | ABC-123 | 2025-04-01 23:50:00 | 3 | 1600 | keszpenz | 3 |
| 5 | DEF-456 | 2025-04-03 09:05:00 | 20 | 6700 | kartya | NULL |
| 6 | GHI-789 | 2025-04-07 12:00:00 | 11 | 4000 | keszpenz | 5 |

## Egy érdekes tulajdonság: a szöveg időrendben is rendezett

Az ISO formátum előnye, hogy a betűrend egyezik az időrenddel. Ezért dátumokat egyszerűen összehasonlíthatsz szövegként, függvény nélkül:

```sql
SELECT nev, szuletes
FROM tanulo
WHERE szuletes >= '2009-01-01';
```

Eredmény:

| `nev` | `szuletes` |
|---|---|
| Nagy Bela | 2009-11-02 |

Az `ORDER BY szuletes` is időrendbe rakja a sorokat.

## strftime: az év, hónap, nap kinyerése

Ha az évre, hónapra vagy napra van szükség külön, a `strftime(formátum, dátum)` függvény kell. A formátum megmondja, melyik részt kéred:

| Kód | Jelentés | Példa (`2025-03-02 22:10:00`) |
|---|---|---|
| `%Y` | év, négy jegy | `2025` |
| `%m` | hónap, két jegy | `03` |
| `%d` | nap, két jegy | `02` |
| `%H` | óra (00-23) | `22` |
| `%M` | perc | `10` |
| `%S` | másodperc | `00` |

```sql
SELECT nev,
  strftime('%Y', szuletes) AS ev,
  strftime('%m', szuletes) AS honap,
  strftime('%d', szuletes) AS nap
FROM tanulo;
```

Eredmény:

| `nev` | `ev` | `honap` | `nap` |
|---|---|---|---|
| Kiss Anna | 2008 | 05 | 14 |
| Nagy Bela | 2009 | 11 | 02 |
| Toth Csaba | 2008 | 12 | 30 |

A `strftime` mindig **szöveget** ad, ezért a hónap `05` marad, és `03` nem egyenlő 3-mal. Számként kezelni a `CAST(... AS INTEGER)`-rel tudod:

```sql
SELECT nev,
  CAST(strftime('%Y', szuletes) AS INTEGER) AS ev,
  CAST(strftime('%m', szuletes) AS INTEGER) AS honap
FROM tanulo;
```

Eredmény:

| `nev` | `ev` | `honap` |
|---|---|---|
| Kiss Anna | 2008 | 5 |
| Nagy Bela | 2009 | 11 |
| Toth Csaba | 2008 | 12 |

**Próbáld ki:** írd ki a tanulók születési napját (a hónap napját) egész számként!

## Szűrés dátumrész szerint

A kinyert részt a `WHERE` feltételben is használhatod. Itt döntsd el, szövegként vagy számként hasonlítasz. Ha szövegként: a hónap kétjegyű, tehát `'05'`. Ha számként, `CAST` kell.

```sql
SELECT nev, szuletes
FROM tanulo
WHERE strftime('%m', szuletes) = '05';
```

Eredmény:

| `nev` | `szuletes` |
|---|---|
| Kiss Anna | 2008-05-14 |

Az óra kinyerésénél ugyanez a módszer. Itt azokat a fuvarokat keressük, amelyek este 8 óra vagy később indultak:

```sql
SELECT id, rendszam, indulas
FROM fuvar
WHERE CAST(strftime('%H', indulas) AS INTEGER) >= 20;
```

Eredmény:

| `id` | `rendszam` | `indulas` |
|---|---|---|
| 2 | DEF-456 | 2025-03-02 22:10:00 |
| 4 | ABC-123 | 2025-04-01 23:50:00 |

## Számolás a dátumrészekkel

A kinyert év számként már számolható. Például az életkor (egyszerűen az évszámok különbsége):

```sql
SELECT nev, 2025 - CAST(strftime('%Y', szuletes) AS INTEGER) AS kor
FROM tanulo;
```

Eredmény:

| `nev` | `kor` |
|---|---|
| Kiss Anna | 17 |
| Nagy Bela | 16 |
| Toth Csaba | 17 |

Ez a számítás az érettségi feladatokban többnyire elég pontos, de vedd észre, hogy nem veszi figyelembe a hónapot és a napot.

## A MariaDB megfelelői

Az érettségi MariaDB-jében a dátum valódi dátumtípus, és külön függvények vannak a részeire. Ugyanazt a feladatot egyszerűbben, rövidebben írod:

| Mit kérsz | SQLite (itt) | MariaDB (érettségi) |
|---|---|---|
| Év | `CAST(strftime('%Y', d) AS INTEGER)` | `YEAR(d)` |
| Hónap | `CAST(strftime('%m', d) AS INTEGER)` | `MONTH(d)` |
| Nap | `CAST(strftime('%d', d) AS INTEGER)` | `DAY(d)` |
| Óra | `CAST(strftime('%H', d) AS INTEGER)` | `HOUR(d)` |
| Perc | `CAST(strftime('%M', d) AS INTEGER)` | `MINUTE(d)` |
| Formázott dátum | `strftime('%Y-%m', d)` | `DATE_FORMAT(d, '%Y-%m')` |
| Mai dátum és idő | `datetime('now')` | `NOW()` |

A MariaDB `YEAR`, `MONTH`, `DAY` függvényei számot adnak, ezért ott nincs szükség `CAST`-ra. A mai dátumot adó függvények eredménye minden futtatáskor más, ezért az automatikusan ellenőrzött feladatokban nem szerepelnek.

## Gyakori hibák

- A hónap összehasonlítása számmal szöveghez: a `strftime('%m', d) = 5` nem találja meg a `'05'`-öt, mert a szöveg nem szám. Írj `'05'`-öt, vagy használj `CAST`-ot.
- Az ISO formátumtól eltérő dátum (`2025.3.2.`, `3/2/2025`): a `strftime` ezeket nem érti, és `NULL`-t ad.
- A `%m` (hónap) és `%M` (perc) nem ugyanaz: a nagybetű és a kisbetű különbözik.
- A `MariaDB` függvények (`YEAR`, `HOUR`) az SQLite-ban nem működnek, a futtatott feladatokban a `strftime`-ot használd.

## Összefoglalás

- A dátum ISO szövegként tárolódik, a betűrend időrend is.
- Egyszerű összehasonlításhoz elég a szöveges összehasonlítás: `szuletes >= '2009-01-01'`.
- A részeit a `strftime(formátum, dátum)` adja, szövegként: `%Y` év, `%m` hónap, `%d` nap, `%H` óra.
- Számolni `CAST(... AS INTEGER)` után lehet.
- MariaDB-ben: `YEAR`, `MONTH`, `DAY`, `HOUR`, `DATE_FORMAT`, `NOW`.
