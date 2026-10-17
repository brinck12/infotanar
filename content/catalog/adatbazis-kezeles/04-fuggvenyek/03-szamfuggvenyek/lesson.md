---
slug: szamfuggvenyek
title: Számolás és számfüggvények
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az SQL számológép is

A lekérdezés nemcsak kiolvassa az adatot, hanem ki is számolhat belőle valamit. Ehhez nem kell semmi új: a `SELECT` után matematikai kifejezést írhatsz, és az eredmény új oszlop lesz. A számjegyek tizedesjele **pont**: `1.27`, nem `1,27`.

A példákban ez a két tábla szerepel.

A `termek` tábla:

| `id` | `nev` | `ar` |
|---|---|---|
| 1 | Füzet | 390 |
| 2 | Toll | 140 |
| 3 | Radír | 90 |

A `csomag` tábla (egy dobozba 4 darab fér):

| `termek` | `darab` |
|---|---|
| Füzet | 10 |
| Toll | 6 |
| Radír | 3 |

## Műveletek oszlopokkal

A négy alapművelet jele: `+`, `-`, `*` (szorzás), `/` (osztás). Két füzet ára:

```sql
SELECT nev, ar * 2 AS ketto_ara
FROM termek;
```

A lekérdezés soronként kiszámolja az `ar * 2` értékét:

| `nev` | `ketto_ara` |
|---|---|
| Füzet | 780 |
| Toll | 280 |
| Radír | 180 |

Ugyanúgy mint a matematikában: a szorzás és az osztás előbb történik, mint az összeadás és a kivonás. Zárójellel te szabod meg a sorrendet: `(a + b) * 2`.

**Próbáld ki:** számold ki minden termék árát 10%-kal csökkentve (`ar * 0.9`).

## Az osztás törtet ad

Az SQL-ben a `/` **valódi osztás**: `10 / 4` eredménye `2.5`, nem `2`.

```sql
SELECT termek, darab / 4 AS doboz
FROM csomag;
```

| `termek` | `doboz` |
|---|---|
| Füzet | 2.5 |
| Toll | 1.5 |
| Radír | 0.75 |

A 2,5 doboz persze nem létezik. Ilyenkor kell **kerekíteni**. Erre való a következő néhány függvény.

## ROUND: kerekítés

A `ROUND(szám)` a **legközelebbi egész számra** kerekít. A pontosan félúton lévő számot (például 2,5) felfelé kerekíti.

```sql
SELECT termek, ROUND(darab / 4) AS doboz
FROM csomag;
```

| `termek` | `doboz` |
|---|---|
| Füzet | 3 |
| Toll | 2 |
| Radír | 1 |

Megadhatod azt is, hány **tizedesjegy** maradjon: `ROUND(szám, hány tizedes)`.

```sql
SELECT termek, ROUND(darab / 4, 1) AS doboz
FROM csomag;
```

| `termek` | `doboz` |
|---|---|
| Füzet | 2.5 |
| Toll | 1.5 |
| Radír | 0.8 |

A 0,75 egy tizedesre kerekítve 0,8. Gyakori használat a bruttó ár: a 27%-os ÁFÁ az árat 1,27-del szorozza.

```sql
SELECT nev, ROUND(ar * 1.27) AS brutto
FROM termek;
```

| `nev` | `brutto` |
|---|---|
| Füzet | 495 |
| Toll | 178 |
| Radír | 114 |

A füzet számítása: 390 · 1,27 = 495,3, ami egészre kerekítve 495.

**Próbáld ki:** írd ki a termékek árát ezer forintra osztva, két tizedesre kerekítve.

## FLOOR és CEIL: lefelé és felfelé

A `ROUND` a közelebbi egészet választja. De van, amikor **mindig lefelé** vagy **mindig felfelé** kell kerekíteni:

- `FLOOR(szám)`: lefelé kerekít (a "padló"), `FLOOR(2.5)` az `2`.
- `CEIL(szám)`: felfelé kerekít (a "mennyezet"), `CEIL(2.5)` az `3`.

A dobozos példában mindkettőnek értelme van. A **teli** dobozok számát a `FLOOR` adja, a **szükséges** dobozok számát (a félig telit is beleszámolva) a `CEIL`:

```sql
SELECT termek, FLOOR(darab / 4) AS teli, CEIL(darab / 4) AS szukseges
FROM csomag;
```

| `termek` | `teli` | `szukseges` |
|---|---|---|
| Füzet | 2 | 3 |
| Toll | 1 | 2 |
| Radír | 0 | 1 |

Ha a szám pontosan egész (például `FLOOR(2.0)`), a `FLOOR` és a `CEIL` ugyanazt adja.

**Próbáld ki:** hány darab marad ki a teli dobozokból? Számold ki kézzel, majd a következő szakasz után ellenőrizd.

## MOD: a maradék

Az osztás maradékát a `MOD(a, b)` adja. A 10 elosztva 4-gyel 2 egész, és marad 2, így `MOD(10, 4)` az `2`.

```sql
SELECT termek, MOD(darab, 4) AS marad
FROM csomag;
```

| `termek` | `marad` |
|---|---|
| Füzet | 2 |
| Toll | 2 |
| Radír | 3 |

Ez a válasz az előbbi kérdésre: ennyi darab nem fér már teli dobozba.

## Páros vagy páratlan

Egy szám pontosan akkor páros, ha 2-vel osztva a maradék 0. Ezért a `MOD(szám, 2)` a páros szám kereséséhez kell:

```sql
SELECT id, nev
FROM termek
WHERE MOD(id, 2) = 0;
```

| `id` | `nev` |
|---|---|
| 2 | Toll |

Ugyanez a minta bármely "minden n-edik" kérdésre jó: `MOD(id, 5) = 0` az ötödik, tizedik, … sort választja ki.

## Gyakori hibák

- **Tizedesvessző.** `ar * 1,27` hibás, mert a vessző az SQL-ben elválasztó. Tizedespontot írj: `1.27`.
- **`ROUND` a `FLOOR` helyett.** Ha mindig lefelé kell kerekíteni, a `ROUND(2.7)` az `3`, de a `FLOOR(2.7)` az `2`.
- **Hiányzó zárójel az átlagnál.** Az `(a + b) / 2` helyes. Az `a + b / 2` csak a `b`-t osztja el.
- **Egy `=` jel a páros vizsgálatban.** A `MOD(id, 2)` önmagában még nem feltétel: `MOD(id, 2) = 0` kell.
- **Osztás nullával.** A `5 / 0` nem hibát, hanem üres (`NULL`) értéket ad.

## Összefoglalás

| Függvény | Mit csinál | Példa | Eredmény |
|---|---|---|---|
| `ROUND(x)` | egészre kerekít | `ROUND(2.5)` | `3` |
| `ROUND(x, n)` | `n` tizedesre kerekít | `ROUND(0.75, 1)` | `0.8` |
| `FLOOR(x)` | lefelé kerekít | `FLOOR(2.7)` | `2` |
| `CEIL(x)` | felfelé kerekít | `CEIL(2.1)` | `3` |
| `MOD(a, b)` | az osztás maradéka | `MOD(10, 4)` | `2` |

A `+ - * /` jelekkel számolhatsz oszlopokkal. A `/` tört eredményt ad, amit a `ROUND`, `FLOOR` vagy `CEIL` egésszé tesz. A maradékot a `MOD` adja.
