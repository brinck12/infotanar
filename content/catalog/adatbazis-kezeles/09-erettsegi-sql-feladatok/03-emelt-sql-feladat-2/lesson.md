---
slug: emelt-sql-feladat-2
title: Emelt szintű SQL-feladat, rendezvényjegyek
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Második emelt feladatsor: új adatbázis, ismerős típusok

Az előző emelt feladatsor (taxi) után itt egy másik tartományon gyakorolsz ugyanazokra a feladattípusokra: egy **jegyértékesítő rendszer** adatbázisán. Az érettségin sem az adatbázis a nehéz, hanem az, hogy a kérdést gyorsan **felismerd** és lefordítsd SQL-re. Az új tartományban ugyanaz a recept: táblák, sorok, kiírás, sorrend.

## Az adatbázis

A `rendezveny` tábla: `id`, `nev`, `helyszin`, `datum`, `kapacitas`. A `jegy` tábla: `id`, `rendezveny_id`, `vevo`, `kategoria` (`allo`, `ules` vagy `vip`), `ar`, `vasarlas` (a vásárlás napja). A `jegy.rendezveny_id` a `rendezveny.id`-ra mutat.

Egy fontos különbség a taxis feladathoz képest: **lehet olyan rendezvény, amelyre még nem adtak el jegyet**. Ezt a `JOIN` tulajdonságai miatt tudnod kell kezelni: az `INNER JOIN` az ilyen rendezvényt kihagyja, a korrelált allekérdezés viszont nullának számolja.

## Új vagy hangsúlyosabb elemek

### Feltételes számlálás egy sorban

Ha egyszerre kell több kategória darabszáma, nem három lekérdezés kell, hanem egy, `CASE`-zel:

```sql
SELECT COUNT(*) AS osszes,
       SUM(CASE WHEN kategoria = 'vip' THEN 1 ELSE 0 END) AS vip
FROM jegy;
```

A `CASE` sorról sorra 1-et vagy 0-t ad, a `SUM` összeadja: ez a "hány ilyen van" feltételes változata.

### LIKE és tagadás együtt

A `LIKE '%fesztival%'` minta a szót a név **bármely helyén** megtalálja. A kizárásra (`<>`, `NOT LIKE`) ugyanúgy `AND` kell a mintafeltétel mellé:

```sql
SELECT nev, helyszin
FROM rendezveny
WHERE nev LIKE '%fesztival%' AND helyszin <> 'Szeged';
```

### Korrelált allekérdezés a WHERE-ben

A "nem éri el a kapacitás felét" feltétel egy **számított** értéket (az eladott jegyek számát) hasonlít a kapacitáshoz. Mivel a rendezvényenkénti darabszám nem tárolt adat, kiszámoljuk, minden rendezvényre külön:

```sql
SELECT nev, kapacitas
FROM rendezveny
WHERE (SELECT COUNT(*) FROM jegy WHERE jegy.rendezveny_id = rendezveny.id) * 2 < kapacitas;
```

Az allekérdezés a külső sor `rendezveny.id` értékére hivatkozik (korreláció), ezért a nulla jegyű rendezvény is megjelenik: számára a `COUNT(*)` értéke 0. Ezt `INNER JOIN`-nal nem lehetne ilyen egyszerűen megoldani: ott a rendezvény sora a jegyek hiányában elveszne.

Az eladott jegyek számának és a kapacitás felének összevetése kétféleképpen írható: `db * 2 < kapacitas` vagy `db < kapacitas / 2`. A MariaDB-ben a `/` tört eredményt ad (`15 / 2` értéke `7.5`), ezért a két forma ugyanazt az eredményt adja.

### Százalék csoportonként

A kihasználtság százalékban egy csoportonkénti hányados:

```sql
SELECT rendezveny.nev,
       ROUND(100 * COUNT(jegy.id) / rendezveny.kapacitas) AS szazalek
FROM rendezveny INNER JOIN jegy ON jegy.rendezveny_id = rendezveny.id
GROUP BY rendezveny.id, rendezveny.nev, rendezveny.kapacitas
ORDER BY szazalek DESC, rendezveny.nev;
```

Figyeld meg, hogy a `kapacitas` is szerepel a `GROUP BY` után: az összesítő mellé kitett, nem összesített oszlopnak a csoportosításban kell lennie (a szigorú, `ONLY_FULL_GROUP_BY` módban a MariaDB ezt meg is követeli).

## Munkamenet az érettségin

1. **Olvasd végig a feladatsor összes kérdését**, mielőtt írni kezdesz: sok lekérdezés az előzőből építhető.
2. **Építsd fokozatosan:** előbb csak a `FROM` és `WHERE`, futtasd le, aztán add hozzá az összesítést, a csoportosítást és a rendezést.
3. **Nézd meg az eredmény alakját:** hány oszlop, milyen nevek, milyen sorrend, összhangban van-e a szöveggel.
4. **Ha elakadsz, ugorj tovább:** a részfeladatok egymástól függetlenek, pontot külön kapsz értük.
5. **Mentsd a lekérdezéseket:** az érettségin a megoldást fájlban kell leadni, a feladat szövege megmondja, milyen néven.

## Gyakori hibák

- **`INNER JOIN` a nulla jegyű rendezvényre:** a "bármelyik rendezvény" kérdéshez allekérdezés vagy `LEFT JOIN` kell.
- **Kerekítés elhagyása:** a százalék `100 * rész / összes`, és ha a feladat egész százalékot kér, tedd `ROUND(...)`-ba.
- **Határok:** a `BETWEEN` mindkét végpontot tartalmazza; a dátumot `'2026-04-01'` alakban add meg.
- **`DISTINCT` hiánya:** ha egy vevő több jegyet vett, a neve többször szerepel.
- **Csökkenő sorrend egyenlőség esetén:** a feladat másodlagos kulcsot kér, ezt ne hagyd el.
- **`GROUP BY` kevés oszloppal:** minden nem összesített `SELECT` oszlopot felsorolunk a csoportosításban.

## Összefoglalás

- A második emelt feladatsor ugyanazt a 8 típust gyakoroltatja új adatbázison: a felismerés a lényeg.
- A feltételes számlálás `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`.
- A számított összehasonlításhoz (eladott jegyek a kapacitáshoz) korrelált allekérdezés kell; így a nulla jegyű rendezvény is szerepel.
- A százalék `ROUND(100 * rész / összes)`, a csoportonkénti hányadosnál a csoportosításban minden nem összesített oszlop szerepeljen.
