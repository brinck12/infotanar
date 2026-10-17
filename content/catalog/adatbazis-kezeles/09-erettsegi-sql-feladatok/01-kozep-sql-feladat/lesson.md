---
slug: kozep-sql-feladat
title: A középszintű SQL-feladat felépítése
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mit vár tőled az érettségi?

A középszintű adatbázis-feladatban egy kész adatbázist kapsz (egy vagy két táblával), és **néhány lekérdezést** kell megírnod hozzá. A feladatok mind olyan elemekből épülnek, amelyeket már ismersz: szűrés, rendezés, összesítés, csoportosítás, esetleg egy `JOIN`. Ebben a leckében az érettségi feladatsor menetét gyakorolod: egy adatbázis, öt részfeladat, mindegyik külön lekérdezés.

Az érettségin a lekérdezés eredményét a feladat szövege **pontosan megszabja**: mely oszlopok szerepeljenek, milyen néven és milyen sorrendben. Ezt a szabályt itt is szigorúan követd: a rendszer a kapott táblázatot a várttal hasonlítja össze.

## Az eljárás: négy kérdés

Mielőtt egy sort leírnál, tedd fel magadnak négy kérdést:

1. **Melyik táblák kellenek?** Ha az adat két táblában van, kell a `JOIN`, és a kapcsolat oszlopai (idegen kulcs = elsődleges kulcs).
2. **Mely sorok kellenek?** Ez a `WHERE` feltétel. A szöveg szavait fordítsd le: "legalább" `>=`, "több mint" `>`, "között" `BETWEEN`, "kezdődik" `LIKE 'A%'`.
3. **Mit kell kiírni?** Az `SELECT` listája: oszlopok, vagy összesítés (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`) és csoportosítás (`GROUP BY`). A kért **oszlopnevet** `AS`-sel add meg.
4. **Milyen sorrendben?** Az `ORDER BY`; a növekvő az alapértelmezett, a csökkenő `DESC`.

## Egy kidolgozott példa

Tegyük fel, hogy ez a két tábla áll rendelkezésre: `mufaj(id, nev)` és `film(id, cim, ev, hossz, mufaj_id, ertekeles)`.

**Feladat:** Adja meg lekérdezéssel azoknak a filmeknek a címét és hosszát, amelyek **hosszabbak 100 percnél**, hossz szerint csökkenően!

1. Táblák: csak a `film` (a műfaj nem kell).
2. Sorok: `hossz > 100`.
3. Kiírás: `cim, hossz`.
4. Sorrend: `hossz DESC`.

```sql
SELECT cim, hossz
FROM film
WHERE hossz > 100
ORDER BY hossz DESC;
```

Figyeld meg, hogy a négy kérdés szinte soronként megfelel a lekérdezés négy részének (`FROM`, `WHERE`, `SELECT`, `ORDER BY`).

## Összesítés és csoportosítás

**Feladat:** Adja meg lekérdezéssel, hogy hány film készült 2010 előtt! Az oszlop neve `darab`.

```sql
SELECT COUNT(*) AS darab
FROM film
WHERE ev < 2010;
```

Ha a "hányat", "mennyi az összege", "mi az átlaga" kérdés után **minden csoportra** külön értéket kérnek ("műfajonként", "osztályonként"), a `GROUP BY` kell:

```sql
SELECT mufaj_id, COUNT(*) AS darab
FROM film
GROUP BY mufaj_id;
```

A csoportosító oszlop szerepeljen a `SELECT` listában is. Ha a csoportosítás a másik tábla egy oszlopa szerint (például a műfaj **neve**) történik, a `JOIN` is kell, és érdemes a kulcsot is csoportosítani (`GROUP BY mufaj.id, mufaj.nev`), hogy az azonos nevű, de különböző azonosítójú sorok ne olvadjanak össze.

## JOIN a feladatban

**Feladat:** Adja meg lekérdezéssel a drámák címét!

```sql
SELECT film.cim
FROM film INNER JOIN mufaj ON film.mufaj_id = mufaj.id
WHERE mufaj.nev = 'drama';
```

A `JOIN` feltétele mindig `idegen kulcs = elsődleges kulcs`. A `WHERE` ugyanúgy a már összekapcsolt táblára vonatkozik.

## Kerekítés és egész számok

Az átlag gyakran tört. Ha a feladat "egész számra kerekítve" kéri, az SQLite-ban `CAST(ROUND(...) AS INTEGER)` adja az egész számot (a `ROUND` önmagában `85.0` alakú, tizedes jeggyel írja ki). A MariaDB `ROUND(AVG(hossz))` egész számot ad, ott a `CAST` nem szükséges, de elfogadott.

## Az érettségi szokásos szövegei

- "Adja meg lekérdezéssel": `SELECT`, a kimenet pontosan a leírt.
- "Rendezze ... szerint növekvően / csökkenően": `ORDER BY ...`, `DESC`.
- "Csak azok szerepeljenek, amelyek...": `WHERE` vagy `HAVING`.
- "A lekérdezés oszlopai ... legyenek": a `SELECT` lista és az `AS` nevek.
- Ékezetmentes adatot kapsz, az eredmény is ékezetmentes.

## A feladatok

A következő öt feladat ugyanarra a filmadatbázisra épül, de **mindegyik tesztnél más adattal** fut. Minden feladat önálló lekérdezés, a megoldásod csak a saját kérdésére adjon választ.

## Gyakori hibák

- **Rossz oszlopnév vagy sorrend:** az eredmény oszlopainak neve és sorrendje a szövegből következik. Egy rossz név hibás eredményt jelent.
- **Határérték:** a "2000 után" `ev > 2000`, a "legalább 6" `>= 6`. Mindig döntsd el, a határ benne van-e.
- **Hiányzó `JOIN` feltétel:** `FROM film, mufaj` feltétel nélkül minden filmet minden műfajjal párosít.
- **`GROUP BY` hiánya:** az összesítő mellé kitett oszlop csoportosítás nélkül értelmetlen.
- **Rendezés hiánya, ha kérik:** ha a szöveg sorrendet ír elő, az `ORDER BY` kötelező; az egyenlő értékek között a szöveg másodlagos kulcsot is kérhet.
- **`LIKE` nagybetű:** az `A%` a kis- és nagybetűt az SQLite-ban nem különbözteti meg (az érettségi MariaDB-je általában szintén nem).

## Összefoglalás

- A feladat négy kérdése: *melyik táblák, mely sorok, mit kell kiírni, milyen sorrendben*.
- A szöveg határait és oszlopneveit pontosan kövesd.
- Összesítés és "-onként" kérdés esetén `GROUP BY`; két tábla esetén `JOIN`.
- Egész számra kerekített átlag: `CAST(ROUND(AVG(...)) AS INTEGER)`.
