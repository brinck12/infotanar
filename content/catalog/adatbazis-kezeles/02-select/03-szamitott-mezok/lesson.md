---
slug: szamitott-mezok
title: Számított mezők
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az eredmény lehet több, mint a tábla

A `SELECT` után nemcsak mezőneveket írhatunk, hanem **kifejezéseket** is: az adatbázis minden soron kiszámolja az értéket, és új oszlopként megmutatja. Így a táblában nem tárolt adatot (például egy készlet értékét) is megkapjuk. Ezt hívjuk **számított mezőnek**.

A példákban ez a `termek` tábla szerepel:

| id | nev | kategoria | ar | keszlet |
|---|---|---|---|---|
| 1 | Tej | tej | 330 | 12 |
| 2 | Kenyer | pek | 480 | 0 |
| 3 | Alma | zold | 290 | 25 |

## Aritmetika

A műveletek jelei: `+`, `-`, `*`, `/`. A művelet sorrend ugyanaz, mint a matematikában: előbb a szorzás és osztás, utána az összeadás és kivonás. Zárójellel felülírható.

```sql
SELECT nev, ar * keszlet AS ertek
FROM termek;
```

| nev | ertek |
|---|---|
| Tej | 3960 |
| Kenyer | 0 |
| Alma | 7250 |

Az `ar * keszlet` soronként számolódik: a tej `330 * 12 = 3960`. A kiszámított oszlopnak **mindig adj aliast** (`AS ertek`): enélkül a fejléc maga a kifejezés lenne, ami csúnya és nehezen használható.

Konstans is szerepelhet a kifejezésben:

```sql
SELECT nev, ar + 100 AS szallitassal, (ar - 30) * 2 AS ketto
FROM termek;
```

| nev | szallitassal | ketto |
|---|---|---|
| Tej | 430 | 600 |
| Kenyer | 580 | 900 |
| Alma | 390 | 520 |

**Próbáld ki:** számold ki egy taxis fuvar hasznát: a díjból vond le a kilométerenkénti költséget.

## Az osztás figyelmeztetése

A `/` az SQLite-ban két egész számnál **egész osztást** végez (`7 / 2` eredménye `3`), a MariaDB-ben viszont tizedes törtet ad (`3.5000`). Hogy ne okozzon meglepetést, ebben a modulban nem osztunk egész számokkal; a kerekítéssel és a pontos osztással a függvényes modulban foglalkozunk.

## Szövegek összefűzése

A szövegeket is lehet számított mezővé alakítani. Az SQL szabványos jele a `||`:

```sql
SELECT nev || ' (' || kategoria || ')' AS cimke
FROM termek;
```

| cimke |
|---|
| Tej (tej) |
| Kenyer (pek) |
| Alma (zold) |

Az állandó szövegeket aposztróf közé tesszük, és a `||` köti össze őket a mezőkkel. A szóközöket és a zárójeleket magunknak kell beírni, mert az összefűzés semmit sem tesz hozzá.

### Eltérés a MariaDB-ben

A **MariaDB-ben a `||` nem szövegösszefűzés** (alap beállításban logikai VAGY). Ott a `CONCAT` függvényt használjuk, amelynek a részeit vesszővel soroljuk fel:

```sql
SELECT CONCAT(nev, ' (', kategoria, ')') AS cimke
FROM termek;
```

Az eredmény ugyanaz. Az érettségin a MariaDB `CONCAT`-ot kell használnod; az InfoTanár szerkesztője SQLite-ot futtat, ezért itt a `||` a működő megoldás. A két jelölés gondolata azonos: szövegrészeket sorba fűzünk.

## Szám és szöveg keverése

Ha számot fűzöl szöveghez, az SQLite magától szöveggé alakítja:

```sql
SELECT nev || ': ' || ar || ' Ft' AS sor
FROM termek;
```

| sor |
|---|
| Tej: 330 Ft |
| Kenyer: 480 Ft |
| Alma: 290 Ft |

## Gyakori hibák

1. **Hiányzó alias.** A kiszámított oszlop neve a kifejezés lesz, és a feladat más nevet vár.
2. **Szöveg `+` jellel összefűzése.** SQL-ben a `'a' + 'b'` nem szöveg, hanem számolás (az SQLite 0-t ad). Összefűzni `||`-lel vagy `CONCAT`-tal kell.
3. **Hiányzó szóköz.** A `nev || kategoria` eredménye `Tejtej`; a szóközt be kell írni: `nev || ' ' || kategoria`.
4. **Zárójel kifelejtése.** `ar - 30 * 2` mást ad, mint `(ar - 30) * 2`.

## Összefoglalás

- A `SELECT` után kifejezés is állhat: `ar * keszlet AS ertek`.
- A kifejezés minden soron kiértékelődik; a számított oszlopnak adj aliast.
- Szövegösszefűzés: `||` (SQLite), `CONCAT(...)` (MariaDB).
- Egész számok osztása SQLite és MariaDB között eltér; kerüld, amíg nem tanulod meg a kerekítést.
