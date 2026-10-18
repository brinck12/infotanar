---
slug: emelt-szintu-tablazat-feladat
title: Emelt szintű táblázat-feladat és ellenőrző lista
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: emelt. Az alábbi feladat saját, a vizsga szerkezetét követő minta (35 pont), nem hivatalos feladat.*

## Mi más az emelt szint?

Az emelt szintű táblázat-feladat ugyanúgy forrásfájlból indul és lépésekre bomlik, mint a közép szintű, de a lépések összetettebbek: többfeltételes számolás, kereső függvény, egymásba ágyazott `HA`, feltételes formázás képlettel, és kombinált diagram másodlagos tengellyel. Itt a függvényválasztás a feladat nagy része: ha tudod, melyik függvény mit tud, a képlet néhány sor.

A leckében egy teljes mintafeladatot oldunk meg lépésenként, majd egy ellenőrző listával zárunk.

## A feladat

> **Kerékpármegosztó.** Az `allomasok.txt` fájl (UTF-8, tabulátorral tagolt) egy kerékpármegosztó rendszer állomásainak havi adatait tartalmazza. Az első sor a fejléc. Oszlopai: állomás neve, kerület, dokkok száma, kölcsönzések száma (db), átlagos kölcsönzési idő (perc), nyitás dátuma.
>
> 1. Nyissa meg a fájlt, és mentse `allomasok` néven a program saját formátumában. (2 pont)
> 2. A munkalap neve legyen `Adatok`; a fejléc legyen félkövér, középre igazított, szürke hátterű, az oszlopszélességek igazodjanak a tartalomhoz. (2 pont)
> 3. A `G` oszlopban jelenítse meg a kölcsönzés időtartamának kategóriáját: 45 perctől `hosszú`, 25 perctől `közepes`, különben `rövid`. (4 pont)
> 4. A `H` oszlopban számítsa ki az egy dokkra jutó kölcsönzések számát egy tizedesre kerekítve! (3 pont)
> 5. A `J2` és `J3` cellában számítsa ki az összes kölcsönzés számát, illetve az átlagukat! (2 pont)
> 6. A `J4` cellában jelenítse meg a legtöbb kölcsönzést bonyolító állomás nevét! (4 pont)
> 7. A `J5` cellában számítsa ki a XI. kerületi állomások kölcsönzéseinek összegét! (2 pont)
> 8. A `J6` cellában számolja meg, hány állomás nyílt 2019-ben! (3 pont)
> 9. A `K9:K11` tartományban számolja meg a `J9:J11` cellákban megadott kategóriák (`rövid`, `közepes`, `hosszú`) előfordulását! (2 pont)
> 10. A `J13` cellába írjon be egy állomásnevet; a `K13` cellában jelenjen meg a hozzá tartozó kölcsönzésszám! (3 pont)
> 11. Színezze zöld hátterűre és félkövérre azokat a sorokat, ahol az egy dokkra jutó kölcsönzés 25-nél több! (3 pont)
> 12. Készítsen kombinált diagramot: az állomásonkénti kölcsönzések számát oszlopokkal, az átlagos kölcsönzési időt vonallal, másodlagos tengelyen jelenítse meg! A diagram címe `Forgalom és kölcsönzési idő`, minden tengelynek legyen címe, a jelmagyarázat alul legyen! (4 pont)
> 13. Állítsa be az oldalt fekvő tájolásúra, és úgy, hogy a munkalap egy oldalra férjen. (1 pont)

Összesen: 35 pont.

Az adat (`A1:F9`):

| Állomás | Kerület | Dokk | Kölcsönzés | Idő (perc) | Nyitás |
|---|---|---|---|---|---|
| Deák tér | V. | 20 | 412 | 18 | 2019.05.14 |
| Nyugati | VI. | 30 | 655 | 22 | 2019.05.14 |
| Keleti | VIII. | 25 | 389 | 25 | 2020.03.02 |
| Móricz Zs. körtér | XI. | 18 | 301 | 31 | 2020.09.21 |
| Újbuda-központ | XI. | 22 | 278 | 27 | 2021.04.10 |
| Margitsziget | XIII. | 15 | 520 | 45 | 2019.06.01 |
| Hősök tere | XIV. | 16 | 467 | 52 | 2021.07.15 |
| Örs vezér tere | X. | 28 | 344 | 20 | 2022.03.28 |

## Megoldás lépésről lépésre

### 1–2. Megnyitás és formázás

Importáláskor a fájl eredete `UTF-8`, az elválasztó `Tabulátor`. Ellenőrizd, hogy a dátumok valóban dátumként érkeztek-e (jobbra igazodnak, és a `Cellák formázása` ablakban `Dátum` típusúak). A fejléc: félkövér, középre igazítás, háttérszín; az oszlopszélességhez jelöld ki az oszlopokat, és dupla kattintás az oszlopok közti vonalon. Az `Adatok` név a lapfülön átírható.

### 3. Kategória: egymásba ágyazott HA

Két feltétel három kategóriát ad, ezért a `HA` függvényt egymásba kell ágyazni. A feltételek sorrendje számít: a szigorúbbal kell kezdeni, különben a `45` perces is `közepes` lenne.

`G2`: `=HA(E2>=45;"hosszú";HA(E2>=25;"közepes";"rövid"))`

Eredmény: `rövid` (Deák, Nyugati, Örs), `közepes` (Keleti, Móricz, Újbuda), `hosszú` (Margitsziget, Hősök tere).

### 4. Dokkonkénti kölcsönzés

`H2`: `=KEREKÍTÉS(D2/C2;1)`

Excelben és LibreOffice-ban is a `KEREKÍTÉS(szám; hány_tizedes)` függvényt használd; a formázás csak a megjelenítést kerekítené, az értéket nem. Eredmények: 20,6; 21,8; 15,6; 16,7; 12,6; 34,7; 29,2; 12,3.

### 5. Összeg és átlag

- `J2`: `=SZUM(D2:D9)` → 3366
- `J3`: `=ÁTLAG(D2:D9)` → 420,75

### 6. A legforgalmasabb állomás neve

Ehhez két függvény együtt kell. A `HOL.VAN` megmondja, hányadik helyen áll az érték egy tartományban, az `INDEX` pedig az adott helyen lévő elemet adja vissza.

`J4`: `=INDEX(A2:A9;HOL.VAN(MAX(D2:D9);D2:D9;0))`

A `MAX(D2:D9)` értéke 655, ez a tartomány 2. eleme, így az `INDEX` az `A` oszlop 2. elemét adja: `Nyugati`. A `HOL.VAN` utolsó paramétere, a `0` a pontos egyezést kéri. Az adat sorrendjétől függetlenül működik.

### 7. Feltételes összeg

`J5`: `=SZUMHA(B2:B9;"XI.";D2:D9)` → 579 (301 + 278)

Ha a feltételben összehasonlítás van (például nagyobb, mint), azt is idézőjelbe kell tenni: `">=30"`.

### 8. Dátumra szűrő darabszám

Az évet a `DARABHATÖBB` két feltétellel adja meg: a dátum legalább 2019. január 1., és legfeljebb 2019. december 31.

`J6`: `=DARABHATÖBB(F2:F9;">="&DÁTUM(2019;1;1);F2:F9;"<="&DÁTUM(2019;12;31))` → 3

A `DARABHATÖBB` mindkét programban ugyanezen a néven használható. Az `&` jel a feltétel szövegét és a dátum számát fűzi össze.

### 9. Kategóriák előfordulása

`K9`: `=DARABTELI($G$2:$G$9;J9)` (LibreOffice-ban `DARABHA`). A tartomány abszolút (`$`), a feltétel a mellette lévő cella, így a képlet lefelé másolható. Eredmények: rövid 3, közepes 3, hosszú 2. Az összegük 8, vagyis megegyezik az állomások számával, ez jó ellenőrzés.

### 10. Keresés állomásnév alapján

`K13`: `=FKERES(J13;A2:D9;4;HAMIS)` (LibreOffice-ban `FKERES(J13;A2:D9;4;0)`). Az `A2:D9` a keresési tartomány, ahol az első oszlop a keresett név, a `4` a tartomány negyedik oszlopa, vagyis a kölcsönzés. Ha a `J13` cellába `Hősök tere` kerül, az eredmény 467. Mivel a név nem biztos, hogy létezik, emelt szinten gyakran kell hibakezelés: `=HAHIBA(FKERES(...);"nincs ilyen")` (`HAHIBA`: Excel és LibreOffice).

### 11. Feltételes formázás képlettel

Jelöld ki az `A2:H9` tartományt, és új szabály, **képlet használata**: `=$H2>25`. A formátum: zöld háttér, félkövér betű. A `$H` rögzíti az oszlopot, a `2` relatív sor. A szabály a Margitsziget (34,7) és a Hősök tere (29,2) sorát színezi.

### 12. Kombinált diagram

Jelöld ki az `A1:A9` és a `D1:E9` tartományt (`Ctrl`-lal), majd csoportos oszlopdiagramot készíts. Az `Idő (perc)` adatsor típusa legyen vonal, és kerüljön a másodlagos tengelyre. Add meg a címet (`Forgalom és kölcsönzési idő`), a tengelycímeket (például `Állomás`, `Kölcsönzés (db)`, `Idő (perc)`), és a jelmagyarázatot helyezd alulra. A részletes lépések a Diagram formázása és elemei leckében találod.

### 13. Oldalbeállítás

**Excel**: `Lapelrendezés` > `Tájolás` > `Fekvő`, majd `Lapelrendezés` > `Illesztés` (vagy az `Oldalbeállítás` ablak `Lap` fülén `Igazítás: 1 oldal széles, 1 oldal magas`). **LibreOffice**: `Formátum` > `Oldal...` > `Oldal` fül > `Fekvő`, `Munkalap` fül > `Nyomtatási méretarány` > `Nyomtatási tartomány igazítása a szélesség/magasság oldalaihoz` (1 × 1).

## Pontozási táblázat

| Lépés | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Pont | 2 | 2 | 4 | 3 | 2 | 4 | 2 | 3 | 2 | 3 | 3 | 4 | 1 |

Az összeg: 35 pont. Vedd észre, hogy a legtöbb pontot a `HA` ágyazás, a `HOL.VAN` + `INDEX` páros és a diagram adja.

## Ellenőrző lista

Beadás előtt menj végig a listán:

1. A forrásfájl kódolása jó, az ékezetek rendben vannak, a dátumok dátumként jelennek meg.
2. Minden számított cella képlet, és az eredmény megegyezik a fejben becsülttel (például a kategóriák összege az állomások száma).
3. A tartományok jók: a fejléc nincs benne, az összesítő cella nincs benne.
4. A rögzítések (`$`) helyesek, a képlet lefelé másolva sem csúszik el.
5. A kereső- és `HA` függvények feltételei a feladat szövegét követik (`>=` a „legalább”).
6. A kerekítés függvénnyel történt, nem pusztán formázással.
7. A feltételes formázás tartománya és képlete helyes, a szabálykezelőben csak a kért szabály van.
8. A diagram címe, tengelycímei, jelmagyarázata és típusai pontosan a kérések szerintiek.
9. Az oldalbeállítás a kért tájolású, és egy oldalra fér.
10. A fájl a kért néven és formátumban mentve van, és nincs benne hibaérték (`#HIV!`, `#ÉRTÉK!`, `#N/A`).

## Gyakori hibák

- A `HA` ágyazásában a feltételek rossz sorrendben állnak, ezért az egyik ág sosem teljesül.
- A `HOL.VAN` harmadik paramétere hiányzik vagy `1`, így rendezetlen adatnál rossz sort ad.
- Az `FKERES` oszlopindexe rossz, vagy a keresési tartomány nem az első oszloppal kezdődik.
- A `DARABHATÖBB` dátumfeltételébe nem teszed be a `&` jelet, és szövegként hasonlítja össze.
- A kerekítést csak formázással oldod meg.
- A feltételes formázás képletében hiányzik a `$`, ezért csak egy cella színeződik.
- A kombinált diagramban a másodlagos tengelyről elfelejtesz tengelycímet adni.

## Összefoglalás

Az emelt szintű táblázat-feladat ugyanazokra az alapokra épül, mint a közép szintű, de több feltétel és kereső függvény kell hozzá: egymásba ágyazott `HA`, `INDEX` + `HOL.VAN`, `SZUMHA`, `DARABHATÖBB`, `FKERES`, `KEREKÍTÉS`, képletes feltételes formázás és kombinált diagram másodlagos tengellyel. A megoldás menete: teljes leírás elolvasása, lépésenkénti haladás képletekkel, majd az ellenőrző lista végigjárása beadás előtt.
