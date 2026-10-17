---
slug: distinct-egyedi-ertekek
title: DISTINCT egyedi értékek
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi a baj az ismétlődéssel?

Ha egy iskola osztályait szeretnéd felsorolni, és a `diak` táblából lekérdezed az `osztaly` mezőt, minden diák után kiírja az osztályát: a 10.A annyiszor szerepel, ahány diák oda jár. Te viszont csak azt akarod tudni, **milyen osztályok vannak**. A `DISTINCT` kulcsszó pontosan ezt oldja meg.

A példákban ez a `diak` tábla szerepel:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Anna | 10.A | 42 |
| 2 | Bence | 10.B | 37 |
| 3 | Csilla | 10.A | 51 |
| 4 | Dora | 10.A | 12 |
| 5 | Endre | 11.A | 60 |
| 6 | Feri | 10.B | 33 |

## A probléma kipróbálása

```sql
SELECT osztaly
FROM diak;
```

| osztaly |
|---|
| 10.A |
| 10.B |
| 10.A |
| 10.A |
| 11.A |
| 10.B |

Hat sor, mert hat diák van. A 10.A háromszor szerepel.

## DISTINCT

A `DISTINCT` a `SELECT` után közvetlenül áll, és eldobja az ismétlődő sorokat:

```sql
SELECT DISTINCT osztaly
FROM diak;
```

| osztaly |
|---|
| 10.A |
| 10.B |
| 11.A |

Minden osztály egyszer szerepel. Az eredmény sorrendjére ne számíts: ha rendezett listát szeretnél, azt külön kérni kell (erről később tanulsz).

**Próbáld ki:** listázd ki a különböző úti célokat egy taxis nyilvántartásból.

## DISTINCT több oszlopra

Ha több mezőt kérdezel le, a `DISTINCT` az **egész sort** nézi: két sor akkor azonos, ha **minden** felsorolt mező megegyezik.

```sql
SELECT DISTINCT osztaly, pont
FROM diak;
```

Ez minden diákot külön hagyna, hiszen a pontszámok mind különbözők, így a `DISTINCT` nem szűr semmit. Más a helyzet, ha az osztály mellé olyan mezőt veszünk, amely gyakran ismétlődik. Például egy taxis táblában az `indulas` és a `cel` mezőpár:

| indulas | cel |
|---|---|
| Szeged | Pecs |
| Szeged | Pecs |
| Gyor | Eger |
| Szeged | Eger |

```sql
SELECT DISTINCT indulas, cel
FROM taxi;
```

| indulas | cel |
|---|---|
| Szeged | Pecs |
| Gyor | Eger |
| Szeged | Eger |

A Szeged → Pécs útvonal kétszer volt, de egyszer szerepel. A Szeged → Eger és a Győr → Eger különböző pár, ezért mindkettő megmarad.

## A DISTINCT nem az oszlopra, hanem a sorra vonatkozik

Gyakori tévedés, hogy a `DISTINCT` csak az utána álló első mezőt szűri. Nem így van: a `SELECT DISTINCT a, b` az `a` és a `b` **együttes** értékét nézi, vagyis a pár egyedisége számít, nem külön-külön az `a` és a `b`.

## Mikor használd?

- Amikor a kérdés a **fajtákra** kérdez: "mely osztályok", "mely városok", "milyen kategóriák".
- Ne használd, ha minden rekordra kíváncsi vagy: a `DISTINCT` elveszi a duplikátumokat, így nem tudod megszámolni, hányszor fordultak elő. (A megszámolást később, a `COUNT` és a `GROUP BY` oldja meg.)

## Gyakori hibák

1. **A `DISTINCT` rossz helye.** A `SELECT osztaly DISTINCT` hibás; a `DISTINCT` közvetlenül a `SELECT` után áll.
2. **Egy oszlopot várnál, de kettő van.** A `SELECT DISTINCT osztaly, nev` minden diákot megőriz, hiszen a nevek különbözőek.
3. **A `DISTINCT` használata mindenhol.** Ha nincs ismétlődés, nem változtat az eredményen, de feleslegesen lassít.

## Összefoglalás

- A `SELECT DISTINCT mezo FROM tabla;` minden értéket egyszer ad vissza.
- Több mezőnél a mezők együttes értéke (a sor) számít.
- A `DISTINCT` a `SELECT` után közvetlenül áll.
