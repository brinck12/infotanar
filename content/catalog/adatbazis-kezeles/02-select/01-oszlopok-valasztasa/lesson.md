---
slug: oszlopok-valasztasa
title: Oszlopok választása és aliasok
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Csak azt kérdezd, ami kell

Az előző leckékben megtanultad a `SELECT * FROM tabla;` lekérdezést. A valós feladatokban ritkán kell minden mező: a tanárnak a névsor kell, nem a születési dátum is. A `SELECT` után ezért felsoroljuk a kívánt mezőket. Ebben a leckében ezt gyakoroljuk, és megtanulod az eredmény oszlopait átnevezni.

A példákban ez a `termek` tábla szerepel:

| id | nev | kategoria | ar | keszlet |
|---|---|---|---|---|
| 1 | Tej | tej | 330 | 12 |
| 2 | Kenyer | pek | 480 | 0 |
| 3 | Alma | zold | 290 | 25 |

## Több mező felsorolása

A mezőneveket vesszővel választjuk el:

```sql
SELECT nev, ar
FROM termek;
```

| nev | ar |
|---|---|
| Tej | 330 |
| Kenyer | 480 |
| Alma | 290 |

Az utolsó mező után **nincs** vessző. Hibás például: `SELECT nev, ar, FROM termek;`.

**Próbáld ki:** kérd le a termék nevét és a készletét.

## A sorrend a tiéd

Az eredmény oszlopai abban a sorrendben jelennek meg, ahogy felsorolod őket, nem a tábla sorrendjében:

```sql
SELECT ar, nev
FROM termek;
```

| ar | nev |
|---|---|
| 330 | Tej |
| 480 | Kenyer |
| 290 | Alma |

Ugyanazt a mezőt akár kétszer is lekérdezheted, de erre ritkán van szükség.

## A `*` és a felsorolás

A `SELECT *` a tábla összes mezőjét adja, a tábla sorrendjében. Gyors felfedezéshez jó, de a feladatokban a pontosan kért mezőket sorold fel: az érettségi feladat leírja, mely oszlopok kellenek, és ennél többet vagy kevesebbet nem szabad megjeleníteni.

## Alias: új név az oszlopnak

A kimenet fejléce alapból a mező neve. Az **alias** (becenév) átnevezi az eredmény oszlopát, az `AS` kulcsszóval:

```sql
SELECT nev AS megnevezes, ar AS egysegar
FROM termek;
```

| megnevezes | egysegar |
|---|---|
| Tej | 330 |
| Kenyer | 480 |
| Alma | 290 |

Az alias csak az eredményben él: a tábla mezőinek neve nem változik. A feladatok gyakran megadják, hogyan kell az oszlopot elnevezni (például "az oszlop neve legyen `tanulo`"), ilyenkor pontosan azt az aliast írd.

Az alias lehet szóközt tartalmazó név is, ilyenkor idézőjelbe vagy visszafelé aposztrófba tesszük (`AS "Termék neve"`; MariaDB-ben `` `Termék neve` ``). A feladatok ezt nem kérik, mert ékezet és szóköz nélkül egyszerűbb.

## Az AS elhagyható, mégis írd ki

SQL-ben az `AS` elhagyható (`nev megnevezes`), de így könnyű elnézni a vesszőt: ha két mező között elfelejted a vesszőt, az adatbázis a másodikat aliasnak értelmezi, és nem ad hibát. Írd ki mindig az `AS`-t.

## Gyakori hibák

1. **Felesleges vessző az utolsó mező után.** `SELECT nev, FROM termek;` hibás.
2. **Elfelejtett vessző két mező között.** `SELECT nev ar FROM termek;` az `ar`-t aliasnak veszi, és csak egy oszlopot ad.
3. **Aposztróf az alias körül.** Az `AS 'tanulo'` egyes adatbáziskezelőkben működik, másokban nem; írd egyszerűen `AS tanulo`.
4. **Rossz sorrend.** Ha a feladat "előbb a nevet, aztán az árat" kéri, a sorrend a `SELECT` után számít.

## Összefoglalás

- `SELECT mezo1, mezo2 FROM tabla;` a megnevezett mezőket adja, a felsorolás sorrendjében.
- A mezőket vessző választja el, az utolsó után nincs vessző.
- `mezo AS alias` átnevezi az eredmény oszlopát; a tábla nem változik.
- Az `AS`-t mindig írd ki.
