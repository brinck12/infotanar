---
slug: update-es-delete
title: Módosítás és törlés, UPDATE és DELETE
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Meglévő sorok megváltoztatása és törlése

Az `INSERT` új sort ad a táblához. De mi a helyzet, ha egy termék ára változik, vagy egy diák kilép? Két új utasításra van szükséged: az **`UPDATE`** a meglévő sorok mezőit írja át, a **`DELETE`** sorokat töröl. Mindkettő a `WHERE` feltétellel dönti el, **melyik sorokra** vonatkozzon, ugyanúgy, ahogy a `SELECT`.

A példákban ez a `termek` tábla szerepel:

| id | nev | kategoria | ar | keszlet |
|---|---|---|---|---|
| 1 | Tej | tej | 330 | 12 |
| 2 | Kenyer | pek | 480 | 0 |
| 3 | Sajt | tej | 1900 | 4 |
| 4 | Kifli | pek | 60 | 40 |

## UPDATE: mezők átírása

```sql
UPDATE termek
SET ar = 350
WHERE id = 1;
```

A `SET` után adod meg az oszlopot és az új értéket, a `WHERE` pedig kiválasztja a módosítandó sort. A tej ára most 350.

Az új érték lehet **számított** is, amely a régi értékből indul ki:

```sql
UPDATE termek
SET ar = ar * 110 / 100
WHERE kategoria = 'tej';
```

A `tej` kategória minden termékének ára 10%-kal nő (330-ból 363, 1900-ból 2090). A jobb oldali `ar` a **régi** értéket jelenti. A MariaDB-ben a `/` osztás tizedes eredményt ad (például `7 / 2` értéke `3.5`), ezért a számítás eredménye itt `363.0000` alakú szám. Az `ar` oszlop `INT` típusú, így az érték egész számra kerekítve kerül vissza; ebben a példában az eredmény pontosan egész.

**Próbáld ki:** csökkentsd 50 Ft-tal a pékáruk árát (`ar = ar - 50`)!

## Több oszlop egyszerre

```sql
UPDATE termek
SET kategoria = 'kifuto', ar = ar - 100
WHERE keszlet <= 5;
```

A módosítandó oszlopokat vesszővel választod el. Egyetlen utasítás minden érintett sorban mindkét változást elvégzi.

## A WHERE nélküli UPDATE katasztrófa

```sql
UPDATE termek SET ar = 0;
```

A `WHERE` elhagyása azt jelenti: **minden sor**. Az összes termék ára nulla lett. Ezért az `UPDATE` és `DELETE` írásakor **először a `WHERE`-t** gondold végig. Jó szokás, hogy előbb ugyanazt a feltételt egy `SELECT`-ben próbálod ki:

```sql
SELECT * FROM termek WHERE kategoria = 'tej';
```

Ha a találatok pontosan azok a sorok, amelyeket módosítani akarsz, cseréld a `SELECT * FROM` részt `UPDATE ... SET ...`-re.

## DELETE: sorok törlése

```sql
DELETE FROM termek
WHERE keszlet = 0;
```

A `DELETE` **egész sorokat** töröl, nem oszlopokat. A fenti utasítás a kenyeret (készlet 0) törli. Nincs `*` és nincs oszloplista: ami a `WHERE` szerint igaz, az eltűnik.

A `WHERE` nélküli `DELETE FROM termek;` az összes sort törli, a tábla (a szerkezete) megmarad, de üres lesz. (A táblát magát a `DROP TABLE` törli, erről a következő leckében lesz szó.)

## Allekérdezés a feltételben

A `WHERE` ugyanúgy tartalmazhat allekérdezést, mint a `SELECT`-ben. Töröljük az átlagnál olcsóbb pékárukat:

```sql
DELETE FROM termek
WHERE kategoria = 'pek'
  AND ar < (SELECT AVG(ar) FROM termek);
```

Az átlagár `(330 + 480 + 1900 + 60) / 4 = 692,5`. Mindkét pékáru olcsóbb ennél, így mindkettő törlődik. Az átlagot az adatbázis a törlés megkezdése előtt számolja ki.

Ugyanez működik az `UPDATE`-nél is: `WHERE ar > (SELECT AVG(ar) FROM termek)`.

## A módosítás ellenőrzése

A módosító utasítás nem ír ki semmit, ezért utána mindig nézd meg a táblát:

```sql
DELETE FROM termek WHERE keszlet = 0;

SELECT id, nev, keszlet FROM termek ORDER BY id;
```

A feladatokban ez a szabály: a kódod végén álló `SELECT` sor mutatja a módosítás eredményét, és a rendszer ezt veti össze az elvárttal. Az utasításodat a `SELECT` elé írd, és a `SELECT` sort ne töröld.

## MariaDB eltérések

Az `UPDATE` és `DELETE` szintaxisa a MariaDB-ben ugyanez. Egyetlen óvatossági pont: a régebbi MySQL/MariaDB változatok nem engedték, hogy az `UPDATE` vagy `DELETE` allekérdezése ugyanabból a táblából olvasson, amelyet módosít (`1093` hibakód). Ha ilyet látsz, az allekérdezést csomagold egy származtatott táblába: `(SELECT AVG(ar) FROM (SELECT ar FROM termek) AS t)`.

## Gyakori hibák

- **WHERE nélküli UPDATE vagy DELETE:** minden sorra vonatkozik. Mindig ellenőrizd előbb `SELECT`-tel.
- **Az `=` az UPDATE-ben értékadás:** a `SET ar = ar - 100` nem összehasonlítás, hanem azt jelenti, hogy az új ár a régi mínusz 100.
- **A `SET` után a `WHERE` előtt hiányzó vessző:** több oszlopnál vessző kell közéjük, a `WHERE` előtt viszont nincs vessző.
- **Törlés oszlopra:** a `DELETE` sorokat töröl. Egy oszlop értékét az `UPDATE ... SET oszlop = NULL` törli.
- **Kulcs módosítása:** az `id` átírása is lehetséges, de hivatkozó (idegen kulcsos) sorok elveszíthetik a párjukat.

## Összefoglalás

- Az `UPDATE tabla SET oszlop = ertek WHERE feltetel` a feltételnek megfelelő sorok mezőit írja át.
- A `DELETE FROM tabla WHERE feltetel` a feltételnek megfelelő sorokat törli.
- `WHERE` nélkül mindkettő a tábla **összes** sorára vonatkozik.
- Az új érték a régi értékből is számítható (`ar = ar * 110 / 100`).
- A `WHERE` feltételben állhat allekérdezés is.
- A módosítás után egy `SELECT`-tel ellenőrizd a táblát.
