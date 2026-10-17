---
slug: logikai-operatorok-between-in-like
title: AND, OR, NOT, BETWEEN, IN és LIKE
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Összetett feltételek

Az egyszerű `WHERE` egyetlen feltételt vizsgál. A kérdések gyakran összetettebbek: "a 10.A-sok, akiknek legalább 50 pontjuk van", "a tej vagy a pékáru". Ebben a leckében a feltételeket összekötő műveleteket tanulod meg.

A példákban ez a `termek` tábla szerepel:

| id | nev | kategoria | ar | keszlet |
|---|---|---|---|---|
| 1 | Tej | tej | 330 | 12 |
| 2 | Kenyer | pek | 480 | 0 |
| 3 | Alma | zold | 290 | 25 |
| 4 | Sajt | tej | 1900 | 4 |
| 5 | Kifli | pek | 60 | 40 |

## AND, OR, NOT

- `AND`: **mindkét** feltételnek igaznak kell lennie.
- `OR`: **legalább az egyik** feltételnek igaznak kell lennie.
- `NOT`: megfordítja a feltételt.

```sql
SELECT nev, ar
FROM termek
WHERE kategoria = 'tej' AND ar < 1000;
```

| nev | ar |
|---|---|
| Tej | 330 |

A sajt is tej kategóriájú, de az ára nem kisebb 1000-nél, ezért kiesik.

```sql
SELECT nev, keszlet
FROM termek
WHERE keszlet = 0 OR ar > 1500;
```

| nev | keszlet |
|---|---|
| Kenyer | 0 |
| Sajt | 4 |

A kenyérből elfogyott, a sajt drága: az `OR` mindkettőt elfogadja.

```sql
SELECT nev
FROM termek
WHERE NOT kategoria = 'tej';
```

Ez a tejtermékeken kívül mindent ad (ugyanaz, mint a `kategoria <> 'tej'`).

## Zárójel: az AND erősebb, mint az OR

Az `AND` előbb kötődik, mint az `OR`, mint a matematikában a szorzás az összeadásnál. Ha mindkettőt használod, **mindig tegyél zárójelet**:

```sql
SELECT nev, kategoria, ar
FROM termek
WHERE (kategoria = 'tej' OR kategoria = 'pek') AND ar < 500;
```

| nev | kategoria | ar |
|---|---|---|
| Tej | tej | 330 |
| Kenyer | pek | 480 |
| Kifli | pek | 60 |

Zárójel nélkül (`kategoria = 'tej' OR kategoria = 'pek' AND ar < 500`) az adatbázis úgy értené: "tej, **vagy** (pék és olcsó)", és a drága sajt is bekerülne.

## BETWEEN: tól-ig

A `BETWEEN a AND b` azt vizsgálja, hogy az érték `a` és `b` **között van, a határokat is beleértve**:

```sql
SELECT nev, ar
FROM termek
WHERE ar BETWEEN 290 AND 480;
```

| nev | ar |
|---|---|
| Tej | 330 |
| Kenyer | 480 |
| Alma | 290 |

Ugyanaz, mint az `ar >= 290 AND ar <= 480`. Az alsó határ mindig elöl álljon, különben az eredmény üres lesz. A `BETWEEN` dátumokra is működik: `kivetel BETWEEN '2025-03-01' AND '2025-03-31'`.

**Próbáld ki:** keresd meg az 50 és 80 pont közötti diákokat.

## IN: felsorolt értékek közül

Az `IN` azt vizsgálja, hogy az érték szerepel-e a felsorolásban:

```sql
SELECT nev
FROM termek
WHERE kategoria IN ('tej', 'zold');
```

| nev |
|---|
| Tej |
| Alma |
| Sajt |

Ugyanaz, mint a `kategoria = 'tej' OR kategoria = 'zold'`, csak rövidebb. A tagadása a `NOT IN`.

## LIKE: minta szerint

A `LIKE` szöveget **mintával** hasonlít össze. Két helyettesítő jel van:

- `%`: tetszőleges számú (akár nulla) karakter,
- `_`: pontosan egy karakter.

| Minta | Mit talál |
|---|---|
| `'K%'` | K-val kezdődő szövegek (Kenyer, Kifli) |
| `'%li'` | li-re végződők (Kifli) |
| `'%e%'` | tartalmaz e betűt |
| `'K____'` | K és még négy karakter (Kifli: 5 betű) |

```sql
SELECT nev
FROM termek
WHERE nev LIKE 'K%';
```

| nev |
|---|
| Kenyer |
| Kifli |

A `LIKE` a nagy- és kisbetűt (angol betűknél) nem különbözteti meg az SQLite-ban és alapesetben a MariaDB-ben sem. A tagadása a `NOT LIKE`.

## Hogyan válaszd ki a megfelelőt?

- Tól-ig érték: `BETWEEN`.
- Néhány konkrét érték közül: `IN`.
- Szövegrészlet, kezdőbetű: `LIKE`.
- Két különböző mezőre vonatkozó feltétel: `AND` vagy `OR`.

## Gyakori hibák

1. **Zárójel nélküli `AND` és `OR` keverése.** Mindig zárójelezz.
2. **`WHERE kategoria = 'tej' OR 'pek'`.** Az `OR` mindkét oldalán teljes feltételnek kell állnia: `kategoria = 'tej' OR kategoria = 'pek'` (vagy `IN`).
3. **Fordított `BETWEEN`.** `BETWEEN 80 AND 50` üres eredményt ad.
4. **`LIKE` helyettesítő jel nélkül.** A `LIKE 'K'` csak a pontosan `K` szöveget találja meg, mint az `=`.
5. **Az `=` használata mintához.** `nev = 'K%'` nem minta, a `%` ott betű.

## Összefoglalás

- `AND`, `OR`, `NOT` összetett feltételhez; az `AND` erősebb az `OR`-nál, ezért zárójelezz.
- `mezo BETWEEN a AND b`: tól-ig, a határokkal együtt.
- `mezo IN (a, b, c)`: a felsorolt értékek valamelyike.
- `mezo LIKE 'minta'`: `%` tetszőleges szöveg, `_` egy karakter.
