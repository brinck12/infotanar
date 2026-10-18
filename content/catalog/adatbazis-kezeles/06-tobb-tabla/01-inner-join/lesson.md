---
slug: inner-join
title: Táblák összekapcsolása (INNER JOIN)
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért több tábla?

Az adatbázis azért több táblából áll, hogy ne kelljen ugyanazt az információt sokszor leírni. A `diak` táblában nem ismételjük meg minden diáknál az osztály nevét és a termét. Csak az osztály **azonosítóját** tároljuk, a részletek az `osztaly` táblában vannak, egyszer.

Amikor egy lekérdezésnek mindkét táblából kell adat ("a diák neve és az osztálya terme"), a két táblát **össze kell kapcsolni**. Ezt végzi a `JOIN`.

A `osztaly` tábla:

| `id` | `nev` | `terem` |
|---|---|---|
| 1 | 10.A | 101 |
| 2 | 10.B | 102 |
| 3 | 11.A | 204 |

A `diak` tábla:

| `id` | `nev` | `osztaly_id` |
|---|---|---|
| 1 | Kiss Anna | 1 |
| 2 | Nagy Bela | 2 |
| 3 | Toth Csaba | 1 |
| 4 | Szabo Dora | 2 |
| 5 | Varga Fanni | NULL |

## Kulcs és idegen kulcs

Ismered a két fogalmat az alapfogalmak modulból. Az `osztaly.id` az osztály **elsődleges kulcsa**: minden osztálynak más. A `diak.osztaly_id` **idegen kulcs**: egy osztály azonosítóját tartalmazza, vagyis arra mutat. Kapcsolat: egy osztályhoz sok diák tartozik (1:N).

Ha egy diák `osztaly_id`-je 1, akkor az 1-es azonosítójú osztályba jár, a `10.A`-ba. Kiss Anna sora tehát így olvasható össze az osztályával:

| `diak.nev` | `diak.osztaly_id` | | `osztaly.id` | `osztaly.nev` |
|---|---|---|---|---|
| Kiss Anna | 1 | = | 1 | 10.A |

## INNER JOIN használata

A kapcsolás szerkezete:

```text
FROM egyik_tabla
INNER JOIN masik_tabla ON egyik_tabla.kulcs = masik_tabla.kulcs
```

Az `ON` után azt kell megadnod, **mi köti össze a két tábla sorait**: az idegen kulcs egyenlő a másik tábla elsődleges kulcsával.

```sql
SELECT diak.nev AS diak, osztaly.nev AS osztaly
FROM diak
INNER JOIN osztaly ON diak.osztaly_id = osztaly.id;
```

Eredmény:

| `diak` | `osztaly` |
|---|---|
| Kiss Anna | 10.A |
| Nagy Bela | 10.B |
| Toth Csaba | 10.A |
| Szabo Dora | 10.B |

Az `INNER JOIN` csak a **párosítható** sorokat adja: azokat, ahol az `ON` feltétele igaz. Varga Fanni `osztaly_id`-je `NULL`, nincs osztálya, ezért nem szerepel az eredményben. A 11.A osztálynak nincs diákja, ezért ő sem.

## Táblanév az oszlop előtt

Mivel két táblának is lehet `nev` oszlopa, az SQL nem tudná, melyikre gondolsz. Ezért **táblanévvel minősítjük** az oszlopot: `diak.nev`, `osztaly.nev`. Ez a kulcsoknál is fontos: `diak.osztaly_id = osztaly.id`.

Ha az oszlopnév a két tábla között egyedi (például `terem`), a táblanév nem kötelező, de az olvashatóság miatt érdemes kiírni.

Az eredmény oszlopainak az `AS` aliasszal adj egyértelmű nevet, különben mindkét oszlop `nev` néven jelenne meg.

## Szűrés összekapcsolás után

A `WHERE` a `JOIN` után áll, és bármelyik tábla oszlopát használhatja:

```sql
SELECT diak.nev AS diak, osztaly.terem AS terem
FROM diak
INNER JOIN osztaly ON diak.osztaly_id = osztaly.id
WHERE osztaly.terem = '101';
```

Eredmény:

| `diak` | `terem` |
|---|---|
| Kiss Anna | 101 |
| Toth Csaba | 101 |

**Próbáld ki:** listázd az `10.B` osztály diákjainak nevét! Melyik tábla oszlopa szerint kell szűrni?

## Mi történik a motorháztető alatt?

Képzeld el, hogy a `diak` tábla minden sorához az adatbázis megkeresi az `osztaly` tábla azon sorát, amelyiknek az `id` értéke egyezik. Ha talál, a két sort egymás mellé teszi egy hosszabb sorrá. Ha nem talál, a diák sora kimarad.

Ha egy diákhoz több sor tartozna a másik táblában, annyiszor jelenne meg, ahány párja van. Ezt látni fogod a jegyeknél: egy diákhoz több jegy tartozik, ezért a neve annyiszor szerepel, ahány jegye van.

## Régi stílus: vesszővel

Régebbi feladatokban találkozhatsz ilyen írásmóddal is, `JOIN` nélkül:

```text
SELECT diak.nev, osztaly.nev
FROM diak, osztaly
WHERE diak.osztaly_id = osztaly.id;
```

Ez ugyanazt adja, de ha a `WHERE` feltételt elfelejted, a két tábla minden sorát minden sorával párosítja, és hatalmas, értelmetlen eredményt kapsz. A `JOIN ... ON` olvashatóbb, és nehezebb elrontani, ezért ezt használd. A MariaDB mindkettőt érti, a `JOIN` és az `INNER JOIN` pedig egyenértékű.

## Gyakori hibák

- Elfelejtett `ON` feltétel, vagy rossz oszlopok összekötése (`diak.id = osztaly.id`): az eredmény értelmetlen lesz, mert az azonosítók véletlenül egyeznek.
- Hiányzó táblanév az azonos nevű oszlop előtt: hibás vagy félreérthető lekérdezés.
- Annak elvárása, hogy az `INNER JOIN` minden sort megtart: a párosítatlan sorok (itt az osztály nélküli diák) kimaradnak.
- A `WHERE` a `JOIN` elé írva: a sorrend `FROM`, `JOIN`, `WHERE`.

## Összefoglalás

- A táblákat kulcsok kapcsolják össze: az idegen kulcs a másik tábla elsődleges kulcsára mutat.
- `FROM a INNER JOIN b ON a.idegen_kulcs = b.kulcs` összekapcsolja a két táblát.
- Az `INNER JOIN` csak a párosítható sorokat adja vissza.
- Az azonos nevű oszlopokat táblanévvel minősítjük, az eredményt `AS`-szal nevezzük el.
- A `WHERE` a `JOIN` után áll, és bármelyik tábla oszlopára hivatkozhat.
