---
slug: adatbazis-kezeles-tetel
title: "Adatbázis-kezelés: tételvázlat"
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## A tétel célja

Az adatbázis-kezelés tételben a relációs modellt, a kulcsokat, a táblák közötti kapcsolatokat, az SQL alapjait és a normalizálás lényegét kell kifejtened. A hivatalos tételek nem nyilvánosak, ez a vázlat **saját felkészítő anyag**. Az SQL-részhez a tananyag SQL-sávja ad gyakorlást.

## Kulcsfogalmak és pontos definíciók

- **Adatbázis**: logikailag összetartozó adatok rendezett, tartós tárolása. **Adatbázis-kezelő rendszer (DBMS)**: a tárolást, lekérdezést, hozzáférés-védelmet végző szoftver (MariaDB, MySQL, SQLite).
- **Relációs modell**: az adatokat táblák (relációk) tárolják. A **tábla** sorai a **rekordok** (egy entitás példányai), oszlopai a **mezők** (attribútumok).
- **Elsődleges kulcs (PK)**: olyan mező vagy mezőcsoport, amely a tábla minden sorát egyértelműen azonosítja; nem lehet üres és nem ismétlődhet.
- **Idegen kulcs (FK)**: egy másik tábla elsődleges kulcsára hivatkozó mező; ez hozza létre a kapcsolatot.
- **Kapcsolat típusok**: 1:1, 1:N (például egy osztály, sok tanuló), N:M (sok-sok; kapcsolótáblával oldjuk fel).
- **Hivatkozási integritás**: idegen kulcs csak létező elsődleges kulcsra mutathat.
- **Adattípus**: egész, valós, szöveg, dátum, logikai.
- **Redundancia**: ugyanazon adat felesleges ismétlődése, ami következetlenséghez vezet (anomália).
- **Normalizálás**: a táblák átalakítása a redundancia csökkentésére.
- **SQL**: strukturált lekérdezőnyelv.

## SQL röviden: a legfontosabb szerkezetek

```text
SELECT nev, pont FROM tanulo WHERE pont >= 50 ORDER BY pont DESC;
SELECT osztaly, COUNT(*), AVG(pont) FROM tanulo GROUP BY osztaly HAVING AVG(pont) > 60;
SELECT t.nev, o.nev FROM tanulo t JOIN osztaly o ON t.osztaly_id = o.id;
INSERT INTO tanulo (nev, pont) VALUES ('Kata', 72);
UPDATE tanulo SET pont = 80 WHERE id = 3;
DELETE FROM tanulo WHERE id = 3;
```

A `WHERE` a sorokat szűri csoportosítás előtt, a `HAVING` a csoportokat utána. Az összesítő függvények: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. A `JOIN` a kulcsok mentén kapcsolja össze a táblákat. A `DELETE` és az `UPDATE` `WHERE` nélkül az egész táblára hat, ezért veszélyes.

Az SQL nyelvjárásai kismértékben eltérnek (az érettségi MariaDB-t használ, például `CONCAT`, `YEAR`, `IF`). A lényeg, a szerkezet, azonos.

## A kifejtés javasolt sorrendje

1. **Miért adatbázis?** Hibák az "egy nagy táblázatban" tároláskor: ismétlődés, ellentmondás.
2. **Relációs modell**: tábla, rekord, mező, adattípus.
3. **Kulcsok**: elsődleges és idegen kulcs.
4. **Kapcsolatok**: 1:N, N:M és ábrázolásuk (egyedkapcsolati ábra).
5. **Tervezés és normalizálás röviden**: első, második, harmadik normálforma lényege egy példán.
6. **SQL**: lekérdezés (SELECT), módosítás (INSERT, UPDATE, DELETE), JOIN, csoportosítás.
7. **Adatbiztonság**: jogosultságok, mentés, tranzakció (röviden).
8. **Összegzés**: az űrlap, lekérdezés, jelentés mint felhasználói felület.

## Normalizálás egy mondatban és egy példán

Példa: egy rendelések táblában minden sorban ismétlődik a vevő neve és címe. Ha a vevő címe változik, minden sort módosítani kellene, és elfelejtett módosítás ellentmondást okoz. Megoldás: külön **vevő** tábla (PK: vevő azonosító) és **rendelés** tábla, amely idegen kulccsal hivatkozik a vevőre.

- **1NF**: minden mező oszthatatlan értéket tartalmaz (nincs "több telefonszám egy mezőben").
- **2NF**: nincs olyan mező, amely csak a kulcs egy részétől függ.
- **3NF**: nincs olyan mező, amely nem a kulcstól, hanem egy másik nem kulcs mezőtől függ.

## Szemléltetés a gépen

- Mutass két kapcsolt táblát (például tanuló és osztály), a kulcsokat jelölve.
- Futtass egy `SELECT`-et szűréssel és rendezéssel, majd egy `JOIN`-t.
- Mutasd meg a `GROUP BY` hatását egy átlagszámításnál.
- Rajzolj egy egyszerű egyedkapcsolati ábrát egy papírra vagy a táblára.

## Tipikus bizottsági kérdések és mintaválaszok

**Mi az elsődleges kulcs, és miért kell?**
Olyan mező vagy mezőcsoport, amely egyértelműen azonosítja a tábla minden sorát. Nélküle nem tudnánk biztosan hivatkozni egy rekordra, és a kapcsolatok sem működnének.

**Mi az idegen kulcs?**
Egy másik tábla elsődleges kulcsának értékét tartalmazó mező. Ez teremti meg a kapcsolatot, és a hivatkozási integritás biztosítja, hogy csak létező értékre mutasson.

**Hogyan valósítunk meg N:M kapcsolatot?**
Egy kapcsolótáblával, amelynek két idegen kulcsa a két eredeti táblára hivatkozik. Például diák és tantárgy között a jegyek vagy beiratkozások tábla.

**Mi a különbség a WHERE és a HAVING között?**
A `WHERE` az egyes sorokat szűri csoportosítás előtt, a `HAVING` a csoportosított eredményt szűri összesítés után.

**Mit ad a normalizálás?**
Csökkenti a redundanciát, így kevesebb a módosítási, beszúrási és törlési anomália, és az adatok konzisztensek maradnak.

## Gyakori hibák

- Az elsődleges kulcs és az idegen kulcs szerepének felcserélése.
- A `WHERE` használata összesítő függvényre (`WHERE AVG(pont) > 5`): ide `HAVING` kell.
- `DELETE` vagy `UPDATE` feltétel nélkül.
- Szöveges mezőben tárolt lista ("A,B,C"): ez nem első normálforma.
- Az adatbázis és az adatbázis-kezelő összekeverése.
- A kulcsnak természetes, de változó adatot választanak (név), ahelyett, hogy azonosítót használnának.

## Összefoglalás

- Relációs adatbázis: táblák, rekordok, mezők, kulcsok.
- PK azonosít, FK kapcsol; az N:M kapcsolat kapcsolótáblát igényel.
- A normalizálás a redundanciát és az anomáliákat szünteti meg.
- SQL: SELECT-FROM-WHERE-GROUP BY-HAVING-ORDER BY, valamint JOIN.
- A tételnél érdemes egy saját, ismerős példa (iskola, könyvtár, webshop) köré építeni mindent.
