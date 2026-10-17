---
slug: kulcsok-es-kapcsolatok
title: Kulcsok és kapcsolatok
position: 1
free: true
published: false
reviewed_by:
reviewed_at:
---

## Hogyan különböztessünk meg két rekordot?

Az iskolában két Kovács Anna is járhat ugyanabba az osztályba. A nevük megegyezik, mégis két különböző diák. Az adatbázisnak is kell valami, ami **egyértelműen azonosít** egy rekordot. Erre való a kulcs.

## Elsődleges kulcs

Az **elsődleges kulcs** (angolul *primary key*) olyan mező, amelynek értéke minden rekordnál más, és sosem üres. Leggyakrabban egy sorszám, az `id`:

**iro**

| id | nev | szuletesi_ev |
|---|---|---|
| 1 | Nagy Peter | 1952 |
| 2 | Kovacs Lilla | 1970 |
| 3 | Toth Gabor | 1985 |

Az `id` alapján bármelyik író biztosan megtalálható, akkor is, ha két író neve azonos lenne. Elsődleges kulcs lehet a személyi szám vagy a rendszám is, ha ténylegesen egyedi. Egy táblának egy elsődleges kulcsa van (ez több mezőből is állhat, de ezzel most nem foglalkozunk).

A kulcs mezőt ugyanúgy kérdezzük le, mint bármelyiket:

```sql
SELECT id, nev
FROM iro;
```

| id | nev |
|---|---|
| 1 | Nagy Peter |
| 2 | Kovacs Lilla |
| 3 | Toth Gabor |

## Miért több tábla?

Tegyük fel, hogy a regényeket úgy tároljuk, hogy minden sorban az író teljes adatait is kiírjuk:

| cim | iro_nev | iro_szuletesi_ev |
|---|---|---|
| Aranykor | Nagy Peter | 1952 |
| Hegyi ut | Nagy Peter | 1952 |
| Kis kert | Nagy Peter | 1952 |

Nagy Péter adatai háromszor szerepelnek. Ha elírtuk a születési évet, mindhárom sort javítani kell; ha az egyiket kihagyjuk, az adatbázis ellentmondásos lesz. Ezért az író adatait **külön táblában** tároljuk, és a regényből csak hivatkozunk rá.

## Idegen kulcs és az 1:N kapcsolat

A hivatkozást az **idegen kulcs** (*foreign key*) valósítja meg: egy mező, amely egy másik tábla elsődleges kulcsának értékét tartalmazza.

**regeny**

| id | cim | iro_id | oldal |
|---|---|---|---|
| 1 | Aranykor | 1 | 320 |
| 2 | Hegyi ut | 1 | 210 |
| 3 | Kis kert | 3 | 150 |

Az `iro_id` az `iro` tábla `id` mezőjére mutat: az 1-es értékű sorok Nagy Péter regényei, a 3-as Tóth Gábor könyve. Az író nevét csak egy helyen kell karbantartani.

Ezt a kapcsolatot **egy-a-többhöz** (1:N) kapcsolatnak hívjuk: egy íróhoz **több** regény tartozhat, de egy regénynek **egy** írója van. Az idegen kulcs mindig az "N" oldalon, a regények táblájában van.

Az iskolai adatbázisban ugyanez a minta: egy osztályhoz sok diák tartozik, ezért a `diak` táblában lenne az `osztaly_id`, amely az `osztaly` tábla `id` mezőjére mutat.

## Hogyan ismered fel a kapcsolatot?

Az érettségin a táblák felépítését kapod meg. A kapcsolatot így találod meg:

1. Keresd az elsődleges kulcsot (általában `id`, ez a táblázat vagy a leírás szerint egyedi).
2. Keresd azokat a mezőket, amelyek más tábla kulcsának nevét viselik: az `iro_id`, `osztaly_id` jellegű mezők idegen kulcsok.
3. Az idegen kulcsot tartalmazó tábla az "N" oldal.

Az idegen kulcs mellett álló számból magától nem derül ki, ki az író: ehhez a másik táblára is szükség van. A két tábla összekapcsolását (`JOIN`) egy későbbi leckében tanuljuk meg; most csak egy-egy táblát kérdezünk le.

**Próbáld ki:** a feladatokban az idegen kulcs mezőt is ki kell olvasnod, úgy, mint bármely más mezőt.

## Gyakori hibák

1. **A név használata kulcsként.** A nevek nem egyediek, ezért nem alkalmasak elsődleges kulcsnak.
2. **Az idegen kulcs értékének összekeverése az azonosítóval.** Az `iro_id = 3` nem a regény sorszáma, hanem az író azonosítója.
3. **Az idegen kulcs a rossz oldalon.** Az "N" oldali táblában van, nem az "1" oldaliban.

## Összefoglalás

- **Elsődleges kulcs:** minden rekordnál különböző, nem üres mező, amely azonosítja a rekordot.
- **Idegen kulcs:** más tábla elsődleges kulcsára hivatkozó mező.
- **1:N kapcsolat:** az "1" oldalon az elsődleges kulcs, az "N" oldalon az idegen kulcs áll.
- A külön táblák megakadályozzák, hogy ugyanaz az adat többször, ellentmondásosan szerepeljen.
