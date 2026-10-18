---
slug: in-es-exists-allekerdezes
title: IN és EXISTS allekérdezés, listát adó allekérdezés
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor az allekérdezés több értéket ad

Az előző leckében az allekérdezés egyetlen számot adott. De gyakran egy **lista** kell: "azok a vevők, akik rendeltek", "azok az osztályok, ahol van 90 pont feletti diák". A lista egy oszlopot és több sort jelent, és az `IN` operátorral használhatod.

A példák két táblát használnak. A `vevo` tábla:

| id | nev | varos |
|---|---|---|
| 1 | Anna | Szeged |
| 2 | Bela | Pecs |
| 3 | Csaba | Szeged |
| 4 | Dora | Gyor |

A `rendeles` tábla (a `vevo_id` a vevő `id`-jára mutat):

| id | vevo_id | osszeg |
|---|---|---|
| 1 | 1 | 12000 |
| 2 | 1 | 30000 |
| 3 | 3 | 8000 |

## IN: szerepel-e a listában

```sql
SELECT nev
FROM vevo
WHERE id IN (SELECT vevo_id FROM rendeles);
```

Az allekérdezés eredménye a `1, 1, 3` lista. Az `id IN (...)` akkor igaz, ha a vevő azonosítója szerepel ebben a listában:

| nev |
|---|
| Anna |
| Csaba |

Anna kétszer is rendelt, de a vevők között csak egyszer szerepel: az `IN` egy **szűrés** a vevő soraira, nem sorokat sokszorosít, mint a `JOIN`.

**Próbáld ki:** írj `IN`-es lekérdezést azokra a vevőkre, akiknek volt 10 000 Ft-nál nagyobb rendelésük!

## NOT IN: akik hiányoznak

```sql
SELECT nev, varos
FROM vevo
WHERE id NOT IN (SELECT vevo_id FROM rendeles);
```

| nev | varos |
|---|---|
| Bela | Pecs |
| Dora | Gyor |

Figyelem: ha az allekérdezés listájában akár egyetlen `NULL` is szerepel, a `NOT IN` **egyetlen sort sem ad vissza**, mert a `NULL`-lal való összehasonlítás sosem igaz. Ha az idegen kulcs lehet `NULL`, szűrd ki: `WHERE vevo_id IS NOT NULL`. (A `LEFT JOIN ... IS NULL` megoldás ettől mentes.)

## EXISTS: van-e egyáltalán találat

Az `EXISTS` nem értéket hasonlít össze, hanem azt kérdezi: **ad-e az allekérdezés legalább egy sort**. Általában **korrelált** allekérdezéssel használjuk: az allekérdezés a külső lekérdezés aktuális sorára hivatkozik.

```sql
SELECT nev
FROM vevo
WHERE EXISTS (SELECT 1
              FROM rendeles
              WHERE rendeles.vevo_id = vevo.id
                AND rendeles.osszeg > 20000);
```

A rendszer minden vevőre külön lefuttatja az allekérdezést: "van-e ennek a vevőnek 20 000 Ft feletti rendelése?" Anna 30 000 Ft-os rendelése miatt ő kerül az eredménybe:

| nev |
|---|
| Anna |

A `SELECT 1` csak megszokás: az `EXISTS` nem nézi, mit ad az allekérdezés, csak azt, hogy van-e sor.

## NOT EXISTS és a "minden" típusú kérdés

A "minden" kérdéseket általában a tagadásukkal oldjuk meg: "minden rendelése kicsi" azt jelenti, hogy "**nincs** nagy rendelése".

```sql
SELECT nev
FROM vevo
WHERE EXISTS (SELECT 1 FROM rendeles WHERE rendeles.vevo_id = vevo.id)
  AND NOT EXISTS (SELECT 1 FROM rendeles
                  WHERE rendeles.vevo_id = vevo.id AND osszeg > 20000);
```

Az első feltétel biztosítja, hogy a vevő rendelt már (különben a "nincs nagy rendelése" üres igazság lenne, és Bela meg Dora is bekerülne). Az eredmény: Csaba, akinek egyetlen, 8000 Ft-os rendelése van.

## IN vagy EXISTS vagy JOIN?

- Ha csak azt kell tudni, hogy **van-e** kapcsolódó sor, az `IN` vagy `EXISTS` megfelel, és nem sokszorosítja a sorokat.
- Ha a másik tábla adatait is meg akarod jeleníteni (például az összeget), `JOIN` kell.
- Ha a "nincs hozzá sor" a kérdés, a `NOT EXISTS` biztonságosabb, mint a `NOT IN`, mert a `NULL` nem zavarja.

Az `IN` mellett az allekérdezés listája lehet egy állandó lista is, ahogy a szűrés leckéiben láttad: `WHERE varos IN ('Szeged', 'Pecs')`. Az allekérdezés ezt a listát számítja ki helyetted.

## Gyakori hibák

- **Az allekérdezés több oszlopot ad:** az `IN` után pontosan egy oszlop állhat.
- **Hiányzó korreláció:** ha az `EXISTS` allekérdezésből kimarad a `rendeles.vevo_id = vevo.id` feltétel, az allekérdezés vagy mindenkire igaz, vagy senkire, attól függően, hogy van-e a táblában megfelelő sor.
- **NOT IN és NULL:** egyetlen `NULL` az allekérdezésben mindent elnémít.
- **Névütközés:** ha a két táblában azonos az oszlopnév, minden oszlop elé írd a tábla nevét (`rendeles.osszeg`).
- **A "nincs" és a "minden" összekeverése:** a "van olyan, ami nem" és a "nincs olyan, ami nem" különböző állítások.

## Összefoglalás

- A **listát adó allekérdezés** egy oszlopot ad, `IN` / `NOT IN` operátorral használható.
- Az `EXISTS` azt vizsgálja, hogy az allekérdezésnek **van-e sora**; a **korrelált** allekérdezés a külső sor értékeire hivatkozik.
- A `NOT EXISTS` a "nincs olyan" kérdés biztonságos formája.
- Az `IN` és `EXISTS` nem sokszorosítja a külső sorokat, a `JOIN` igen.
- Az érettségin használt MariaDB mindezt ugyanígy érti.
