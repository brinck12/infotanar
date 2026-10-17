---
slug: szoveg-es-szam-fuggvenyek
title: Szöveg- és számfüggvények
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az a függvény az SQL-ben?

Eddig a lekérdezéseid az oszlopok értékét úgy hozták vissza, ahogy a táblában áll. Sokszor viszont nem a nyers értékre van szükség: nagybetűs névre, kerekített számra, a cím első néhány betűjére. Erre valók a **függvények**.

A függvény olyan kis gép: bemenetként kap egy vagy több értéket, és egy újat ad vissza. A neve után zárójelben adod meg a bemenetet: `UPPER(szerzo)`. A lekérdezés a `SELECT` után bárhol használhatja, ahol eddig oszlopnevet írtál, és érdemes `AS` aliast adni az eredménynek.

Ebben a leckében ezt a kis táblát használjuk:

A `konyv` tábla:

| `id` | `cim` | `szerzo` | `ar` | `ertekeles` |
|---|---|---|---|---|
| 1 | Egri csillagok | Gardonyi Geza | 3490 | 4.667 |
| 2 | Tuskevar | Fekete Istvan | 2990 | 4.253 |
| 3 | Pomade | Szabo Magda | 3190 | 3.912 |

## LENGTH: hány karakter?

A `LENGTH(szöveg)` a szöveg karaktereinek számát adja, a szóközöket és írásjeleket is beleértve.

```sql
SELECT cim, LENGTH(cim) AS hossz
FROM konyv;
```

Eredmény:

| `cim` | `hossz` |
|---|---|
| Egri csillagok | 14 |
| Tuskevar | 8 |
| Pomade | 6 |

**Próbáld ki:** írd ki a szerzők nevének hosszát!

## UPPER és LOWER: nagy- és kisbetű

Az `UPPER` csupa nagybetűssé, a `LOWER` csupa kisbetűssé alakítja a szöveget. Ez akkor hasznos, ha a tárolt szöveg vegyes írású, de egységesen akarod látni.

```sql
SELECT UPPER(szerzo) AS nagy, LOWER(szerzo) AS kicsi
FROM konyv;
```

Eredmény:

| `nagy` | `kicsi` |
|---|---|
| GARDONYI GEZA | gardonyi geza |
| FEKETE ISTVAN | fekete istvan |
| SZABO MAGDA | szabo magda |

## SUBSTR: részlet kivágása

A `SUBSTR(szöveg, kezdet, hossz)` a szöveg egy darabját adja. A kezdőpozíció **1-től** számít: az első karakter az 1. Ha a hosszat elhagyod, a szöveg végéig tart.

```sql
SELECT szerzo, SUBSTR(szerzo, 1, 5) AS eleje, SUBSTR(szerzo, 7) AS vege
FROM konyv;
```

Eredmény:

| `szerzo` | `eleje` | `vege` |
|---|---|---|
| Gardonyi Geza | Gardo | yi Geza |
| Fekete Istvan | Feket |  Istvan |
| Szabo Magda | Szabo | Magda |

**Próbáld ki:** add meg minden cím első három betűjét nagybetűvel! Itt két függvény áll egymásba ágyazva: `UPPER(SUBSTR(...))`. Belülről kifelé értékelődik ki.

## Szövegek összefűzése

Két szöveget a `||` jellel fűzhetsz össze:

```sql
SELECT szerzo || ': ' || cim AS teljes
FROM konyv;
```

Eredmény:

| `teljes` |
|---|
| Gardonyi Geza: Egri csillagok |
| Fekete Istvan: Tuskevar |
| Szabo Magda: Pomade |

## REPLACE: csere a szövegben

A `REPLACE(szöveg, mit, mire)` a szövegben minden `mit` részletet kicserél `mire`-re. A keresés kis- és nagybetű-érzékeny.

```sql
SELECT cim, REPLACE(cim, ' ', '_') AS azonosito
FROM konyv;
```

Eredmény:

| `cim` | `azonosito` |
|---|---|
| Egri csillagok | Egri_csillagok |
| Tuskevar | Tuskevar |
| Pomade | Pomade |

## ROUND és ABS: számok

A `ROUND(szám, tizedesek)` kerekít. Ha a második értéket elhagyod, egészre kerekít. Az `ABS(szám)` az abszolút értéket adja, vagyis az előjelet elhagyja. Az alábbi példában a `3000` Ft-tól való eltérést számoljuk, irány nélkül.

```sql
SELECT cim, ROUND(ertekeles, 1) AS kerekitett, ABS(ar - 3000) AS elteres
FROM konyv;
```

Eredmény:

| `cim` | `kerekitett` | `elteres` |
|---|---|---|
| Egri csillagok | 4.7 | 490 |
| Tuskevar | 4.3 | 10 |
| Pomade | 3.9 | 190 |

Vedd észre, hogy a kerekített érték is tizedes alakban jelenik meg (`4.3`). A `ROUND(x, 0)` eredménye is valós szám, például `4.0`.

## És az érettségi MariaDB-je?

Az érettségin MariaDB-t használsz, itt pedig SQLite fut. A függvények nagy része ugyanaz, néhány neve vagy működése eltér:

| Mit csinál | SQLite (itt) | MariaDB (érettségi) |
|---|---|---|
| Karakterek száma | `LENGTH(sz)` | `CHAR_LENGTH(sz)` (a MariaDB `LENGTH` a bájtokat számolja, ékezetes betűnél több) |
| Részlet | `SUBSTR(sz, 1, 3)` | `SUBSTRING(sz, 1, 3)` (a `SUBSTR` is működik) |
| Összefűzés | `a \|\| b` | `CONCAT(a, b)` (a MariaDB-ben a `\|\|` alapból logikai VAGY!) |
| Nagy-/kisbetű | `UPPER`, `LOWER` | ugyanaz |
| Csere | `REPLACE` | ugyanaz |
| Kerekítés, abszolút érték | `ROUND`, `ABS` | ugyanaz |

A lényeg a gondolkodásmód, a függvény neve egy pillantás a feladatlapon. Az itteni feladatokat SQLite-ban kell megoldani, de tudd, hogyan írnád át MariaDB-re.

## Gyakori hibák

- A `SUBSTR` kezdőpozíciója 1-től indul, nem 0-tól. A `SUBSTR(szerzo, 0, 3)` ezért nem azt adja, amit vársz.
- Az aposztróf a szöveg határa: `REPLACE(cim, ' ', '_')`. Idézőjel (`"`) nem szöveg-, hanem névjelölő.
- Elfelejtett alias: a `SELECT UPPER(szerzo)` oszlopneve maga a kifejezés lesz. Adj neki nevet az `AS`-szal.
- A `REPLACE` kis- és nagybetű-érzékeny: ha az adat vegyes, előbb alakítsd át `LOWER`-rel.

## Összefoglalás

- A függvény egy értékből újat készít: `függvény(érték)`.
- Szöveghez: `LENGTH`, `UPPER`, `LOWER`, `SUBSTR`, `REPLACE`, az összefűzéshez `||`.
- Számhoz: `ROUND(szám, tizedes)`, `ABS(szám)`.
- A függvények egymásba ágyazhatók, belülről kifelé értékelődnek ki.
- MariaDB-ben: `CHAR_LENGTH`, `SUBSTRING`, `CONCAT`.
