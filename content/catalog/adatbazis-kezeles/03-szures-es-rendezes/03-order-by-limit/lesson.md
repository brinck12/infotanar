---
slug: order-by-limit
title: ORDER BY, LIMIT és a NULL
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## A sorok sorrendje

A lekérdezés eredményének sorrendje magától nem garantált: az adatbázis olyan sorrendben adja a sorokat, ahogy éppen megtalálja. Ha sorrendre van szükség (ranglista, névsor), azt külön kérni kell az `ORDER BY` záradékkal ("rendezd ... szerint").

A példákban ez a `diak` tábla szerepel:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Csilla | 10.A | 51 |
| 2 | Anna | 10.A | 42 |
| 3 | Dora | 11.A | 80 |
| 4 | Bence | 10.B | 37 |

## ORDER BY

```sql
SELECT nev, pont
FROM diak
ORDER BY pont;
```

| nev | pont |
|---|---|
| Bence | 37 |
| Anna | 42 |
| Csilla | 51 |
| Dora | 80 |

Alapesetben **növekvő** (`ASC`) a sorrend: a számok kicsitől nagyig, a szöveg az ábécé szerint. A **csökkenő** sorrendhez a `DESC` szó kell:

```sql
SELECT nev, pont
FROM diak
ORDER BY pont DESC;
```

| nev | pont |
|---|---|
| Dora | 80 |
| Csilla | 51 |
| Anna | 42 |
| Bence | 37 |

Az `ORDER BY` a lekérdezés **legvégén** áll, a `WHERE` után.

```sql
SELECT nev, pont
FROM diak
WHERE pont > 40
ORDER BY nev;
```

| nev | pont |
|---|---|
| Anna | 42 |
| Csilla | 51 |
| Dora | 80 |

**Próbáld ki:** rendezd a diákokat pontszám szerint csökkenő sorrendbe.

## Rendezés több mező szerint

Ha az első mező értékei megegyeznek, a második dönt. Mindegyik mezőnek lehet külön iránya:

```sql
SELECT osztaly, nev
FROM diak
ORDER BY osztaly, nev DESC;
```

| osztaly | nev |
|---|---|
| 10.A | Csilla |
| 10.A | Anna |
| 10.B | Bence |
| 11.A | Dora |

A 10.A osztályon belül a nevek fordított ábécében következnek (Csilla, Anna). A `DESC` csak az előtte álló mezőre vonatkozik.

## LIMIT: csak az első néhány sor

A `LIMIT n` az eredményből az első `n` sort adja. Rendezéssel együtt "a legjobb n" lekérdezhető:

```sql
SELECT nev, pont
FROM diak
ORDER BY pont DESC
LIMIT 2;
```

| nev | pont |
|---|---|
| Dora | 80 |
| Csilla | 51 |

A `LIMIT` a lekérdezés legvégén áll, az `ORDER BY` után. **Rendezés nélkül** a `LIMIT` esetleges sorokat ad, ezért mindig rendezz előtte. Ha több sor ugyanazt az értéket kapja a határon, a `LIMIT` közülük tetszőlegeset vág le: ilyenkor érdemes második rendezési mezőt is megadni.

A MariaDB-ben is `LIMIT` van; más adatbáziskezelők (például SQL Server) a `TOP` szót használják.

## A NULL: nincs adat

Egy mező lehet **üres**, ha az adat nem ismert. Ezt az SQL `NULL`-nak hívja. Tekintsük a `kolcsonzes` táblát:

| id | olvaso | cim | kivetel | visszahozas |
|---|---|---|---|---|
| 1 | Anna | Aranykor | 2025-03-02 | 2025-03-20 |
| 2 | Bence | Hegyi ut | 2025-03-05 | NULL |
| 3 | Dora | Kis kert | 2025-03-01 | NULL |

Bence és Dóra még nem hozta vissza a könyvet, ezért nincs visszahozási dátum. A NULL nem 0 és nem üres szöveg, ezért az összehasonlító jelek nem működnek vele: a `visszahozas = NULL` **sosem igaz**, még akkor sem, ha a mező NULL. A vizsgálatra külön kifejezés van:

```sql
SELECT olvaso, cim
FROM kolcsonzes
WHERE visszahozas IS NULL;
```

| olvaso | cim |
|---|---|
| Bence | Hegyi ut |
| Dora | Kis kert |

A párja az `IS NOT NULL`: azokat a sorokat adja, ahol van érték.

A rendezésnél az SQLite a NULL értéket a legkisebbnek veszi (növekvő rendezésnél elöl áll). A MariaDB is így tesz, de ne építs rá: ha fontos, szűrd ki a NULL értékeket.

## Szűrés, rendezés, korlátozás együtt

A kulcsszavak sorrendje mindig ugyanaz:

```sql
SELECT mezők
FROM tábla
WHERE feltétel
ORDER BY mezők
LIMIT n;
```

A nem visszahozott könyvek, a legrégebbi kivétellel kezdve:

```sql
SELECT olvaso, cim, kivetel
FROM kolcsonzes
WHERE visszahozas IS NULL
ORDER BY kivetel;
```

| olvaso | cim | kivetel |
|---|---|---|
| Dora | Kis kert | 2025-03-01 |
| Bence | Hegyi ut | 2025-03-05 |

A dátumot `ÉÉÉÉ-HH-NN` alakban tároljuk, ezért a szöveges rendezés időrendet ad.

## Gyakori hibák

1. **`= NULL` használata.** Az `IS NULL` a helyes.
2. **`ORDER BY` a `WHERE` előtt.** A sorrend: `WHERE`, `ORDER BY`, `LIMIT`.
3. **`LIMIT` rendezés nélkül.** Nem tudod, melyik sorok jönnek.
4. **A `DESC` elfelejtése.** "Legnagyobb elöl" csak `DESC`-kel megy.
5. **A `DESC` több mezőnél.** Csak az előtte álló mezőre hat.

## Összefoglalás

- `ORDER BY mezo [ASC|DESC]` rendez; több mező vesszővel adható meg.
- `LIMIT n` az első `n` sort adja, rendezéssel együtt a "legjobb n" lekérdezhető.
- A NULL az "nincs adat": vizsgálata `IS NULL` / `IS NOT NULL`.
- A sorrend: `SELECT`, `FROM`, `WHERE`, `ORDER BY`, `LIMIT`.
