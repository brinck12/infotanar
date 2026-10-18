---
slug: tobb-tablas-lekerdezesek
title: Többtáblás lekérdezések
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Három tábla, egy lekérdezés

Az előző leckében két táblát kapcsoltál össze. Az érettségi feladatokban gyakran három vagy négy tábla szerepel. A recept ugyanaz: minden újabb táblához **egy újabb `JOIN ... ON ...` sor**. Ebben a leckében az iskolai adatbázist használjuk, amelyben a jegyek külön táblában vannak:

A `osztaly` tábla:

| `id` | `nev` | `terem` |
|---|---|---|
| 1 | 10.A | 101 |
| 2 | 10.B | 102 |

A `diak` tábla:

| `id` | `nev` | `osztaly_id` |
|---|---|---|
| 1 | Kiss Anna | 1 |
| 2 | Nagy Bela | 2 |
| 3 | Toth Csaba | 1 |

A `targy` tábla:

| `id` | `nev` |
|---|---|
| 1 | matematika |
| 2 | informatika |

A `jegy` tábla:

| `id` | `diak_id` | `targy_id` | `jegy` |
|---|---|---|---|
| 1 | 1 | 1 | 5 |
| 2 | 1 | 2 | 4 |
| 3 | 2 | 2 | 3 |
| 4 | 3 | 1 | 2 |
| 5 | 3 | 2 | 5 |

Az elsődleges és idegen kulcsok kapcsolata:

| Idegen kulcs | Mutat |
|---|---|
| `diak.osztaly_id` | `osztaly.id` |
| `jegy.diak_id` | `diak.id` |
| `jegy.targy_id` | `targy.id` |

A `jegy` tábla a "köztes" tábla: két másik táblára mutat, ezért kényelmes kiindulópont.

## Három tábla összekapcsolása

A cél: "ki milyen tantárgyból milyen jegyet kapott?" A diák nevét a `diak` tábla, a tantárgy nevét a `targy` tábla, a jegy értékét a `jegy` tábla tárolja.

```sql
SELECT diak.nev AS diak, targy.nev AS targy, jegy.jegy AS jegy
FROM jegy
INNER JOIN diak ON jegy.diak_id = diak.id
INNER JOIN targy ON jegy.targy_id = targy.id;
```

Eredmény:

| `diak` | `targy` | `jegy` |
|---|---|---|
| Kiss Anna | matematika | 5 |
| Kiss Anna | informatika | 4 |
| Nagy Bela | informatika | 3 |
| Toth Csaba | matematika | 2 |
| Toth Csaba | informatika | 5 |

Olvasd soronként: a `jegy` tábla sorait kapcsoljuk a diákhoz, azután a tantárgyhoz. Mindegyik `ON` más kulcspárt köt össze.

## Aliasok a táblákra

A táblanevek hosszúak, ezért a táblákra is adhatsz rövid aliast. A tábla neve után szóközzel írod, `AS` nélkül is elfogadott. Az alias bevezetése után **csak azt** használd a lekérdezésben:

```sql
SELECT d.nev AS diak, t.nev AS targy, j.jegy AS jegy
FROM jegy j
INNER JOIN diak d ON j.diak_id = d.id
INNER JOIN targy t ON j.targy_id = t.id
WHERE t.nev = 'informatika';
```

Eredmény:

| `diak` | `targy` | `jegy` |
|---|---|---|
| Kiss Anna | informatika | 4 |
| Nagy Bela | informatika | 3 |
| Toth Csaba | informatika | 5 |

A `WHERE` itt a `targy` tábla `nev` oszlopára szűr, így csak az informatikajegyek maradtak. Az aliasokat érdemes beszédesre választani (`d` diákra, `t` tantárgyra, `j` jegyre).

**Próbáld ki:** módosítsd úgy, hogy a matematikajegyeket mutassa!

## JOIN, GROUP BY és összesítés együtt

Az igazán hasznos lekérdezések összekapcsolnak, csoportosítanak és összesítenek. Az osztályonkénti átlag kiszámításához az `osztaly`, a `diak` és a `jegy` kell:

```sql
SELECT o.nev AS osztaly, ROUND(AVG(j.jegy), 2) AS atlag
FROM osztaly o
INNER JOIN diak d ON d.osztaly_id = o.id
INNER JOIN jegy j ON j.diak_id = d.id
GROUP BY o.nev;
```

Eredmény:

| `osztaly` | `atlag` |
|---|---|
| 10.A | 4.0 |
| 10.B | 3.0 |

A feldolgozási sorrend: előbb a `JOIN`-ok összekapcsolják a három táblát, a `WHERE` (ha van) szűr, aztán a `GROUP BY` csoportosít, a `HAVING` szűri a csoportokat, végül a `SELECT` kiszámolja az oszlopokat. A tanulságot jegyezd meg: a csoportosítás az **összekapcsolt** sorokon dolgozik.

## Diákonkénti összesítés

Ha diákonként akarsz összesíteni, csoportosíts az azonosító szerint is, mert két diáknak lehet azonos neve:

```sql
SELECT d.nev AS diak, COUNT(*) AS jegyek_szama, ROUND(AVG(j.jegy), 2) AS atlag
FROM diak d
INNER JOIN jegy j ON j.diak_id = d.id
GROUP BY d.id, d.nev;
```

Eredmény:

| `diak` | `jegyek_szama` | `atlag` |
|---|---|---|
| Kiss Anna | 2 | 4.5 |
| Nagy Bela | 1 | 3.0 |
| Toth Csaba | 2 | 3.5 |

A `GROUP BY d.id, d.nev` két oszlop szerint csoportosít. Az azonosító gondoskodik arról, hogy az azonos nevű diákok külön csoportot kapjanak, a név pedig azért kerül mellé, hogy a `SELECT`-ben is szerepelhessen.

## Hogyan építs fel egy többtáblás lekérdezést?

Egy kidolgozott lépéssor, amely az érettségin is segít:

1. Írd le, **milyen oszlopokat** kérnek, és melyik táblában vannak.
2. Válaszd ki a **kiindulási táblát** (általában a legtöbb kapcsolattal rendelkezőt), és kapcsold hozzá egyenként a többit.
3. Minden `JOIN`-nál ellenőrizd az `ON` feltételt: idegen kulcs = a másik tábla kulcsa.
4. Add hozzá a `WHERE` feltételeket.
5. Ha összesítés kell, jöhet a `GROUP BY` és a `HAVING`.
6. Futtasd, és gondold át, hogy az eredmény sorainak száma észszerű-e.

MariaDB-ben mindez változtatás nélkül működik, a `JOIN`-ok, az aliasok és a `GROUP BY` ugyanúgy viselkednek.

## Gyakori hibák

- Az alias bevezetése után a teljes táblanév használata (`jegy.diak_id`, miközben `jegy j`): hibát kapsz, csak az alias érvényes.
- Rossz `ON` feltétel (például `j.targy_id = d.id`): a sorok értelmetlenül párosodnak, vagy üres lesz az eredmény.
- Csoportosítás csak névre: két azonos nevű diák összeolvad.
- Szűrés a rossz táblában: a `WHERE t.nev = 'informatika'` a tantárgy nevét szűri, nem a diákét.
- Elfelejtett `JOIN` valamelyik táblához, miközben az oszlopára hivatkozol.

## Összefoglalás

- Több tábla összekapcsolásához minden további táblához egy újabb `INNER JOIN ... ON ...` kell.
- A táblákra aliast adhatsz (`jegy j`), onnantól az aliast használd.
- A csoportosítás az összekapcsolt sorokon dolgozik: `JOIN`, `WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`.
- Azonos nevű rekordokat az azonosító szerinti csoportosítás is szétválaszt.
- Mindig a kulcsokat kösd össze: idegen kulcs = a másik tábla kulcsa.
