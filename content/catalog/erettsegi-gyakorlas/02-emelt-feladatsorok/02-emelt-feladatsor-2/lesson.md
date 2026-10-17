---
slug: emelt-feladatsor-2
title: "Emelt feladatsor 2: időjárás-állomás"
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Hogyan használd ezt a feladatsort?

Ez egy emelt szintű gyakorlati feladatsor az érettségi szerkezetében, saját forgatókönyvvel (nem hivatalos feladat másolata). Az emelt gyakorlati vizsga **240 perc és 120 pont**; ez a lap az automatikusan javított két nagy feladatot adja: a **2. Adatbázis-kezelést (35 pont)** és a **3. Algoritmizálást és programozást (50 pont)**, együtt 85 pontot. Az 1. feladat (dokumentumkészítés vagy táblázatkezelés, 35 pont) irodai programban készül, ide nem tartozik.

Állíts be időzítőt, és dolgozz úgy, mintha vizsgán ülnél: csak a szoftver súgóját és a saját jegyzeteidet használd.

### Időbeosztás (a 240 percből)

| Feladat | Pont | Javasolt idő |
|---|---|---|
| 1. Dokumentumkészítés vagy táblázatkezelés (nincs ezen a lapon) | 35 | 70 perc |
| 2. Adatbázis-kezelés (8 lekérdezés) | 35 | 55 perc |
| 3. Algoritmizálás és programozás (7 részfeladat) | 50 | 105 perc |
| Átnézés, mentések ellenőrzése | | 10 perc |

Ha egy részfeladaton elakadtál, **lépj tovább**: a pontok részfeladatonként járnak.

### Ellenőrzőlista

- [ ] A programozási feladatoknál minden részfeladat kimenete a **sorszámával** kezdődik (`3. feladat`), és a szöveg betűre pontosan a megadott minta.
- [ ] Ahol a feladat bevitelt kér, a kérdést **külön sorban** írod ki, és csak utána olvasol be.
- [ ] A kimenetben nincs ékezet: az ékezetmentes kiírás az érettségin is elfogadott.
- [ ] A lekérdezéseknél az oszlopnevek (`AS`) és a sorrend egyezik a leírással.
- [ ] Mielőtt továbblépsz, a mintafájlra futtasd le a programot, és vesd össze a leírás mintájával.

## A forgatókönyv

Egy meteorológiai hálózat állomásainak napi mérései állnak rendelkezésre. Az **adatbázis-feladathoz** két tábla tartozik: az `allomas` (név, település, tengerszint feletti magasság) és a `meres` (állomás, dátum, napi középhőmérséklet, csapadék, széllökés). A táblák szerkezetét minden feladat leírása megadja.

A **programozási feladathoz** egy állomás egy hónapos napi adatai az `idojaras.txt` fájlban vannak (nap, minimum, maximum, csapadék, szél). A fájl felépítését a feladatok leírása részletezi, a mintafájl a feladatok mellett letölthető.

## 2. Adatbázis-kezelés (35 pont)

A nyolc lekérdezés a lecke **Adatbázis 1-8** feladata. A pontok: 4 + 4 + 5 + 4 + 4 + 5 + 4 + 5. A nehézség fokozatosan nő: az elején egyszerű szűrés és rendezés, a végén korrelált allekérdezés és osztályozás `CASE`-zel.

Az érettségin a lekérdezésekhez MariaDB-t (phpMyAdmin) kapsz; itt a futtató rendszer SQLite-ot használ, ezért a megoldásban az alap SQL-t használd. Eltérések, amelyekre figyelj:

- A MariaDB-ben a `LEFT(datum, 7)` és a `SUBSTR(datum, 1, 7)` is működik, SQLite-ban csak a `SUBSTR`.
- A MariaDB-ben van `IF(feltétel, igen, nem)`, SQLite-ban a `CASE WHEN ... END` az általános megoldás; az utóbbi mindkét rendszerben működik.
- Az `AVG` és a `ROUND` mindkét rendszerben ugyanúgy használható.

Gyakori hiba: `LEFT JOIN` helyett `JOIN` (a mérés nélküli sor eltűnik), `WHERE` helyett `HAVING` (és fordítva), az allekérdezés korreláló feltételének elhagyása (ekkor az egész tábla átlagához hasonlítasz).

## 3. Algoritmizálás és programozás (50 pont)

A hét részfeladat a lecke **Programozás 1-7** feladata, Python vagy C# nyelven. A pontok: 5 + 6 + 7 + 7 + 8 + 8 + 9. A témák: összegzés és szélsőérték, bevitel és keresés, sorozat feldolgozása, rendezés, **rekurzív** függvény, **kétdimenziós táblázat (mátrix)**, végül **kimeneti fájl** írása és tartalmának kiíratása.

Az érettségin egyetlen programot írsz, amely sorban megoldja az összes részfeladatot, és a kimenetben minden részfeladat előtt kiírja a számát. Itt minden részfeladat önálló, hogy külön ellenőrizhető legyen, de a kiírt szöveg ugyanaz.

Hasznos tudnivalók:

- **Rendezés:** használd a nyelv rendezőjét, de gondold végig, mi történik azonos kulcsnál. A leírás mindig megmondja, melyik elem kerül előre; a Python `sorted` és a C# `OrderByDescending` is stabil, vagyis megtartja az eredeti sorrendet.
- **Rekurzió:** minden rekurzív függvénynek van alapesete (amikor már nem hívja magát) és lépése. Ha az alapeset hiányzik, a program végtelen mélységbe hívja önmagát, és összeomlik.
- **Mátrix:** a sor- és oszlopindex kiszámítása a hibalehetőség. Rajzold le egy kis példán (például 10 nap, a hónap szerdán kezdődik), és csak utána írd le a képletet.
- **Kimeneti fájl:** először írd meg, zárd le, és csak utána olvasd vissza; különben a visszaolvasott tartalom hiányos lehet. A visszaolvasott szöveget soronként, a sorvégek megtartásával írd ki.

## Önértékelés

Ebből a lapból 85 pont származik automatikus ellenőrzéssel. Az érettségin az emelt szint ponthatárai a 120 pont százalékos arányában értendők: 25% az elégséges, 80% a jeles határa. Ha az adatbázis-részben 21 pont (60%) alatt maradtál, ismételd át a csoportosítást és az allekérdezéseket; ha a programozásnál 30 pont (60%) alatt, nézd meg, melyik részfeladat (rekurzió, mátrix, fájlkezelés) vitte el a legtöbb időt, és gyakorold a hozzá tartozó modult. Ha az idő fogyott el, a következő alkalommal a nehezebb részfeladatokat hagyd a végére.
