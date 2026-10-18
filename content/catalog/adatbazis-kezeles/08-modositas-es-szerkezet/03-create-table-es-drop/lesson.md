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

Eddig a táblák készen álltak. Az adatbázis és a táblák is SQL utasítással jönnek létre. Az utasításoknak ezt a csoportját **adatdefiníciós** utasításoknak nevezik: nem az adatokat, hanem a **szerkezetet** határozzák meg. Ebben a leckében MariaDB-ben dolgozunk, így, ahogy az érettségin is: adatbázis létrehozása (`CREATE DATABASE`), tábla létrehozása (`CREATE TABLE`), új oszlop (`ALTER TABLE`), tábla ürítése és törlése (`TRUNCATE TABLE`, `DROP TABLE`).

## Az adatbázis létrehozása

A MariaDB-ben a táblák **adatbázisokban** élnek. Az adatbázist is utasítás hozza létre, és a `USE` mondja meg, hogy a következő utasítások melyikben dolgozzanak:

```sql
CREATE DATABASE konyvtar;
USE konyvtar;
```

Az adatbázis törlése `DROP DATABASE konyvtar;`: ez minden táblát és adatot elvisz, használd óvatosan.

## CREATE TABLE

```sql
CREATE TABLE konyv (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cim VARCHAR(100) NOT NULL,
  szerzo VARCHAR(60),
  megjelenes DATE,
  ev INT
) ENGINE=InnoDB;
```

A tábla neve után zárójelben, vesszővel elválasztva az oszlopok állnak: **oszlopnév, adattípus, megkötések**. Az utolsó oszlop után nincs vessző. A zárójel után az `ENGINE=InnoDB` a táblamotort adja meg: az InnoDB ismeri az idegen kulcsokat, ezt használjuk. Az utasítás pontosvesszővel zárul.

A tábla létrejön, de **üres**. A sorokat `INSERT`-tel kell felvenni. Az `id` oszlop `AUTO_INCREMENT`, ezért nem kell megadni, a MariaDB 1-től kezdve sorban kiosztja:

```sql
INSERT INTO konyv (cim, szerzo, megjelenes, ev)
VALUES ('A kis herceg', 'Saint-Exupery', '1943-04-06', 1943),
       ('Egri csillagok', 'Gardonyi Geza', '1901-01-01', 1901);

SELECT id, cim, megjelenes FROM konyv;
```

Az eredmény:

| id | cim | megjelenes |
|---|---|---|
| 1 | A kis herceg | 1943-04-06 |
| 2 | Egri csillagok | 1901-01-01 |

**Próbáld ki:** hozz létre egy `film` táblát `id`, `cim` és `hossz` oszlopokkal, és vigyél fel két filmet az `id` megadása nélkül!

## Adattípusok

| Mit tárol | MariaDB típus | Példa |
|---|---|---|
| egész szám | `INT` | `1943` |
| tizedes szám | `DECIMAL(10,2)`, `DOUBLE` | `1299.90` |
| rövid szöveg | `VARCHAR(50)` | `'Anna'` |
| hosszú szöveg | `TEXT` | egy bekezdés |
| dátum | `DATE` | `'2026-03-05'` |
| dátum és idő | `DATETIME` | `'2026-03-05 14:30:00'` |

A `VARCHAR` után zárójelben a legnagyobb **hosszt** kell megadni (karakterben). A dátumot mindig idézőjelek között, `'ÉÉÉÉ-HH-NN'` alakban írjuk.

## Megkötések

Az oszlop után **megkötések** (constraint) állhatnak:

- `PRIMARY KEY`: az oszlop egyedi azonosító, nem lehet `NULL`, és nem ismétlődhet.
- `AUTO_INCREMENT`: az adatbázis automatikusan számozza (csak egész számú kulcsra).
- `NOT NULL`: az oszlop nem maradhat üresen. Ha felvételkor nem adsz értéket, hibát kapsz.
- `UNIQUE`: az értékek nem ismétlődhetnek (például e-mail cím).
- `DEFAULT 0`: alapértelmezett érték, ha a felvételkor nem adsz meg másikat.

Az **idegen kulcs** két táblát kapcsol össze: egy oszlop értéke egy másik tábla kulcsára mutat.

```sql
CREATE TABLE rendeles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vevo_id INT NOT NULL,
  osszeg INT,
  FOREIGN KEY (vevo_id) REFERENCES vevo(id)
) ENGINE=InnoDB;
```

A `FOREIGN KEY (vevo_id) REFERENCES vevo(id)` kimondja: a `vevo_id` értéke a `vevo` tábla valamelyik `id`-ja. A két oszlop típusa egyezzen (itt mindkettő `INT`). Az InnoDB ellenőrzi is: nem engedi olyan vevő rendelését felvenni, aki nincs a `vevo` táblában. A kapcsolt táblák a `JOIN`-nál tanult módon lekérdezhetők.

## Új oszlop utólag: ALTER TABLE

Ha már létező táblához új oszlop kell, nem kell újra létrehozni a táblát:

```sql
ALTER TABLE diak ADD email VARCHAR(60);
```

Az új oszlop minden sorban `NULL`. Az `UPDATE` tölti ki:

```sql
UPDATE diak SET email = CONCAT(REPLACE(LOWER(nev), ' ', '.'), '@suli.hu');
```

Egy `Kiss Anna` nevű diák e-mail címe így `kiss.anna@suli.hu` lesz. A `CONCAT` összefűzi a szövegeket.

## TRUNCATE és DROP: ürítés és törlés

Három utasítás viszi el az adatot, de mást hagynak hátra:

| Utasítás | Mit tesz | A tábla utána |
|---|---|---|
| `DELETE FROM naplo WHERE ...` | a feltételnek megfelelő sorokat törli | megmarad |
| `TRUNCATE TABLE naplo;` | **minden** sort töröl, a számlálót újraindítja | megmarad, üres |
| `DROP TABLE naplo;` | a táblát a szerkezetével együtt törli | nincs többé |

```sql
TRUNCATE TABLE tmp_import;
DROP TABLE tmp_regi;
```

Visszaút nincs: a `DROP TABLE` után a táblát újra kell létrehozni, és az adatokat is fel kell tölteni. Ha nem biztos, hogy a tábla létezik, a hibát kikerülheted így:

```sql
DROP TABLE IF EXISTS tmp_regi;
```

## Hogyan látod az eredményt?

A létező táblák listáját a `SHOW TABLES;`, egy tábla szerkezetét a `DESCRIBE konyv;` mutatja phpMyAdminban vagy a MariaDB parancssorában. A gyakorlófelületen a módosítás hatását egy `SELECT`-tel ellenőrizzük: az utasításaidat mindig a kód végén álló `SELECT` **elé** írd, és ne töröld a `SELECT` sort. A rendszer a `SELECT` eredményét hasonlítja az elvárthoz.

## Gyakori hibák

- **Már létező tábla:** a `CREATE TABLE konyv` hibát ad, ha van már `konyv` tábla. Használhatod a `CREATE TABLE IF NOT EXISTS` formát.
- **Vessző az utolsó oszlop után:** az utolsó oszlop (vagy megkötés) után nincs vessző.
- **`VARCHAR` hossz nélkül:** a `cim VARCHAR NOT NULL` hibás, kell a hossz: `VARCHAR(100)`.
- **Hivatkozott tábla hiánya:** az idegen kulcs olyan táblára mutat, amelynek előbb léteznie kell, ezért a hivatkozott táblát hozd létre előbb.
- **Különböző kulcstípus:** ha a `vevo.id` `INT`, a `rendeles.vevo_id` ne legyen `VARCHAR`.
- **DROP és DELETE összekeverése:** a `DELETE` és a `TRUNCATE` csak a sorokat viszi, a `DROP` a táblát is.
- **Visszavonhatatlanság:** a `DROP TABLE` után nincs "mégsem"; mindig ellenőrizd a tábla nevét.

## Összefoglalás

- `CREATE DATABASE adatbazis;` és `USE adatbazis;` létrehozza, majd kiválasztja az adatbázist.
- A `CREATE TABLE tabla (oszlop tipus megkotes, ...) ENGINE=InnoDB;` új, üres táblát hoz létre; tipikus típusok: `INT`, `VARCHAR(n)`, `DATE`, `DECIMAL(10,2)`.
- Az `id INT AUTO_INCREMENT PRIMARY KEY` automatikusan számozott kulcs; az `INSERT` oszloplistája kihagyhatja.
- A `FOREIGN KEY (oszlop) REFERENCES tabla(oszlop)` idegen kulcsot ad.
- Az `ALTER TABLE tabla ADD oszlop tipus;` utólag új oszlopot ad.
- A `TRUNCATE TABLE` kiüríti, a `DROP TABLE` teljesen törli a táblát.
