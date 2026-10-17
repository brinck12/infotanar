---
slug: szoveg-reszletei
title: Szövegrészletek kivágása
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mikor kell egy szövegből csak egy darab?

Sok szöveg **szabályos felépítésű**. A termékkód `LAP-2023-001`: az első három betű a kategória, utána jön az év, a végén a sorszám. Az e-mail-cím `kiss.anna@suli.hu`: a `@` előtt a felhasználónév, utána a tartomány.

Ha ebből csak egy darab kell, a szöveget fel kell vágni. Ebben a leckében három függvényt tanulsz erre (`LEFT`, `RIGHT`, `SUBSTRING`), és egyet, amellyel megkeresheted egy jel helyét (`LOCATE`).

A példákban ez a két tábla szerepel.

A `termek` tábla:

| `id` | `kod` | `nev` |
|---|---|---|
| 1 | LAP-2023-001 | Laptop |
| 2 | EGE-2024-014 | Egér |
| 3 | MON-2022-007 | Monitor |

Az `ugyfel` tábla:

| `id` | `nev` | `email` |
|---|---|---|
| 1 | Kiss Anna | kiss.anna@suli.hu |
| 2 | Nagy Béla | bela@gmail.com |

## A karakterek sorszáma 1-től indul

Minden karakternek van sorszáma. Az első karakter az **1.**, nem a 0. A `LAP-2023-001` így néz ki:

| karakter | L | A | P | - | 2 | 0 | 2 | 3 | - | 0 | 0 | 1 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sorszám | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

A kötőjel és a szóköz is karakter, saját sorszámmal. Az SQL-ben a sorszámozás tehát 1-től megy. (Ez más, mint a programozási nyelvekben, ahol 0-tól.)

## LEFT: az elejéből

`LEFT(szöveg, hány)` a szöveg **elejéről** vesz le annyi karaktert, amennyit kérsz.

```sql
SELECT kod, LEFT(kod, 3) AS kategoria
FROM termek;
```

Ez minden kódból az első három karaktert adja:

| `kod` | `kategoria` |
|---|---|
| LAP-2023-001 | LAP |
| EGE-2024-014 | EGE |
| MON-2022-007 | MON |

**Próbáld ki:** vedd le a kód első 7 karakterét. Mit kapsz?

## RIGHT: a végéből

`RIGHT(szöveg, hány)` a szöveg **végéről** vesz le annyit.

```sql
SELECT kod, RIGHT(kod, 3) AS sorszam
FROM termek;
```

| `kod` | `sorszam` |
|---|---|
| LAP-2023-001 | 001 |
| EGE-2024-014 | 014 |
| MON-2022-007 | 007 |

Az eredmény szöveg marad, ezért a `001` nullái megmaradnak.

## SUBSTRING: a közepéből

Az évszám a kód közepén van, ezt sem a `LEFT`, sem a `RIGHT` nem éri el. A `SUBSTRING(szöveg, hol kezdődik, hány karakter)` bárhonnan kivág.

Az év az 5. karaktertől kezdődik, és 4 karakter hosszú:

```sql
SELECT nev, SUBSTRING(kod, 5, 4) AS ev
FROM termek;
```

Az adatbázis az 5. karakternél kezd, és négyet vesz át (`2`, `0`, `2`, `3`):

| `nev` | `ev` |
|---|---|
| Laptop | 2023 |
| Egér | 2024 |
| Monitor | 2022 |

Ha a harmadik számot (a hosszt) elhagyod, a kezdéstől a **szöveg végéig** vesz át mindent:

```sql
SELECT SUBSTRING(kod, 5) AS maradek
FROM termek;
```

| `maradek` |
|---|
| 2023-001 |
| 2024-014 |
| 2022-007 |

(A `SUBSTR` és a `MID` ugyanez a függvény másik néven.)

**Próbáld ki:** vedd ki a kód 9. karakterétől a végéig a részt. Mit kapsz?

## Szűrés a szövegrészlet alapján

A `WHERE`-ben is használhatod. Keressük a 2024-es termékeket:

```sql
SELECT nev, kod
FROM termek
WHERE SUBSTRING(kod, 5, 4) = '2024';
```

A `SUBSTRING` eredménye szöveg, ezért a `'2024'` aposztrófok között van.

| `nev` | `kod` |
|---|---|
| Egér | EGE-2024-014 |

## LOCATE: hol van egy jel?

A fenti kódoknál minden rész fix helyen volt. Az e-mail-címnél nem: a `@` máshol van a `kiss.anna@suli.hu`-ban, és máshol a `bela@gmail.com`-ban. A `LOCATE(keresett, szöveg)` megmondja, hányadik karakter a keresett rész:

```sql
SELECT email, LOCATE('@', email) AS hely
FROM ugyfel;
```

| `email` | `hely` |
|---|---|
| kiss.anna@suli.hu | 10 |
| bela@gmail.com | 5 |

Ha a keresett rész nincs benne a szövegben, az eredmény `0`.

## Összerakjuk: felhasználónév és tartomány

A `LOCATE`-tal kapott számot beteheted a `SUBSTRING`-be. A felhasználónév a `@` **előtti** rész: az 1. karaktertől tart, és a `@` helyénél eggyel kevesebb karakter hosszú.

```sql
SELECT SUBSTRING(email, 1, LOCATE('@', email) - 1) AS felhasznalo
FROM ugyfel;
```

Az első címnél a `@` a 10. karakter, így 9 karaktert veszünk át:

| `felhasznalo` |
|---|
| kiss.anna |
| bela |

A tartomány a `@` **utáni** rész: a `@` helye + 1 karaktertől a végéig. A hosszat elhagyjuk:

```sql
SELECT SUBSTRING(email, LOCATE('@', email) + 1) AS tartomany
FROM ugyfel;
```

| `tartomany` |
|---|
| suli.hu |
| gmail.com |

Ha elakadsz, számold ki egy konkrét címre papíron, mit ad a `LOCATE`, és abból a `SUBSTRING` két számát.

## Gyakori hibák

- **0-tól számolsz.** Az első karakter sorszáma 1. A `SUBSTRING(kod, 0, 3)` üres szöveget ad.
- **Eggyel elcsúszol.** A `@` előtti rész hossza `LOCATE - 1`, a `@` utáni rész kezdete `LOCATE + 1`. Rajzold fel a karaktereket, mint fent.
- **A szám nem szöveg.** A `SUBSTRING(kod, 5, 4)` eredménye szöveg, ezért `= '2024'` a helyes, nem `= 2024`. (Utóbbi sokszor mégis működik, de a szöveget szöveggel hasonlítsd.)
- **`LEFT` és `RIGHT` hossza.** Ha a megadott szám nagyobb, mint a szöveg, az egész szöveget kapod.
- **Hiányzó aposztróf** a `LOCATE('@', ...)` első paraméterénél.

## Összefoglalás

| Függvény | Mit csinál | Példa (`'LAP-2023-001'`) | Eredmény |
|---|---|---|---|
| `LEFT(s, n)` | az első `n` karakter | `LEFT(kod, 3)` | `LAP` |
| `RIGHT(s, n)` | az utolsó `n` karakter | `RIGHT(kod, 3)` | `001` |
| `SUBSTRING(s, k, n)` | `n` karakter a `k`. karaktertől | `SUBSTRING(kod, 5, 4)` | `2023` |
| `SUBSTRING(s, k)` | a `k`. karaktertől a végéig | `SUBSTRING(kod, 5)` | `2023-001` |
| `LOCATE(x, s)` | az `x` helye `s`-ben (0, ha nincs) | `LOCATE('-', kod)` | `4` |

A sorszámozás 1-től indul. A `LEFT`/`RIGHT` a szöveg két végéről vág, a `SUBSTRING` bárhonnan, a `LOCATE` megmondja, hol keress.
