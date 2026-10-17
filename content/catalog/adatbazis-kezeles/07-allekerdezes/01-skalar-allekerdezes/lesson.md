---
slug: skalar-allekerdezes
title: Skaláris allekérdezés, összehasonlítás egy számított értékkel
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor a feltétel értékét ki kell számolni

Gyakori kérdés: "Ki kapott az átlagnál több pontot?" Az átlagot nem ismered előre, ki kell számolni, és csak utána lehet vele összehasonlítani. Az első ötlet ez lehet:

```sql
SELECT nev FROM diak WHERE pont > AVG(pont);
```

Ez **hibás**: az összesítő függvény (`AVG`) a `WHERE` feltételben nem használható, mert a `WHERE` sorról sorra dönt, az átlag viszont az összes sorból áll elő. A megoldás az **allekérdezés**: egy `SELECT`, amelyet zárójelbe teszünk egy másik `SELECT`-en belül.

A példákban ez a `diak` tábla szerepel:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Anna | 9.A | 60 |
| 2 | Bela | 9.B | 90 |
| 3 | Csaba | 9.A | 40 |
| 4 | Dora | 10.A | 70 |

## Skaláris allekérdezés

Ha az allekérdezés **egyetlen sort és egyetlen oszlopot** ad, vagyis egyetlen értéket (skalárt), akkor úgy használhatod, mintha egy szám állna a helyén:

```sql
SELECT nev, pont
FROM diak
WHERE pont > (SELECT AVG(pont) FROM diak);
```

A rendszer előbb a zárójeles részt futtatja: az átlag `(60 + 90 + 40 + 70) / 4 = 65`. Utána a külső lekérdezés úgy fut, mintha `WHERE pont > 65` állna ott:

| nev | pont |
|---|---|
| Bela | 90 |
| Dora | 70 |

**Próbáld ki:** írd át a feltételt `<`-re, és nézd meg, kik esnek az átlag alá!

## Legnagyobb és legkisebb érték szerint

Ugyanígy kérdezhető a "legjobb" is. Az `ORDER BY pont DESC LIMIT 1` csak egy sort ad vissza, akkor is, ha ketten holtversenyben vezetnek. Az allekérdezéses változat mindenkit megtalál:

```sql
SELECT nev, pont
FROM diak
WHERE pont = (SELECT MAX(pont) FROM diak);
```

| nev | pont |
|---|---|
| Bela | 90 |

Ha két diák is 90 pontos lenne, mindkettő megjelenne.

## Az allekérdezésnek saját WHERE-je lehet

A zárójeles `SELECT` ugyanolyan teljes lekérdezés, mint bármelyik másik, ezért szűrhet, csoportosíthat is. Például "kik kaptak többet a 9.A osztály átlagánál?":

```sql
SELECT nev, osztaly, pont
FROM diak
WHERE pont > (SELECT AVG(pont) FROM diak WHERE osztaly = '9.A');
```

A 9.A átlaga `(60 + 40) / 2 = 50`, így Anna, Bela és Dora is bekerül (Csaba nem: 40 kevesebb 50-nél). Figyeld meg, hogy a külső lekérdezés **minden osztályból** válogat, csak az összehasonlítás alapja jön a 9.A-ból.

## Allekérdezés a SELECT listában

A skaláris allekérdezés az oszloplistában is állhat. Így minden sor mellé kiírhatod a közös referenciaértéket vagy a különbséget:

```sql
SELECT nev, pont - (SELECT MIN(pont) FROM diak) AS elony
FROM diak;
```

| nev | elony |
|---|---|
| Anna | 20 |
| Bela | 50 |
| Csaba | 0 |
| Dora | 30 |

Az allekérdezés eredménye minden sorra ugyanaz (a legkisebb pont: 40), ezért elég egyszer kiszámolni.

## Mire figyelj

- A skaláris allekérdezésnek **egy értéket** kell adnia. Ha több sort ad (például `SELECT pont FROM diak` összesítő nélkül), a feltétel értelmetlen. Az SQLite ilyenkor az első sort használja, a MariaDB hibát jelez, ezért mindig összesítő függvényt vagy olyan szűrést használj, amely biztosan egy sort ad.
- Az allekérdezés mindig **zárójelben** áll.
- Ha az allekérdezés üres eredményt ad (például nincs ilyen osztály), az érték `NULL`, és az összehasonlítás nem lesz igaz egyetlen sorra sem.

## Gyakori hibák

- **Összesítő a WHERE-ben:** `WHERE pont > AVG(pont)` hibás, kell hozzá az allekérdezés.
- **Hiányzó zárójel:** `WHERE pont > SELECT AVG(pont) FROM diak` szintaktikai hiba.
- **Más tábla neve az allekérdezésben:** ha elírod a `FROM` utáni táblanevet, az átlag nem a kívánt táblából jön.
- **LIMIT 1 holtversenynél:** ha "a legjobb" mindenkit jelent, aki a maximumot elérte, a `LIMIT 1` kihagyja a többieket.
- **Kerekítetlen átlag:** az `AVG` tört számot adhat. Összehasonlításhoz ez jó, de ha kiírod az átlagot, kerekítsd `ROUND`-dal.

## Összefoglalás

- Az **allekérdezés** egy zárójelbe tett `SELECT` egy másik lekérdezésen belül.
- A **skaláris** allekérdezés egyetlen értéket ad, ezért összehasonlításban (`>`, `=`, `<` ...) és a `SELECT` listában is használható.
- Az összesítő függvény csak az allekérdezésben számolható ki, a `WHERE`-ben közvetlenül nem.
- A "legnagyobb szerint" kérdést `= (SELECT MAX(...) ...)` formával oldd meg, hogy a holtversenyesek se maradjanak ki.
- Az érettségi MariaDB-ben ugyanígy működik; az allekérdezéses szintaxis megegyezik.
