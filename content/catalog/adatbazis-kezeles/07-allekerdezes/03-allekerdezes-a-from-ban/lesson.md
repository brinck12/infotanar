---
slug: allekerdezes-a-from-ban
title: Allekérdezés a FROM-ban, származtatott tábla
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Összesítés összesítésen

Egy bolt eladásaiból ki tudod számolni a napi bevételeket a `GROUP BY` segítségével. Mi a helyzet, ha a **legkisebb napi bevételre** vagy a **napi bevételek átlagára** van szükség? A `MIN(SUM(...))` nem működik: az összesítő függvényeket nem lehet egymásba ágyazni. Két lépés kell: előbb a napi összegek, aztán ezekből a minimum.

Erre való a **származtatott tábla**: a `FROM` után álló allekérdezés, amelynek eredményét úgy használod, mintha tábla lenne.

A példákban az `eladas` tábla szerepel:

| id | datum | db | egysegar |
|---|---|---|---|
| 1 | 2026-03-01 | 2 | 500 |
| 2 | 2026-03-01 | 1 | 300 |
| 3 | 2026-03-02 | 4 | 200 |
| 4 | 2026-03-03 | 1 | 900 |
| 5 | 2026-03-03 | 3 | 100 |

## Első lépés: a napi összegek

```sql
SELECT datum, SUM(db * egysegar) AS napi
FROM eladas
GROUP BY datum;
```

| datum | napi |
|---|---|
| 2026-03-01 | 1300 |
| 2026-03-02 | 800 |
| 2026-03-03 | 1200 |

## Második lépés: a származtatott tábla használata

Tedd ezt a lekérdezést zárójelbe, adj neki nevet, és válassz belőle:

```sql
SELECT MIN(napi) AS legkisebb
FROM (SELECT datum, SUM(db * egysegar) AS napi
      FROM eladas
      GROUP BY datum) AS n;
```

| legkisebb |
|---|
| 800 |

A belső lekérdezés egy ideiglenes táblát hoz létre `datum` és `napi` oszlopokkal, a külső ebből keresi a legkisebb értéket. A zárójel utáni `AS n` a származtatott tábla **neve**: a MariaDB megköveteli (nélküle hibaüzenetet kapsz), az SQLite nem, de szokjuk meg mindig kiírni. Az `AS` szó elhagyható, de a név nem.

**Próbáld ki:** cseréld a `MIN`-t `MAX`-ra, és nézd meg, melyik volt a legerősebb nap összege!

## Átlag a napi összegekből

```sql
SELECT ROUND(AVG(napi)) AS atlag
FROM (SELECT datum, SUM(db * egysegar) AS napi
      FROM eladas
      GROUP BY datum) AS n;
```

A napi összegek átlaga `(1300 + 800 + 1200) / 3 = 1100`. Fontos a különbség: az `AVG(db * egysegar)` a **tételek** átlagát adná, nem a napokét. A származtatott tábla azért kell, hogy az átlag a napi összegekből készüljön.

A `ROUND` az SQLite-ban lebegőpontos számot ad (`1100.0`). Ha egész szám kell, tedd köré a `CAST(... AS INTEGER)` átalakítást: `CAST(ROUND(AVG(napi)) AS INTEGER)`.

## Melyik nap volt a legkisebb?

A legkisebb érték megvan, de a **nap** neve is kell. Ehhez a származtatott táblából szűrünk, a szűrési érték pedig egy skaláris allekérdezés, amely újra a napi összegekből indul:

```sql
SELECT datum, napi
FROM (SELECT datum, SUM(db * egysegar) AS napi
      FROM eladas
      GROUP BY datum) AS n
WHERE napi = (SELECT MIN(napi)
              FROM (SELECT SUM(db * egysegar) AS napi
                    FROM eladas
                    GROUP BY datum) AS m);
```

| datum | napi |
|---|---|
| 2026-03-02 | 800 |

Első látásra hosszú, de három ismert darabból áll: egy származtatott tábla, egy skaláris allekérdezés a `WHERE`-ben, és abban megint egy származtatott tábla. Építsd fel mindig **belülről kifelé**: először a napi összegek lekérdezése, utána a minimum, végül a szűrés. Minden lépésnél futtasd le a részletet, és nézd meg az eredményt.

Az érettségi feladatokban az ilyen "napi összegek minimuma" típusú kérdés a nehezebbek közé tartozik, de a recept mindig ugyanaz.

## Mikor kell származtatott tábla?

- Ha összesítés **eredményéből** kell újabb összesítést vagy szűrést végezni (például a napi összegek legkisebbje, a csoportok átlaga).
- Ha egy számított oszlopra (alias) kell szűrni, amelyre a `WHERE` az adott szinten még nem lát rá. A származtatott táblán belül már megszületett az alias, ezért a külső `WHERE napi > 1000` működik.
- Ha előbb szűrt, csoportosított részeredményhez akarsz hozzákapcsolni más táblát.

## Gyakori hibák

- **Hiányzó név:** `FROM (SELECT ...)` név nélkül MariaDB-ben hibát ad. Írj mögé `AS n`-t.
- **Rossz szint:** a `MIN(SUM(...))` nem létezik. Az összesítő függvényeket nem ágyazhatod egymásba, kell a külön allekérdezés.
- **Az alias elérése a saját szintjén:** a `WHERE napi > ...` ugyanabban a lekérdezésben, ahol a `napi` az `AS`-sel keletkezik, nem biztos, hogy működik MariaDB-ben. A származtatott tábla megoldja.
- **Fölösleges oszlopok:** ha a belső lekérdezés olyan oszlopot is ad, amit a külső nem használ, az nem hiba, de nehezíti az olvasást.
- **Ugyanaz az összeg kétszer eltérő módon számolva:** a két belső lekérdezésben ugyanazt a képletet írd, különben a `=` összehasonlítás nem talál egyezést.

## Összefoglalás

- A `FROM` utáni zárójeles `SELECT` a **származtatott tábla**; nevet kell adni neki (`AS n`).
- Összesítés összesítésen (napi összegek minimuma, átlaga) csak így oldható meg.
- A "melyik nap" kérdéshez a minimumot skaláris allekérdezéssel hasonlítjuk a származtatott tábla soraihoz.
- Építsd belülről kifelé: először a belső lekérdezést ellenőrizd.
