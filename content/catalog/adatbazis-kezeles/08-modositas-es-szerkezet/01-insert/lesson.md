---
slug: insert
title: Új sorok felvétele, INSERT
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az adatbázis nemcsak olvasható

Eddig csak **kérdeztél**: a `SELECT` semmit sem változtat a táblákon. A valódi adatbázis azonban él: új diák iratkozik be, új rendelés érkezik. Az adatot módosító utasítások (`INSERT`, `UPDATE`, `DELETE`) **megváltoztatják a táblát**, és nem adnak vissza találati listát. Ebben a leckében az első közülük, az `INSERT` következik.

A példákban ez a `diak` tábla szerepel:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Anna | 9.A | 60 |
| 2 | Bela | 9.B | 90 |

Az `id` oszlop `INTEGER PRIMARY KEY`: egyedi azonosító, amelyet az adatbázis is ki tud osztani.

## INSERT minden oszlop megadásával

```sql
INSERT INTO diak VALUES (3, 'Csaba', '10.A', 75);
```

A `VALUES` után zárójelben **minden oszlop értéke** áll, **a tábla oszlopainak sorrendjében**. A szöveget idézőjelek közé írjuk, a számot nem. Az utasítás végén pontosvessző áll. A tábla ezután három soros:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Anna | 9.A | 60 |
| 2 | Bela | 9.B | 90 |
| 3 | Csaba | 10.A | 75 |

Ha olyan `id`-t adnál meg, amely már létezik, az adatbázis hibát jelez: az elsődleges kulcs nem ismétlődhet.

## INSERT oszloplistával

Biztonságosabb (és az érettségin gyakoribb) a forma, amelyben **megnevezed az oszlopokat**:

```sql
INSERT INTO diak (nev, osztaly) VALUES ('Dora', '9.A');
```

Itt csak a felsorolt oszlopok kapnak értéket, a többi automatikusan:

- az `id` (egész elsődleges kulcs) **a következő szabad szám** lesz, vagyis 4;
- a `pont` oszlop, amelynek nincs megadva érték, `NULL` marad, ha nincs alapértelmezett értéke.

A MariaDB-ben az automatikus számozáshoz az oszlopot `AUTO_INCREMENT`-tel kell definiálni; az SQLite-ban az `INTEGER PRIMARY KEY` ezt magától tudja. A felvételi utasítás mindkettőben ugyanaz.

Az oszloplistás forma előnye, hogy nem függ az oszlopok sorrendjétől, és ha később új oszlop kerül a táblába, a régi utasítás is működik.

**Próbáld ki:** vegyél fel egy diákot úgy, hogy a `pont` értékét is megadod, de az `id`-t nem!

## Több sor egyszerre

```sql
INSERT INTO diak (nev, osztaly, pont) VALUES
  ('Emil', '10.B', 55),
  ('Fanni', '9.A', 82),
  ('Geza', '10.B', 47);
```

A `VALUES` után több zárójeles sor állhat, vesszővel elválasztva. Ez rövidebb, és egyetlen lépésben fut le: ha az egyik sor hibás, az egész utasítás sikertelen.

## INSERT ... SELECT: másolás táblák között

Az új sorok egy **lekérdezésből** is jöhetnek. Tegyük fel, hogy van egy `kiemelt` táblánk (`id`, `nev`, `pont`), és ebbe másoljuk a 80 pont feletti diákokat:

```sql
INSERT INTO kiemelt (nev, pont)
SELECT nev, pont
FROM diak
WHERE pont >= 80;
```

Itt **nincs `VALUES`**: a `SELECT` oszlopainak száma és sorrendje egyezzen az oszloplistával. A `SELECT` lehet összetett is (`JOIN`, `GROUP BY`), így összesítő táblát is fel lehet vele tölteni.

## Hogyan látod az eredményt?

Mivel az `INSERT` nem ad vissza adatot, utána egy `SELECT`-tel ellenőrizd:

```sql
INSERT INTO diak (nev, osztaly, pont) VALUES ('Hanna', '9.B', 70);

SELECT id, nev, osztaly, pont FROM diak ORDER BY id;
```

A feladatokban is ez a minta: a kódod végén álló `SELECT` mutatja a tábla módosítás utáni állapotát, és a rendszer ezt hasonlítja az elvárthoz. A saját utasításod mindig a `SELECT` elé kerüljön, és ne töröld a `SELECT` sort.

## Gyakori hibák

- **Rossz oszlopsorrend:** `INSERT INTO diak VALUES ('Dora', 4, ...)` a szöveget az `id` helyére tenné.
- **Rossz számú érték:** ha az oszloplista három oszlopot nevez meg, három értéket kell adni.
- **Hiányzó idézőjel:** a szöveget idézőjelek közé kell írni (`'Dora'`), az idézőjelek nélküli szó oszlopnévnek számít.
- **Létező kulcs:** ugyanazzal az `id`-val kétszer nem lehet sort felvenni.
- **Pontosvessző elfelejtése:** két utasítás között kötelező; nélküle az adatbázis egyben próbálja olvasni őket.
- **Dupla futtatás:** ha az `INSERT`-et kétszer futtatod, két azonos sor kerül be (kulcs nélkül a tábla ezt nem akadályozza meg).

## Összefoglalás

- Az `INSERT INTO tabla VALUES (...)` minden oszlopot, az `INSERT INTO tabla (oszlopok) VALUES (...)` csak a felsoroltakat tölti ki.
- A megadatlan oszlop automatikus (kulcs) vagy `NULL` értéket kap.
- Egy utasítással több sor is felvehető, vesszővel elválasztott zárójelekkel.
- Az `INSERT ... SELECT` lekérdezés eredményét másolja egy táblába.
- Az eredményt mindig egy külön `SELECT`-tel ellenőrizd.
