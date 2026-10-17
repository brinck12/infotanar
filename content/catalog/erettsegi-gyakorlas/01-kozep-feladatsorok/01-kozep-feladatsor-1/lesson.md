---
slug: kozep-feladatsor-1
title: "Középszintű feladatsor 1: könyvtár"
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Hogyan használd ezt a feladatsort?

Ez egy teljes, középszintű gyakorlati feladatsor az érettségi szerkezetében: **180 perc, 100 pont**. Nem hivatalos feladat másolata, saját feladatsor, de ugyanazokat a készségeket kéri, mint a vizsga. Állíts be időzítőt, és dolgozz úgy, mintha vizsgán ülnél: csak a szoftver súgóját és a saját jegyzeteidet használd.

A feladatok két csoportra oszlanak:

- **Szövegszerkesztés, vizuális elemek, táblázatkezelés:** ezeket a saját programodban (Word, LibreOffice Writer és Calc, bármilyen képszerkesztő és bemutatókészítő) oldod meg. Ezt a platform nem pontozza automatikusan, ezért a lap alján találsz egy **Megoldás** részt, és a pontozási táblázatok alapján magad pontozod a munkádat.
- **Adatbázis-kezelés és programozás:** ezek a lecke feladatai, a böngészőben írod meg és futtatod őket, és a rendszer automatikusan ellenőrzi. A lecke feladatlistájában találod őket.

### Időbeosztás (180 perc)

| Feladat | Pont | Javasolt idő |
|---|---|---|
| I. Szövegszerkesztés | 25 | 45 perc |
| II. Vizuális elemek: képszerkesztés (10) és bemutató (10) | 20 | 15 + 25 perc |
| III. Táblázatkezelés | 25 | 40 perc |
| IV. Adatbázis-kezelés | 15 | 25 perc |
| V. Algoritmizálás és programozás | 15 | 25 perc |
| Átnézés, mentések ellenőrzése | | 5 perc |

Ha egy részfeladaton elakadtál, **lépj tovább**: a pontok részfeladatonként járnak, és a kimaradt lépés nem viszi el a többit.

### Ellenőrzőlista, mielőtt elkezded és mielőtt befejezed

- [ ] Minden munkafájlt a **vizsgakönyvtárba** mentesz (itt: egy külön `gyakorlat` mappába), a megadott néven.
- [ ] A programozási feladatoknál a megoldás elején vagy a végén **kiírod a feladat számát** (`2. feladat: ...`), pontosan a kért formában.
- [ ] A szöveges feladatok forrásszövegét **nem gépeled újra**, hanem bemásolod, és a beillesztést formázás nélkülire állítod.
- [ ] A fájlnevekben és a kimenetben nincs elgépelés: a rendszer (és a vizsga javítója is) karakterre egyezést vár.
- [ ] Mentés a végén is, **minden** fájlra, mielőtt bezárod a programokat.

## I. Szövegszerkesztés (25 pont)

A könyvtár őszi hírlevelét kell elkészítened. Az alábbi **forrásszöveget** másold be egy új dokumentumba (soronként egy bekezdés; az első sor a cím, az "Nyitvatartás", "Az Olvasási Hét programja" és "Szolgáltatásaink" sorok az alcímek):

```text
Rózsadombi Városi Könyvtár
Az őszi hónapokban is várjuk az olvasókat! Könyvtárunk idén is csatlakozik az országos Olvasási Hét programjához, amelynek során minden korosztály találhat magának érdekes eseményt. A beiratkozás a Rózsadombi lakosoknak ingyenes, a diákok és a nyugdíjasok pedig a kölcsönzési díj kedvezményére jogosultak.
Nyitvatartás
A könyvtár hétfőtől péntekig 10 és 18 óra között, szombaton 9 és 13 óra között tart nyitva. Vasárnap és ünnepnapokon zárva vagyunk. A kölcsönzési idő négy hét, amely egy alkalommal további négy héttel meghosszabbítható.
Az Olvasási Hét programja
Az alábbi táblázatban gyűjtöttük össze az események időpontját. A részvétel minden programon ingyenes, a mesedélutánra azonban előzetesen jelentkezni kell a pultnál.
Szolgáltatásaink
A könyvek kölcsönzése mellett folyóiratolvasót, számítógépes hozzáférést és nyomtatási lehetőséget is biztosítunk. Külön részleg várja a gyerekeket, ahol olvasósarok és társasjátékok is a rendelkezésükre állnak.
Várjuk Önt is a Rózsadombi Városi Könyvtárban!
```

Az eseménytáblázat adatai (a "Az Olvasási Hét programja" bekezdés után kerüljön a dokumentumba):

| Nap | Időpont | Program | Helyszín |
|---|---|---|---|
| Hétfő | 16:00 | Mesedélután | Gyerekrészleg |
| Kedd | 17:30 | Író-olvasó találkozó | Nagyterem |
| Szerda | 15:00 | Számítógépes alapismeretek | Olvasóterem |
| Csütörtök | 17:00 | Könyvcsere | Aula |
| Péntek | 18:00 | Versmondó est | Nagyterem |

Mentsd a dokumentumot `hirlevel` néven a vizsgakönyvtárba, majd hajtsd végre az alábbi lépéseket:

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | Az oldal mérete A4, **mind a négy margó 2,5 cm**. | 2 |
| 2 | A címsor (első sor) legyen **Címsor 1** stílusú, középre igazított, 20 pontos, félkövér, színe sötétzöld. | 3 |
| 3 | A törzsszöveg bekezdései **Arial** betűtípusúak, 11 pontosak, sorkizártak, 1,15-ös sorközzel és 6 pontos térközzel a bekezdések után. Ezt a **Normál stílus módosításával** állítsd be, ne soronként. | 4 |
| 4 | Az alcímek (három sor) legyenek **Címsor 2** stílusúak, 14 pontosak, félkövérek, balra igazítottak. | 3 |
| 5 | A nyitvatartás bekezdéséből készíts **felsorolást**: a napok (hétfőtől péntekig, szombat, vasárnap és ünnepnapok) külön pontba kerüljenek, pontozott felsorolásjellel. A szöveget ehhez te bontsd három rövid pontra. | 2 |
| 6 | Az eseménytáblázat: a fejléc félkövér, világoszöld hátterű, a táblázat körül vékony, folytonos szegély, az 'Időpont' oszlop szövege középre igazított, a táblázat az oldal teljes szélességét kitölti. | 5 |
| 7 | Szúrj be a dokumentum végére egy tetszőleges könyves képet (saját fotó vagy ingyenes kép), **5 cm szélesre** méretezve, arányosan, középre igazítva. | 3 |
| 8 | **Élőfej:** jobbra igazítva a 'Rózsadombi Városi Könyvtár' szöveg. **Élőláb:** középre igazítva az **automatikus oldalszám**. | 2 |
| 9 | Futtass **helyesírás-ellenőrzést**, és javítsd a hibákat; a dokumentum nyelve magyar legyen. | 1 |

## II. Vizuális elemek (20 pont)

### A) Képszerkesztés (10 pont)

Használj egy **saját fényképet**, amelyen könyvespolc vagy könyvek láthatók (ha nincs ilyen, bármilyen, legalább 1200 pixel széles fotó megfelel). Mentsd az eredetit `polc.jpg` néven a vizsgakönyvtárba, és **ne írd felül**: a munkát másolaton végezd.

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | Méretezd át a képet **800 pixel szélesre**, az arányok megtartásával. | 2 |
| 2 | Vágd ki a kép **közepéből egy 800 × 450 pixeles** téglalapot. | 2 |
| 3 | Állítsd a **fényerőt +20-ra** és a **kontrasztot +10-re** (vagy a programod hasonló skáláján kb. ennyivel). | 2 |
| 4 | Írd rá a képre az 'Olvass velünk!' szöveget fehér színnel, kb. 36 pixeles betűvel, a kép alsó sávjába, vízszintesen középre. | 2 |
| 5 | Mentsd a kész munkát `polc_kesz.png` néven PNG formátumban, a vizsgakönyvtárba. | 2 |

### B) Bemutató (10 pont)

Készíts **négydiás** bemutatót `olvasasi_het.pptx` (vagy `.odp`) néven. A tartalom:

1. dia: cím: *Olvasási Hét a Rózsadombi Könyvtárban*, alcím: a saját neved.
2. dia: cím: *Mit kínálunk?*, alatta **négypontos felsorolás**: mesedélután, író-olvasó találkozó, könyvcsere, versmondó est.
3. dia: cím: *A hét látogatottsága*, alatta a **"polc_kesz.png"** képed, és egy **oszlopdiagram** a látogatók számáról (Hétfő 34, Kedd 52, Szerda 21, Csütörtök 45, Péntek 60).
4. dia: cím: *Várunk mindenkit!*, alatta egy mondat és a nyitvatartás ('H–P 10–18, Szo 9–13').

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | A bemutató négy diából áll, a dia-sorrend a leírás szerinti. | 1 |
| 2 | A dia **elrendezései** megfelelőek (címdia, cím + felsorolás, cím + tartalom), a címek valódi címhelyőrzőben vannak. | 2 |
| 3 | A **diamintában** (dia-főnézet) egységes háttérszínt vagy -mintát állítasz be, és a címek betűtípusát, színét itt módosítod, nem diánként. | 2 |
| 4 | A 2. dia felsorolása **valódi felsorolás** (nem kézzel beírt kötőjel), a pontok betűmérete legalább 24 pont. | 1 |
| 5 | A 3. dián a kép és a diagram **nem takarja egymást**, a diagramnak címe és feliratozott tengelyei vannak. | 2 |
| 6 | **Dia-számot** jelenítesz meg az élőlábban (a címdia kivételével), és minden diára **áttűnést** állítasz be. | 2 |
## III. Táblázatkezelés (25 pont)

A könyvtár az első fél év kölcsönzéseit gyűjtötte össze műfajonként (a számok kölcsönzött kötetek). Másold be az adatokat egy új munkafüzetbe az A1 cellától (az első sor a fejléc), és mentsd `kolcsonzesek` néven:

```text
Hónap;Regény;Ifjúsági;Ismeretterjesztő;Mese
Január;120;85;40;60
Február;135;90;38;64
Március;150;102;45;70
Április;142;98;52;66
Május;128;110;47;72
Június;110;75;30;58
```

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | Az **F1** cellába írd: 'Összesen'. Az F2:F7 tartományban számold ki **függvénnyel** (SZUM / SUM) hónaponként az összes kölcsönzést. | 3 |
| 2 | A 8. sorban számold ki oszloponként az **összeget** (B8:F8), a 9. sorban az **átlagot egészre kerekítve** (ÁTLAG és KEREK függvénnyel), a 10. sorban a **legnagyobb** értéket (MAX). Az A8:A10 cellákba írd a sorok nevét. | 5 |
| 3 | A **G1** cellába írd: 'Ifjúsági arány'. A G2:G7 cellákban számold ki, az ifjúsági kölcsönzések az adott havi összes hányadát. A cellák formátuma **százalék, egy tizedesjeggyel**. | 4 |
| 4 | A **H1** cellába írd: 'Minősítés'. A H2:H7 cellákban függvénnyel jelenítsd meg, hogy az adott hónap **'kiemelt'**, ha az összes kölcsönzés legalább 400, különben **'átlagos'** (HA / IF). | 3 |
| 5 | A **J1** cellába írd: 'Erős regényhónapok'. A J2 cellában függvénnyel add meg, **hány hónapban** volt a regény-kölcsönzések száma **130 fölött** (DARABTELI / COUNTIF). | 3 |
| 6 | **Feltételes formázással** emeld ki az F2:F7 tartományban a 400 vagy annál nagyobb értékeket világoszöld háttérrel. | 2 |
| 7 | A fejlécsor legyen félkövér és középre igazított, az A1:H10 tartomány kapjon vékony szegélyt, az oszlopok szélessége illeszkedjen a tartalomhoz. | 2 |
| 8 | Készíts **oszlopdiagramot** a hónapok összes kölcsönzéséről (A1:A7 és F1:F7 alapján): a diagram címe 'Havi kölcsönzések', a vízszintes tengely felirata 'Hónap', a függőleges 'Kötet', jelmagyarázat nélkül; helyezd a H12 cella alá. | 3 |

## IV. Adatbázis-kezelés (15 pont)

A könyvtár nyilvántartása két táblából áll: `konyv` (a könyvek adatai) és `kolcsonzes` (a kölcsönzések). A táblák oszlopait, és a négy lekérdezés pontos kimenetét minden feladat leírása megadja. A négy feladat a lecke **Adatbázis 1–4** feladatai; a pontok megoszlása: 1. feladat 3 pont, 2. feladat 3 pont, 3. feladat 4 pont, 4. feladat 5 pont.

Az érettségin a lekérdezésekhez MariaDB-t (phpMyAdmin) kapsz; itt a sorrend, az oszlopnevek és az eredmény számít. Az `AS` név, a `WHERE`, a `GROUP BY`, a `HAVING`, az `ORDER BY` és a `JOIN` mindkét rendszerben ugyanúgy működik.

## V. Algoritmizálás és programozás (15 pont)

A `konyvek.txt` fájl a könyvtár állományát tartalmazza, soronként `szerző;cím;kiadás éve;oldalszám` alakban. A feladat öt részfeladata a lecke **Programozás 1–5** feladata, Python vagy C# nyelven. Pontok: 1. részfeladat 2 pont, 2. részfeladat 3 pont, 3. részfeladat 3 pont, 4. részfeladat 3 pont, 5. részfeladat 4 pont.

Az érettségin egyetlen programot írsz, amely sorban megoldja az összes részfeladatot, és a kimenetben minden részfeladat előtt kiírja a számát (`3. feladat: ...`). Itt minden részfeladat önálló, hogy külön ellenőrizhető legyen, de a kiírt szöveg ugyanaz. Az ékezetmentes kiírás is elfogadott.

## Megoldás

Itt a szövegszerkesztés, a vizuális elemek és a táblázat megoldásának menete. A programozás és az adatbázis mintamegoldásait a feladatok beküldése után a rendszer mutatja.

### I. Szövegszerkesztés

1. **Elrendezés / Oldalbeállítás:** méret A4, margók mind 2,5 cm (Wordben: Elrendezés → Margók → Egyéni margók; Writerben: Formátum → Oldal).
2. A cím sorát jelöld ki, **Kezdőlap → Stílusok → Címsor 1**. Ezután a stílust módosítsd (jobb gomb a stíluson → Módosítás): Arial 20 pt, félkövér, sötétzöld, középre. A módosítás a stílusban él, nem a szövegen.
3. **Normál** stílus módosítása: Arial 11 pt; **Bekezdés**: sorkizárt, sorköz 1,15, térköz utána 6 pt. A lényeg: a beállítás minden törzsbekezdésre automatikusan érvényes.
4. A három alcímre **Címsor 2** stílus, a stílus módosításával 14 pt, félkövér, balra.
5. A nyitvatartás bekezdését három soros, felsorolásjeles listává alakítsd: *Hétfőtől péntekig 10–18 óra*, *Szombaton 9–13 óra*, *Vasárnap és ünnepnapokon zárva*. A kölcsönzési időt tartalmazó mondat marad normál bekezdés.
6. **Beszúrás → Táblázat**: 4 oszlop, 6 sor (fejléc + 5). A fejléc háttere világoszöld, a szegély vékony, folytonos; az 'Időpont' oszlop középre. A táblázat szélességét az **Automatikus illesztés → Ablakhoz igazítás** adja.
7. **Beszúrás → Kép**, majd a képtulajdonságokban szélesség 5 cm, **arányok zárolva**; a bekezdés középre igazított.
8. **Beszúrás → Élőfej** (jobbra), **Élőláb** (középre), **Oldalszám** mező. Ne kézzel írd be a számot.
9. **Véleményezés → Nyelv beállítása: magyar**, majd Helyesírás-ellenőrzés.

Gyakori pontvesztés: a térköz sorokkal (Enter) kitöltése, a méret kézzel húzása, a stílus helyett kézi formázás, a felsorolás kötőjellel.

### II. Vizuális elemek

**Képszerkesztés.** A képméretezésnél a *lánc* ikont (arány megtartása) kapcsold be: 1600×1200 eredetinél az eredmény 800×600. A 800×450-es kivágás a 600 magasságból a felső és alsó 75-75 pixelt hagyja el. A szöveget külön szövegrétegre vagy szövegeszközzel add hozzá; a fehér szöveg olvashatóságához tegyél alá sötétebb sávot. PNG-ben mentsd, az eredeti `polc.jpg` változatlan maradjon.

**Bemutató.** Használj beépített elrendezéseket (Címdia; Cím és tartalom). A **dia-főnézetben** (Nézet → Diaminta) állítsd be a háttérszínt és a címek betűit. A 2. dián a felsorolás a tartalom-helyőrző alapértelmezett felsorolása. A 3. dián a diagram: Beszúrás → Diagram → Oszlop; az adatok: Hétfő 34, Kedd 52, Szerda 21, Csütörtök 45, Péntek 60; add meg a diagram és a tengelyek címét. A dia-számot a Beszúrás → Dia száma (Élőláb) parancs adja, a címdián kapcsold ki. Áttűnés: Áttűnések fül → bármelyik effektus, **Alkalmazás mindenre**.

### III. Táblázatkezelés

A képletek (magyar Excelben és LibreOffice-ban; angolul zárójelben):

- F2: `=SZUM(B2:E2)` (`=SUM(B2:E2)`), lemásolva F7-ig. Értékek: Január: 305, Február: 327, Március: 367, Április: 358, Május: 357, Június: 273.
- B8: `=SZUM(B2:B7)`, a 8. sor értékei: 785, 560, 252, 390 és az F8 összesen 1987.
- B9: `=KEREK(ÁTLAG(B2:B7);0)` (`=ROUND(AVERAGE(B2:B7),0)`): 131, 93, 42, 65.
- B10: `=MAX(B2:B7)`.
- G2: `=C2/F2`, cellaformátum **Százalék**, 1 tizedes. Értékek: Január 27,9%, Február 27,5%, Március 27,8%, Április 27,4%, Május 30,8%, Június 27,5%.
- H2: `=HA(F2>=400;"kiemelt";"átlagos")` (`=IF(F2>=400,"kiemelt","átlagos")`). Kiemelt hónapok: . A legnagyobb összes forgalmú hónap: Március (367).
- J2: `=DARABTELI(B2:B7;">130")` (`=COUNTIF(B2:B7,">130")`) értéke: **3**.
- **Feltételes formázás:** Kezdőlap → Feltételes formázás → Cellakiemelési szabályok → Nagyobb vagy egyenlő → 400, világoszöld kitöltés. (Excelben a 'Nagyobb, mint' szabály 399-cel is megadható, de a 'nagyobb vagy egyenlő' a pontos.)
- **Diagram:** jelöld ki az A1:A7 és F1:F7 tartományt (Ctrl nyomva a másodikat), Beszúrás → Oszlopdiagram; Diagramelemek: cím, tengelycímek, jelmagyarázat törlése; mozgasd a H12 cella alá.

Gyakori hiba: a képletbe beírt szám (pl. 400-as küszöb szövegként), kerekítés cellaformátummal a KEREK függvény helyett, abszolút és relatív hivatkozás keverése másoláskor.

## Önértékelés

Add össze a pontjaidat az I–III. feladat táblázataiból, és add hozzá az automatikusan javított IV–V. feladatok pontjait (15 + 15). Az érettségin 25% (itt 25 pont) az elégséges, 80% (80 pont) a jeles határa. Ha 60 pont alatt maradtál, nézd meg, melyik részfeladat hozta a legkevesebbet, és gyakorold a hozzá tartozó modult. Ha az idő fogyott el, a következő alkalommal a nehezebb részeket hagyd a végére.
