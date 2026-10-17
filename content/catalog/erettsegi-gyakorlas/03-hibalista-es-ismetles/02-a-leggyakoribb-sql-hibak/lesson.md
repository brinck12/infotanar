---
slug: a-leggyakoribb-sql-hibak
title: A leggyakoribb SQL-hibák
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az SQL-hibák két fajtája

Az SQL-lekérdezések hibái kétfélék lehetnek. Az egyik **hibaüzenetet** ad: a lekérdezés nem fut le. A másik alattomosabb: a lekérdezés lefut, de **rossz eredményt** ad, és te nem veszed észre, mert nincs piros szöveg. Az érettségin ez utóbbi viszi el a pontokat, ezért mindig nézd át az eredményt: annyi sor és az a sor van-e benne, amire számítasz?

## A hat gyakori hiba

**`= NULL` az `IS NULL` helyett.** A `NULL` azt jelenti, hogy az adat ismeretlen vagy hiányzik. Ismeretlen értékkel semmit sem lehet egyenlőnek vagy különbözőnek mondani, ezért az `email = NULL` feltétel soha nem igaz. A helyes forma: `email IS NULL`, illetve `email IS NOT NULL`.

**`LIKE` minta nélkül.** A `LIKE 'A'` csak az egyetlen `A` betűből álló értéket találja meg. Ha az `A`-val kezdődő szövegek kellenek, a `%` jellel jelöld a tetszőleges folytatást: `LIKE 'A%'`. A `%` tetszőleges számú karaktert, az `_` pontosan egy karaktert jelent.

**`AND` és `OR` zárójel nélkül.** Az `AND` erősebben köt, mint az `OR`: az `a OR b AND c` jelentése `a OR (b AND c)`. Ha mást akarsz, tegyél zárójelet: `(a OR b) AND c`. Zárójelezd a vegyes feltételeket akkor is, ha nem muszáj.

**`WHERE` az összesítő függvény szűrésére.** A `WHERE` a csoportosítás **előtt** szűri a sorokat, ott a `COUNT(*)` még nem ismert. A csoportok szűrésére a `HAVING` való, a `GROUP BY` után: `GROUP BY olvaso HAVING COUNT(*) >= 3`.

**Összekapcsolás feltétel nélkül.** Ha két táblát összekapcsolsz, és nem adod meg, melyik oszlopok egyeznek, a rendszer **minden sort minden sorral** párosít (descartes-szorzat). Az eredmény sokkal több sor lesz a vártnál. Mindig kell az `ON konyv.szerzo_id = szerzo.id` típusú feltétel.

**Rendezés rossz irányban.** Az `ORDER BY` alapértelmezetten **növekvő**. A legnagyobbakat a `DESC` kulcsszóval kapod: `ORDER BY pont DESC LIMIT 3`.

## Az érettségi MariaDB-je és a platform SQLite-ja

Ezek a hibák mindkét rendszerben ugyanúgy jelentkeznek. A különbség a függvényekben van: az érettségin használt MariaDB-ben például van `IF(...)`, `CONCAT(...)` és `YEAR(...)`. A platform kódfuttatója SQLite, ezért itt a feladatok alap SQL-ben íródtak. Az érettségin azt használd, amit a feladat megad.

## Hogyan dolgozz a feladatokkal?

Mindegyik feladatban egy hibás lekérdezést kapsz. Futtasd, és vesd össze az eredményt azzal, amit a leírás kér. Ha hibaüzenetet kapsz, olvasd el, hol jelzi a hibát. Ha nincs hibaüzenet, számold meg a sorokat, és ellenőrizd, hogy a kért oszlopok, a kért sorok és (ha számít) a megfelelő sorrend szerepel-e.

## Gyakori hibák a javításnál

- A hibás lekérdezést teljesen újraírod ahelyett, hogy megkeresnéd a hibás részt.
- Nem ellenőrzöd az oszlopokat: a kért oszlopok neve és sorrendje számít.
- A `HAVING`-et és a `WHERE`-t felcseréled.

## Összefoglalás

`IS NULL` az `= NULL` helyett, `%` a `LIKE`-ban, zárójel az `AND` és `OR` körül, `HAVING` a csoportok szűrésére, `ON` feltétel az összekapcsolásnál, `DESC` a csökkenő rendezéshez. Ha egy lekérdezés lefut, még nem biztos, hogy jó: mindig ellenőrizd az eredményt.
