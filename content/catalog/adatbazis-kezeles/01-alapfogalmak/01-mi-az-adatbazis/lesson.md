---
slug: mi-az-adatbazis
title: Mi az az adatbázis?
position: 0
free: true
published: false
reviewed_by:
reviewed_at:
---

## Miért kell adatbázis?

Képzeld el, hogy az iskolai könyvtárosnak fel kell jegyeznie több ezer könyvet, az olvasókat és a kölcsönzéseket. Ha mindezt egy füzetbe írná, a keresés napokig tartana. Az **adatbázis** rendezett formában tárolt adatok gyűjteménye, amelyből a számítógép másodpercek alatt kikeresi, amit kérdezünk. A webshopok, a bankok, az iskolai e-napló mind adatbázist használnak.

Az adatbázisból az **SQL** nyelvvel kérdezhetünk (a neve: Structured Query Language, ejtsd "eszkjúel" vagy "szekvel"). Az érettségin az SQL-feladat egy kész adatbázist ad, és lekérdezéseket kell írnod hozzá.

## A tábla, a rekord és a mező

Az adatokat **táblákban** tároljuk, ezek hasonlítanak a táblázatkezelő munkalapjára. Nézzünk egy `diak` nevű táblát:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Anna | 10.A | 42 |
| 2 | Bence | 10.B | 37 |
| 3 | Csilla | 10.A | 51 |

- Egy **sor** a tábla egy **rekordja**: itt egy diák minden adata együtt.
- Egy **oszlop** a tábla egy **mezője**: itt például az összes diák neve. A mezőnek neve van (`nev`, `pont`), és meghatározott típusú adatot tárol.
- Az első sor fölött a fejléc a mezők nevét mutatja, ez nem rekord.

Az adatbázis általában több összetartozó táblából áll, például `diak`, `osztaly`, `tanar`.

## Az első lekérdezés

A lekérdezés neve angolul *query*. Az alapja a `SELECT` (válaszd ki) utasítás, amelynek két része kötelező:

```sql
SELECT *
FROM diak;
```

- `SELECT`: mit szeretnénk látni. A `*` jelentése: **minden mezőt**.
- `FROM`: melyik táblából.
- A lekérdezést pontosvessző zárja.

Az eredmény az egész tábla:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Anna | 10.A | 42 |
| 2 | Bence | 10.B | 37 |
| 3 | Csilla | 10.A | 51 |

**Próbáld ki:** az alábbi feladatokban a `FROM` után a tábla nevét kell kicserélned.

## Egyetlen mező lekérdezése

A `*` helyett felsorolhatjuk a kívánt mezőket. Ha csak a nevekre van szükségünk:

```sql
SELECT nev
FROM diak;
```

| nev |
|---|
| Anna |
| Bence |
| Csilla |

Az eredmény is egy tábla, csak kevesebb oszloppal. A **tábla maga nem változik**: a lekérdezés csak olvas.

## Kis- és nagybetű, tördelés

Az SQL kulcsszavai (`SELECT`, `FROM`) kis- és nagybetűre nem érzékenyek, de megegyezés szerint **nagybetűvel** írjuk őket, hogy elváljanak a mezők és táblák nevétől. A sortörés és a behúzás sem számít, de a `SELECT` és a `FROM` külön sorba írása áttekinthetőbb. A mező- és táblaneveket ékezet nélkül, kisbetűvel adjuk meg, ahogy az adatbázisban szerepelnek.

## Hol fut a lekérdezés?

Az érettségin egy adatbáziskezelő programban dolgozol (általában MariaDB-vel), ahol beírod a lekérdezést, lefuttatod, és az eredménytábla megjelenik. Az InfoTanár.hu szerkesztőjében is így megy: a feladat adott táblákra írod a lekérdezést, a **Futtatás** gomb pedig megmutatja az eredményt. A kis eltéréseket (például a szöveg-összefűzést) a megfelelő leckékben jelezzük.

## Gyakori hibák

1. **Lemaradó pontosvessző vagy vessző.** Több mező között vessző kell, az utolsó után nem.
2. **Elgépelt táblanév.** Ha a `FROM dak` hibát ad, nézd meg a feladatban a pontos nevet.
3. **Az oszlop és a rekord összekeverése.** A `SELECT nev` minden sor `nev` mezőjét adja, nem egyetlen diákot.

## Összefoglalás

- Az **adatbázis** táblákból áll; a tábla **rekordokból** (sorok) és **mezőkből** (oszlopok).
- `SELECT * FROM tabla;` a tábla összes adatát kiolvassa.
- `SELECT mezo FROM tabla;` csak a megadott mezőt adja.
- A lekérdezés nem módosítja az adatokat.
