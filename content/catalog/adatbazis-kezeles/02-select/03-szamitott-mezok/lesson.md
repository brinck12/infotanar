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

## Osztás

A `/` jel osztást végez, és az eredmény tizedes tört is lehet, ahogy az érettségin használt MariaDB-ben is. Az InfoTanár gyakorló szerkesztője ugyanígy viselkedik, mint az érettségi.

```sql
SELECT nev, ar / 2 AS fele
FROM termek;
```

| nev | fele |
|---|---|
| Tej | 165.0 |
| Kenyer | 240.0 |
| Alma | 145.0 |

A `7 / 2` eredménye tehát `3.5`, nem `3`. Ha egész értékre van szükséged, kerekíts: a `ROUND(ar / 7)` kerekít, a `FLOOR(ar / 7)` lefelé kerekít egészre.

## Szövegek összefűzése

A szövegeket is lehet számított mezővé alakítani. A `CONCAT` függvény a részeit vesszővel elválasztva fűzi össze:

```sql
SELECT CONCAT(nev, ' (', kategoria, ')') AS cimke
FROM termek;
```

| cimke |
|---|
| Tej (tej) |
| Kenyer (pek) |
| Alma (zold) |

Az állandó szövegeket aposztróf közé tesszük, a mezőket változatlanul írjuk be. A szóközöket és a zárójeleket magunknak kell beírni, mert az összefűzés semmit sem tesz hozzá.

## Szám és szöveg keverése

Ha számot fűzöl szöveghez, a `CONCAT` magától szöveggé alakítja:

```sql
SELECT CONCAT(nev, ': ', ar, ' Ft') AS sor
FROM termek;
```

| sor |
|---|
| Tej: 330 Ft |
| Kenyer: 480 Ft |
| Alma: 290 Ft |

## Gyakori hibák

1. **Hiányzó alias.** A kiszámított oszlop neve a kifejezés lesz, és a feladat más nevet vár.
2. **Szöveg `+` jellel összefűzése.** SQL-ben a `'a' + 'b'` nem szöveg, hanem számolás (az eredmény 0). Összefűzni a `CONCAT` függvénnyel kell.
3. **Hiányzó szóköz.** A `CONCAT(nev, kategoria)` eredménye `Tejtej`; a szóközt be kell írni: `CONCAT(nev, ' ', kategoria)`.
4. **Zárójel kifelejtése.** `ar - 30 * 2` mást ad, mint `(ar - 30) * 2`.

## Összefoglalás

- A `SELECT` után kifejezés is állhat: `ar * keszlet AS ertek`.
- A kifejezés minden soron kiértékelődik; a számított oszlopnak adj aliast.
- Szövegösszefűzés: `CONCAT(...)`.
- A `/` tört eredményt is adhat (`7 / 2` = `3.5`); egészre `ROUND` vagy `FLOOR` kerekít.
