---
slug: create-table-es-drop
title: Táblák létrehozása és törlése, CREATE TABLE és DROP
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az adatbázis szerkezete is utasítással épül

Eddig a táblák készen álltak. Az adatbázis és a táblák is SQL utasítással jönnek létre. Az utasításoknak ezt a csoportját **adatdefiníciós** utasításoknak nevezik: nem az adatokat, hanem a **szerkezetet** határozzák meg. Ebben a leckében három dolgot tanulsz meg: tábla létrehozása (`CREATE TABLE`), kulcsok és megkötések megadása, tábla törlése (`DROP TABLE`).

## CREATE TABLE

```sql
CREATE TABLE konyv (
  id INTEGER PRIMARY KEY,
  cim TEXT NOT NULL,
  szerzo TEXT,
  ev INTEGER
);
```

A tábla neve után zárójelben, vesszővel elválasztva az oszlopok állnak: **oszlopnév, adattípus, megkötések**. Az utasítás pontosvesszővel zárul. A tábla létrejön, de **üres**; a sorokat `INSERT`-tel kell felvenni:

```sql
INSERT INTO konyv VALUES (1, 'A kis herceg', 'Saint-Exupery', 1943);
INSERT INTO konyv VALUES (2, 'Egri csillagok', 'Gardonyi Geza', 1901);
```

**Próbáld ki:** hozz létre egy `film` táblát `id`, `cim` és `hossz` oszlopokkal, és vigyél fel két filmet!

## Adattípusok

Az SQLite és a MariaDB típusnevei részben eltérnek:

| Mit tárol | SQLite | MariaDB (érettségi) |
|---|---|---|
| egész szám | `INTEGER` | `INT` |
| tizedes szám | `REAL` | `DOUBLE`, `DECIMAL(10,2)` |
| szöveg | `TEXT` | `VARCHAR(50)`, `TEXT` |
| dátum | `TEXT` (ÉÉÉÉ-HH-NN) | `DATE` |

Az SQLite ennél szabadabb: bármilyen típusnevet elfogad, és a tárolt érték alapján dönti el, mi az. A MariaDB szigorúbb, ott a szöveg hosszát (`VARCHAR(50)`) is meg kell adni.

## Elsődleges kulcs és megkötések

Az oszlop után **megkötések** (constraint) állhatnak:

- `PRIMARY KEY`: az oszlop egyedi azonosító, nem lehet `NULL`, és nem ismétlődhet. Egy `INTEGER PRIMARY KEY` oszlop az SQLite-ban automatikusan számozódik (MariaDB-ben `INT PRIMARY KEY AUTO_INCREMENT`).
- `NOT NULL`: az oszlop nem maradhat üresen. Ha felvételkor nem adsz értéket, hibát kapsz.
- `UNIQUE`: az értékek nem ismétlődhetnek (például e-mail cím).
- `DEFAULT 0`: alapértelmezett érték, ha a felvételkor nem adsz meg másikat.

Az **idegen kulcs** két táblát kapcsol össze: egy oszlop értéke egy másik tábla kulcsára mutat.

```sql
CREATE TABLE rendeles (
  id INTEGER PRIMARY KEY,
  vevo_id INTEGER NOT NULL,
  osszeg INTEGER,
  FOREIGN KEY (vevo_id) REFERENCES vevo(id)
);
```

A `FOREIGN KEY (vevo_id) REFERENCES vevo(id)` kimondja: a `vevo_id` értéke a `vevo` tábla valamelyik `id`-ja. Így a `rendeles` és a `vevo` táblák a `JOIN`-nál tanult módon kapcsolhatók. A MariaDB ezt ellenőrzi is: nem engedi olyan vevő rendelését felvenni, aki nincs a táblában. (Az SQLite alapból nem ellenőrzi, a kapcsolat azonban így is rögzített.)

## Új oszlop utólag: ALTER TABLE

Ha már létező táblához új oszlop kell, nem kell újra létrehozni a táblát:

```sql
ALTER TABLE diak ADD COLUMN email TEXT;
```

Az új oszlop minden sorban `NULL`. Az `UPDATE` tölti ki:

```sql
UPDATE diak SET email = REPLACE(LOWER(nev), ' ', '.') || '@suli.hu';
```

(Az érettségi követelményei között az `ALTER TABLE` nem szerepel, de a gyakorlatban nagyon hasznos.)

## DROP TABLE: a tábla törlése

```sql
DROP TABLE tmp_import;
```

A `DROP TABLE` a táblát **a szerkezetével és az összes sorával együtt** törli. A `DELETE FROM tabla` csak a sorokat törli, a tábla megmarad. Visszaút nincs: ha a táblára később szükség van, újra létre kell hozni, és az adatokat is fel kell tölteni.

Ha nem biztos, hogy a tábla létezik, a hibát kikerülheted így:

```sql
DROP TABLE IF EXISTS tmp_import;
```

## Adatbázis létrehozása a MariaDB-ben

A MariaDB-ben a táblák **adatbázisokban** élnek, és az adatbázist is utasítás hozza létre:

```sql
CREATE DATABASE konyvtar;
USE konyvtar;
```

Az érettségin gyakran kész adatbázist kapsz, de az ilyen utasítás is előfordulhat. Az SQLite-ban egy adatbázis egyetlen fájl, ott `CREATE DATABASE` nincs; az itt futtatott feladatokban az adatbázis a feladat indulásakor mindig adott.

Az adatbázis törlése `DROP DATABASE konyvtar;`: ez minden táblát és adatot elvisz, használd óvatosan.

## Táblák listázása

Az SQLite-ban a létező táblákat a rendszertábla mutatja:

```sql
SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;
```

A MariaDB-ben erre a `SHOW TABLES;` utasítás való. A feladatokban a táblák ellenőrzésére a fenti `SELECT` szolgál, a kódod végén. Az utasításaidat mindig a végső `SELECT` **elé** írd, és ne töröld a `SELECT` sort.

## Gyakori hibák

- **Már létező tábla:** a `CREATE TABLE konyv` hibát ad, ha van már `konyv` tábla. Használhatod a `CREATE TABLE IF NOT EXISTS` formát.
- **Vessző az utolsó oszlop után:** az utolsó oszlop (vagy megkötés) után nincs vessző.
- **Hiányzó kulcs:** kulcs nélküli táblában azonos sorok ismétlődhetnek.
- **Hivatkozott tábla hiánya:** az idegen kulcs olyan táblára mutat, amelynek előbb léteznie kell, ezért a hivatkozott táblát hozd létre előbb.
- **DROP és DELETE összekeverése:** a `DELETE` csak a sorokat viszi, a `DROP` a táblát is.
- **Visszavonhatatlanság:** a `DROP TABLE` után nincs "mégsem"; mindig ellenőrizd a tábla nevét.

## Összefoglalás

- A `CREATE TABLE tabla (oszlop tipus megkotes, ...)` új, üres táblát hoz létre.
- A `PRIMARY KEY`, `NOT NULL`, `UNIQUE`, `DEFAULT` és a `FOREIGN KEY ... REFERENCES ...` megkötések a szerkezet részei.
- Az `ALTER TABLE ... ADD COLUMN` utólag új oszlopot ad egy táblához.
- A `DROP TABLE` a táblát az adataival együtt törli, a `DELETE` csak a sorokat.
- MariaDB-ben a `CREATE DATABASE` hozza létre az adatbázist; a típusnevek (`INT`, `VARCHAR`, `DATE`) eltérnek az SQLite-tól.
