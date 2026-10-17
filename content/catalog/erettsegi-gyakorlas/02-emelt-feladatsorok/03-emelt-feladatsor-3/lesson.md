---
slug: emelt-feladatsor-3
title: "Emelt szintű feladatsor 3: repülőtér"
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Hogyan használd ezt a feladatsort?

Ez egy emelt szintű gyakorlati feladatsor az érettségi szerkezetében: **240 perc, 120 pont**. Nem hivatalos feladat másolata, saját feladatsor egy repülőtér forgalmi adataival, de ugyanazokat a készségeket kéri, mint a vizsga. Állíts be időzítőt, és dolgozz úgy, mintha vizsgán ülnél: csak a szoftver súgóját és a saját jegyzeteidet használd.

Az emelt szintű feladatsor három feladatból áll:

| Feladat | Pont | Javasolt idő |
|---|---|---|
| 1. Dokumentumkészítés **vagy** táblázatkezelés (egyet választasz) | 35 | 60 perc |
| 2. Adatbázis-kezelés (SQL) | 35 | 60 perc |
| 3. Algoritmizálás és programozás | 50 | 100 perc |
| Átnézés, mentések ellenőrzése | | 20 perc |

Ebben a leckében a **2. és a 3. feladat** található, mert ezeket a rendszer automatikusan javítja, és együtt ők adják a pontok 71%-át. Az 1. feladatot a saját programodban oldd meg: gyakorolhatod a *Dokumentumkészítés* és a *Táblázatkezelés* sáv emelt szintű feladataival, és a kapott pontokat te adod hozzá az összesítéshez.

Ha egy részfeladaton elakadtál, **lépj tovább**: a pontok részfeladatonként járnak, és a kimaradt lépés nem viszi el a többit.

### Ellenőrzőlista

- [ ] Az SQL-feladatoknál az **oszlopnevek, a sorrend és az értékek** is számítanak: pontosan azt add vissza, amit a feladat kér.
- [ ] A programozási feladatoknál a kimenet előtt ott legyen a feladat száma (`3. feladat: ...`), pontosan a megadott minta szerint.
- [ ] Mielőtt továbblépsz, futtasd a megoldásodat a mintaadatokon, és vesd össze a leírásban látható kimenettel.
- [ ] Gondold végig a **szélső eseteket** is: egyetlen sor az adatban, nem létező járatszám, azonos értékek (ilyenkor mindig az *első* a jó, ahol a feladat így kéri).

## 2. Adatbázis-kezelés (35 pont)

A repülőtér nyilvántartása négy táblából áll: `legitarsasag`, `gep`, `jarat` és `indulas`. A táblák oszlopait és a lekérdezések pontos kimenetét minden feladat leírása megadja. A nyolc lekérdezés a lecke **Adatbázis 1–8** feladata; a pontok megoszlása: 1. és 2. feladat 3-3 pont, 3., 4. és 5. feladat 4-4 pont, 6. feladat 5 pont, 7. és 8. feladat 6-6 pont.

A feladatok az emelt szint tipikus eszközeit kérik: csoportosítás és `HAVING`, `JOIN` két vagy három táblán, `LEFT JOIN` a hiányzó kapcsolatok kezelésére, allekérdezés (`NOT IN`, átlag feletti érték), `COUNT(DISTINCT ...)` és `CASE`.

Az érettségin a lekérdezésekhez MariaDB-t (phpMyAdmin) kapsz; itt SQLite fut. Az alap SQL ugyanaz, eltérés a dátum- és szövegfüggvényekben van (például MariaDB-ben `HOUR(ido)`, itt a szöveges összehasonlítás). A 8. feladat leírása jelzi ezt.

## 3. Algoritmizálás és programozás (50 pont)

Az `indulasok.txt` fájl a repülőtér egy havi forgalmát tartalmazza, soronként `járatszám;célállomás;távolság;nap;indulás;utasok;késés` alakban. A hét részfeladat a lecke **Programozás 1–7** feladata, Python vagy C# nyelven. Pontok: 4, 5, 7, 7, 8, 9 és 10.

Az érettségin egyetlen programot írsz, amely sorban megoldja az összes részfeladatot, és minden kimenet előtt kiírja a részfeladat számát. Itt minden részfeladat önálló, hogy külön ellenőrizhető legyen, de a kiírt szöveg ugyanaz. Az ékezetmentes kiírás is elfogadott.

### Mire figyelj?

- **Rekordok:** a kezdőkód minden sort egy `Indulas` rekorddá alakít. Ne a nyers szövegsorokkal dolgozz, hanem a rekord mezőivel.
- **Rendezés:** a sorok nincsenek időrendben. Ahol az időrend számít, előbb rendezz nap, majd indulási idő szerint (az `ÓÓ:PP` szöveg ábécérendje megegyezik az időrenddel). Kétkulcsú rendezésnél az első kulcs egyenlősége dönt a másodikról.
- **Rekurzió:** a rekurzív függvénynek mindig legyen *leállási feltétele* (itt az egyelemű szakasz, illetve az egyjegyű szám), és minden hívás közelebb kerüljön hozzá.
- **Az "első" és az "utolsó":** ha a feladat azt kéri, hogy azonos értéknél az első számítson, a maximumkeresésnél csak *szigorúan nagyobb* érték cserélje le az eddigi legjobbat.
- **Leghosszabb szakasz:** számold az egymás utáni jó elemeket, és amikor a sorozat megszakad (vagy véget ér), vesd össze az eddigi legjobbal.

## Önértékelés

Add össze az automatikusan javított 2. és 3. feladat pontjait (35 + 50), és add hozzá az 1. feladatra a saját pontozásodat (35). Az érettségin a ponthatárokat a hivatalos értékelési útmutató adja meg; gyakorláshoz a 120 pontnak legalább a 60%-a (72 pont) a jó cél. Ha egy részfeladat nem ment, írd fel, melyik típusalgoritmust kellett volna felismerned, és gyakorold az adott modulban.
