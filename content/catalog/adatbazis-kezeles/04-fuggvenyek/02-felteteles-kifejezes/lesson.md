---
slug: felteteles-kifejezes
title: Feltételes kifejezés (CASE)
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Ha ez, akkor az

Gyakori feladat, hogy a pontszámból jegyet, az árból kategóriát kell csinálni: ha a pont legalább 85, akkor 5-ös, különben ha legalább 70, akkor 4-es, és így tovább. Az SQL-ben erre a **`CASE`** kifejezés való. Olyan, mint a programozásban az `if ... elif ... else`, csak egy értéket ad vissza, ami a `SELECT`-ben egy új oszlop lesz.

A lecke első példáihoz ez a két tábla kell:

A `dolgozat` tábla:

| `id` | `nev` | `pont` |
|---|---|---|
| 1 | Kiss Anna | 92 |
| 2 | Nagy Bela | 70 |
| 3 | Toth Csaba | 54 |
| 4 | Szabo Dora | 38 |

A `termek` tábla:

| `id` | `nev` | `ar` | `keszlet` |
|---|---|---|---|
| 1 | Fuzet | 250 | 40 |
| 2 | Hatizsak | 8900 | 0 |
| 3 | Toll | 990 | 3 |

## A CASE felépítése

```text
CASE
  WHEN feltétel1 THEN érték1
  WHEN feltétel2 THEN érték2
  ELSE érték3
END
```

A feltételeket **fentről lefelé** vizsgálja. Az első igaz `WHEN` ágnál megáll, és annak az értékét adja. Ha egyik sem igaz, az `ELSE` érték jön. A kifejezést `END` zárja, utána jöhet az `AS` alias.

```sql
SELECT nev, pont,
  CASE
    WHEN pont >= 85 THEN 5
    WHEN pont >= 70 THEN 4
    WHEN pont >= 55 THEN 3
    WHEN pont >= 40 THEN 2
    ELSE 1
  END AS jegy
FROM dolgozat;
```

Eredmény:

| `nev` | `pont` | `jegy` |
|---|---|---|
| Kiss Anna | 92 | 5 |
| Nagy Bela | 70 | 4 |
| Toth Csaba | 54 | 2 |
| Szabo Dora | 38 | 1 |

Nézd meg Toth Csabát: 54 pontja nem éri el az 55-öt, ezért a 2-es ágra esik. Nagy Béla 70 pontos, ő éppen elérte a 4-es határát.

**Próbáld ki:** módosítsd a határokat úgy, hogy 90 ponttól legyen 5-ös!

## Miért számít a sorrend?

Mivel az első igaz ág nyer, a feltételeket a szigorúbbtól a lazább felé kell írni. Ha a `pont >= 40` ág állna legelöl, a 92 pontos Anna is 2-est kapna, hiszen a 92 is legalább 40.

## Szöveges eredmény

A `CASE` szöveget is visszaadhat, ilyenkor az értékek aposztrófok közé kerülnek:

```sql
SELECT nev, ar,
  CASE
    WHEN ar < 1000 THEN 'olcso'
    WHEN ar < 5000 THEN 'kozepes'
    ELSE 'draga'
  END AS kategoria
FROM termek;
```

Eredmény:

| `nev` | `ar` | `kategoria` |
|---|---|---|
| Fuzet | 250 | olcso |
| Hatizsak | 8900 | draga |
| Toll | 990 | olcso |

Az ágak értékeinek érdemes azonos típusúaknak lenniük (mind szám vagy mind szöveg), ellenkező esetben a kimenet zavaros.

## Mi van az ELSE nélkül?

Az `ELSE` elhagyható. Ilyenkor, ha egyik feltétel sem igaz, az eredmény `NULL`, vagyis nincs érték:

```sql
SELECT nev, keszlet,
  CASE
    WHEN keszlet = 0 THEN 'elfogyott'
  END AS jelzes
FROM termek;
```

Eredmény:

| `nev` | `keszlet` | `jelzes` |
|---|---|---|
| Fuzet | 40 | NULL |
| Hatizsak | 0 | elfogyott |
| Toll | 3 | NULL |

Ez néha hasznos, de legtöbbször jobb mindig kiírni az `ELSE` ágat, hogy ne maradjon meglepetés.

## Számítás az ágakban

Az ágak értéke nemcsak állandó lehet, hanem számítás is. Például a bolt akciót hirdet: aki 1000 Ft-nál olcsóbb terméket vesz, azt 10 Ft-tal olcsóbban kapja, a többi marad.

```sql
SELECT nev, ar,
  CASE
    WHEN ar < 1000 THEN ar - 10
    ELSE ar
  END AS akcios_ar
FROM termek;
```

Eredmény:

| `nev` | `ar` | `akcios_ar` |
|---|---|---|
| Fuzet | 250 | 240 |
| Hatizsak | 8900 | 8900 |
| Toll | 990 | 980 |

## És a MariaDB IF függvénye?

Az érettségin használt MariaDB-ben van egy rövidebb forma is: `IF(feltétel, ha_igaz, ha_hamis)`. Egyetlen feltételnél kényelmes:

```text
IF(pont >= 40, 'megfelelt', 'nem felelt meg')
```

Az SQLite-ban nincs `IF` függvény, ezért itt a `CASE`-t használjuk. A `CASE` a MariaDB-ben is működik, tehát mindig biztonságos választás. Ugyanaz kétféleképp, MariaDB-ben:

```text
CASE WHEN pont >= 40 THEN 'megfelelt' ELSE 'nem felelt meg' END
```

## Gyakori hibák

- Elfelejtett `END`: a `CASE` mindig `END`-del zárul.
- Rossz sorrend: a laza feltétel elöl elnyeli a szigorúbbakat.
- Vessző a `WHEN` ágak között: az ágakat nem kell vesszővel elválasztani.
- Szöveg idézőjel nélkül: a `THEN olcso` hibás, `THEN 'olcso'` a helyes.
- Elfelejtett alias: a `CASE` oszlopának adj nevet az `AS`-szal, különben a teljes kifejezés lesz a fejléc.

## Összefoglalás

- A `CASE WHEN ... THEN ... ELSE ... END` feltételes értéket ad, fentről lefelé vizsgálja az ágakat.
- Az első igaz ág nyer, ezért a szigorúbb feltétel kerül előre.
- Az `ELSE` nélküli, nem teljesülő `CASE` `NULL`-t ad.
- Az ágak értéke lehet szám, szöveg vagy számítás.
- MariaDB-ben egyszerű esetre az `IF(feltétel, igaz, hamis)` is jó, de a `CASE` mindkét rendszerben működik.
