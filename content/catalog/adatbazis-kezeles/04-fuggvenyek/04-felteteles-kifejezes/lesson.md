---
slug: felteteles-kifejezes
title: Feltételes kifejezés (IF)
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Ha ez, akkor az, különben amaz

Gyakori feladat, hogy egy számból szöveget vagy másik számot kell csinálni: ha a pont legalább 50, akkor "megfelelt", különben "nem felelt meg". Ugyanez a gondolat a hétköznapokban: *ha esik az eső, viszel esernyőt, különben nem.*

Az SQL-ben erre az **`IF`** függvény való. Három részből áll, vesszővel elválasztva:

```sql
IF(feltétel, érték ha igaz, érték ha hamis)
```

Az `IF` mindig **egy értéket** ad vissza, ezért a `SELECT`-ben új oszlop lesz belőle.

A példákban ez a `dolgozat` tábla szerepel:

| `id` | `nev` | `pont` |
|---|---|---|
| 1 | Anna | 72 |
| 2 | Béla | 45 |
| 3 | Csaba | 85 |
| 4 | Dóra | 50 |

## Az első IF

```sql
SELECT nev, pont, IF(pont >= 50, 'megfelelt', 'nem felelt meg') AS eredmeny
FROM dolgozat;
```

Mit csinál? Soronként megnézi a feltételt (`pont >= 50`). Ha igaz, az eredménybe a második részt írja (`'megfelelt'`), ha hamis, a harmadikat.

| `nev` | `pont` | `eredmeny` |
|---|---|---|
| Anna | 72 | megfelelt |
| Béla | 45 | nem felelt meg |
| Csaba | 85 | megfelelt |
| Dóra | 50 | megfelelt |

Dórának pontosan 50 pontja van, és a `>=` ("nagyobb vagy egyenlő") ezt is átengedi. Ha `>`-t írtál volna, ő bukott volna.

A feltételbe bármit írhatsz, amit a `WHERE` után is: `=`, `<>`, `<`, `>=`, `AND`, `OR`.

**Próbáld ki:** írd át úgy, hogy 60 pont legyen a határ. Ki bukik meg?

## Számot is adhat

Az `IF` két ága lehet szöveg, szám, vagy akár egy számítás. Például 80 pont fölött 5 bónuszpontot adunk:

```sql
SELECT nev, IF(pont >= 80, pont + 5, pont) AS vegso
FROM dolgozat;
```

| `nev` | `vegso` |
|---|---|
| Anna | 72 |
| Béla | 45 |
| Csaba | 90 |
| Dóra | 50 |

Csak Csaba érte el a 80-at, ezért az ő sorában a `pont + 5` lett az érték. A többieknél a `pont` marad.

## Kettőnél több lehetőség: IF az IF-ben

Mi van, ha háromféle eredmény kell? Például: 50 alatt `gyenge`, 50-től 80 alatt `kozepes`, 80-tól `jo`.

Az `IF` harmadik részébe (a "különben" ágba) **újabb `IF`-et** teszünk:

```sql
SELECT nev, pont,
  IF(pont < 50, 'gyenge', IF(pont < 80, 'kozepes', 'jo')) AS szint
FROM dolgozat;
```

Olvasd fentről lefelé, mintha kérdéseket tennél fel:

1. Kisebb a pont 50-nél? Ha igen: `gyenge`. Ha nem:
2. Kisebb a pont 80-nál? Ha igen: `kozepes`. Ha nem:
3. Akkor `jo`.

| `nev` | `pont` | `szint` |
|---|---|---|
| Anna | 72 | kozepes |
| Béla | 45 | gyenge |
| Csaba | 85 | jo |
| Dóra | 50 | kozepes |

Anna 72 pontjával az első kérdésre "nem" a válasz (72 nem kisebb 50-nél), a másodikra "igen" (72 kisebb 80-nál), így `kozepes` lett.

**A sorrend számít.** Mindig a legkisebb sávval kezdd, és haladj felfelé. Ha az első kérdés `pont < 80` lenne, a 45 pontos Béla is "kozepes" lenne, mert a 45 is kisebb 80-nál.

Negyedik sávnál még egy `IF` kerül a legbelső helyre, és a végén eggyel több `)` zárja le.

**Próbáld ki:** adj jegyet: 50 alatt 1, 50-től 70 alatt 2, 70-től 3. Írd ki lépésenként, mi a kérdés.

## CASE: ugyanaz, olvashatóbban

Sok sávnál az egymásba tett `IF` zárójelei zavarók. Ugyanezt a `CASE` is meg tudja mondani, és az érettségi MariaDB-je is érti:

```sql
SELECT nev, pont,
  CASE
    WHEN pont < 50 THEN 'gyenge'
    WHEN pont < 80 THEN 'kozepes'
    ELSE 'jo'
  END AS szint
FROM dolgozat;
```

Az eredmény ugyanaz, mint fent. A `WHEN` feltételeit fentről lefelé nézi, az első igaznál megáll. Az `ELSE` mondja meg, mi legyen, ha egyik sem igaz. A végén `END` zár.

Mindkettő jó. Rövid, kétágú kérdésre az `IF` kényelmes, hosszú sávokra a `CASE` átláthatóbb.

## Hiányzó értékek: IS NULL

Ha az adat hiányzik, az érték `NULL`. Tegyük fel, hogy a fuvarok értékelését nem mindenki töltötte ki:

| `id` | `ertekeles` |
|---|---|
| 1 | 5 |
| 2 | NULL |
| 3 | 3 |

A hiányzó értéket **nem** lehet `= NULL`-lal keresni, mert az mindig hamis. A helyes forma az **`IS NULL`**. Írjuk ki a `nincs` szót a hiányzó helyén:

```sql
SELECT id, IF(ertekeles IS NULL, 'nincs', ertekeles) AS ertekeles
FROM fuvar;
```

| `id` | `ertekeles` |
|---|---|
| 1 | 5 |
| 2 | nincs |
| 3 | 3 |

Ha a hiányzó érték helyére csak egy másik értéket akarsz tenni, rövidebb az `IFNULL(oszlop, helyettesítő)`:

```sql
SELECT id, IFNULL(ertekeles, 0) AS ertekeles
FROM fuvar;
```

| `id` | `ertekeles` |
|---|---|
| 1 | 5 |
| 2 | 0 |
| 3 | 3 |

## Gyakori hibák

- **Elfelejtett aposztróf.** `IF(pont >= 50, megfelelt, ...)`: a szöveg aposztrófot kér: `'megfelelt'`.
- **Rossz sorrend egymásba tett `IF`-eknél.** Mindig a legszűkebb sávval kezdd, mint a fenti példában.
- **Hiányzó `)` a végén.** Minden `IF(` nyit egy zárójelet; annyi `)` kell a végére, ahány nyitó volt. Írd meg a belsőt először, aztán csomagold be.
- **`= NULL`** helyett `IS NULL` kell.
- **Hiányzó ág.** Az `IF`-nek mindig három része van. Ha csak kettőt adsz meg, hibát kapsz.

## Összefoglalás

| Forma | Mit csinál |
|---|---|
| `IF(feltétel, ha igaz, ha hamis)` | az egyik vagy a másik értéket adja |
| `IF(f1, a, IF(f2, b, c))` | három lehetőség, a sáv szerint |
| `CASE WHEN f1 THEN a WHEN f2 THEN b ELSE c END` | ugyanaz, több sávra olvashatóbban |
| `oszlop IS NULL` | igaz, ha az érték hiányzik |
| `IFNULL(oszlop, x)` | ha hiányzik, `x` lesz helyette |

Az `IF` mindig egy értéket ad, ezért oszlopként, számításban vagy `WHERE`-ben is használható. Több sávnál fentről lefelé haladsz, a legszűkebbel kezdve.
