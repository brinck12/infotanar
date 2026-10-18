---
slug: left-join
title: LEFT JOIN, a hiányzó párok
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi lett a párosítatlan sorokkal?

Az `INNER JOIN` csak azokat a sorokat adja, amelyeknek van párja a másik táblában. Ez a legtöbb esetben jó, de néha éppen a **párosítatlan** sorok érdekelnek: melyik osztálynak nincs diákja? Melyik könyvet nem kölcsönözte még senki? Melyik diáknak nincs jegye? Erre való a **`LEFT JOIN`**.

A `osztaly` tábla:

| `id` | `nev` |
|---|---|
| 1 | 10.A |
| 2 | 10.B |
| 3 | 11.A |

A `diak` tábla:

| `id` | `nev` | `osztaly_id` |
|---|---|---|
| 1 | Kiss Anna | 1 |
| 2 | Nagy Bela | 1 |
| 3 | Toth Csaba | 2 |

## INNER JOIN és LEFT JOIN összehasonlítása

Az `INNER JOIN` az `osztaly` és a `diak` összekapcsolásánál elhagyja a 11.A osztályt, mert nincs diákja:

```sql
SELECT osztaly.nev AS osztaly, diak.nev AS diak
FROM osztaly
INNER JOIN diak ON diak.osztaly_id = osztaly.id;
```

Eredmény:

| `osztaly` | `diak` |
|---|---|
| 10.A | Kiss Anna |
| 10.A | Nagy Bela |
| 10.B | Toth Csaba |

A `LEFT JOIN` a **bal oldali** tábla (a `FROM` után írt) minden sorát megtartja. Ha a jobb oldalon nincs párja, a jobb oldali oszlopok értéke `NULL` lesz:

```sql
SELECT osztaly.nev AS osztaly, diak.nev AS diak
FROM osztaly
LEFT JOIN diak ON diak.osztaly_id = osztaly.id;
```

Eredmény:

| `osztaly` | `diak` |
|---|---|
| 10.A | Kiss Anna |
| 10.A | Nagy Bela |
| 10.B | Toth Csaba |
| 11.A | NULL |

Most a 11.A osztály is megjelenik, a `diak` oszlopa pedig `NULL`. A két tábla megnevezése fontos: a `LEFT` azt jelzi, hogy a **bal** tábla az, amelyik teljesen megmarad. Ha felcseréled a két tábla sorrendjét, az eredmény is megváltozik.

**Próbáld ki:** cseréld meg a két táblát (`FROM diak LEFT JOIN osztaly ...`), és figyeld meg, mi változik!

## A hiányzó párok megkeresése: IS NULL

A `LEFT JOIN` leggyakoribb használata: azok a sorok, amelyeknek **nincs** párjuk. Mivel ilyenkor a jobb oldali oszlopok `NULL`-ok, a `WHERE`-ben az `IS NULL` feltétellel szűrhetsz. A kulcs oszlopot érdemes vizsgálni, mert az sosem `NULL` valódi párnál.

```sql
SELECT osztaly.nev AS ures_osztaly
FROM osztaly
LEFT JOIN diak ON diak.osztaly_id = osztaly.id
WHERE diak.id IS NULL;
```

Eredmény:

| `ures_osztaly` |
|---|
| 11.A |

Ne feledd az alapfogalmak szabályát: `NULL`-lal nem lehet `=` jellel összehasonlítani, csak `IS NULL`, illetve `IS NOT NULL` használható.

## Összesítés LEFT JOIN-nal

Ha a "hány" kérdésre a hiányzó párokat 0-ként is látni akarod, a `LEFT JOIN` és a `COUNT` jó páros. De vigyázz, melyik oszlopot számolod:

```sql
SELECT konyv.cim AS cim, COUNT(kolcsonzes.id) AS kolcsonzesek
FROM konyv
LEFT JOIN kolcsonzes ON kolcsonzes.konyv_id = konyv.id
GROUP BY konyv.id, konyv.cim;
```

Eredmény:

| `cim` | `kolcsonzesek` |
|---|---|
| Egri csillagok | 2 |
| Tuskevar | 0 |
| Pomade | 1 |

A `Tuskevar` című könyvet senki nem kölcsönözte, ezért `0` szerepel mellette. A `COUNT(kolcsonzes.id)` csak a valódi párokat számolja, mert a hiányzó pár `id`-je `NULL`, és a `COUNT(oszlop)` a `NULL`-t kihagyja. Ha `COUNT(*)`-ot írnál, a párosítatlan könyv is 1-et kapna, mert az összekapcsolt sor létezik, csak a jobb fele üres.

Ez a leckék egyik legfontosabb finomsága. Az összefoglaló szabály: **`LEFT JOIN` után a jobb oldali tábla egy oszlopát számold**, ne a `*`-ot.

## Szűrés a jobb oldali táblán

Ha egy `WHERE` feltétel a jobb oldali tábla oszlopára vonatkozik (például `kolcsonzes.olvaso = 'Kiss Anna'`), a párosítatlan sorok `NULL`-ja miatt kiesnek, és a `LEFT JOIN` hatástalanná válik. Ha a szűrést a kapcsolás részének szánod, az `ON` feltételébe írd, `AND`-del:

```text
LEFT JOIN kolcsonzes ON kolcsonzes.konyv_id = konyv.id AND kolcsonzes.olvaso = 'Kiss Anna'
```

Egyelőre elég, ha tudod: a `WHERE kolcsonzes.olvaso = ...` sorokat dob el, az `ON ... AND ...` viszont csak a párosítást szűkíti.

## RIGHT JOIN és FULL JOIN

Létezik `RIGHT JOIN` is, amely a jobb oldali tábla sorait tartja meg. Ez azonban pusztán a két tábla felcserélése, ezért a `LEFT JOIN` mindig elegendő: írd úgy, hogy a megtartandó tábla a `FROM`-ban álljon. Az SQLite régebbi változataiban `RIGHT JOIN` nincs, ezért ebben a tananyagban csak a `LEFT JOIN`-t használjuk.

## Gyakori hibák

- `COUNT(*)` a `LEFT JOIN` után: a párosítatlan sor is 1-nek számít. Használd a jobb oldali tábla egy oszlopát.
- `= NULL` az `IS NULL` helyett: soha nem igaz.
- A bal és a jobb tábla felcserélése: a megtartandó tábla a `FROM`-ban áll.
- `IS NULL` a bal oldali oszlopra: a hiányzó párt a jobb oldali kulcs `NULL`-ja jelzi.
- `WHERE` feltétel a jobb oldali táblán: a párosítatlan sorokat eltünteti.

## Összefoglalás

- Az `INNER JOIN` csak a párosítható sorokat adja, a `LEFT JOIN` a bal tábla minden sorát megtartja.
- A hiányzó pár oszlopai `NULL`-ok.
- A párosítatlan sorokat a `WHERE jobb.kulcs IS NULL` találja meg.
- A hiányzó párt is 0-nak számoló összesítéshez `COUNT(jobb.oszlop)` kell, nem `COUNT(*)`.
- `RIGHT JOIN` helyett cseréld fel a táblákat, és használj `LEFT JOIN`-t.
