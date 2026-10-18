---
slug: kozep-feladatsor-2
title: "Középszintű feladatsor 2: mozi"
position: 1
free: true
published: false
reviewed_by:
reviewed_at:
---

## Hogyan használd ezt a feladatsort?

Ez egy teljes, középszintű gyakorlati feladatsor az érettségi szerkezetében: **180 perc, 100 pont**. Nem hivatalos feladat másolata, saját feladatsor egy mozi adataival, de ugyanazokat a készségeket kéri, mint a vizsga. Állíts be időzítőt, és dolgozz úgy, mintha vizsgán ülnél: csak a szoftver súgóját és a saját jegyzeteidet használd.

A feladatok két csoportra oszlanak:

- **Szövegszerkesztés, vizuális elemek, táblázatkezelés:** ezeket a saját programodban oldod meg. Ezt a platform nem pontozza automatikusan, ezért a pontozási táblázatok alapján magad pontozod a munkádat.
- **Adatbázis-kezelés és programozás:** ezek a lecke feladatai, a böngészőben írod meg és futtatod őket, és a rendszer automatikusan ellenőrzi. A lecke feladatlistájában találod őket.

### Időbeosztás (180 perc)

| Feladat | Pont | Javasolt idő |
|---|---|---|
| I. Szövegszerkesztés | 25 | 45 perc |
| II. Vizuális elemek | 20 | 40 perc |
| III. Táblázatkezelés | 25 | 40 perc |
| IV. Adatbázis-kezelés | 15 | 25 perc |
| V. Algoritmizálás és programozás | 15 | 25 perc |
| Átnézés, mentések ellenőrzése | | 5 perc |

Ha egy részfeladaton elakadtál, **lépj tovább**: a pontok részfeladatonként járnak, és a kimaradt lépés nem viszi el a többit.

### Ellenőrzőlista

- [ ] Minden munkafájlt a **vizsgakönyvtárba** mentesz, a megadott néven.
- [ ] A programozási feladatoknál a kimenet előtt ott van a feladat száma (`3. feladat: ...`), pontosan a kért formában.
- [ ] Az SQL-feladatoknál az **oszlopnevek, a sorrend és az értékek** is számítanak.
- [ ] Mentés a végén is, **minden** fájlra, mielőtt bezárod a programokat.

## I. Szövegszerkesztés (25 pont)

A mozi havi műsorfüzetét kell elkészítened. Gépelj be (vagy másolj be) egy rövid, legalább négy bekezdéses szöveget a moziról: a cím legyen az első sor ("Csillag Mozi, novemberi műsor"), az alcímek pedig "Nyitvatartás", "Jegyárak" és "Ajánlott filmek". A jegyárak alá írj egy 4 soros, 3 oszlopos táblázatot (Jegytípus, Hétköznap, Hétvége). Mentsd `musor` néven, majd hajtsd végre az alábbi lépéseket:

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | Az oldal mérete A4, **mind a négy margó 2 cm**. | 2 |
| 2 | A cím **Címsor 1** stílusú, középre igazított, 20 pontos, félkövér. | 3 |
| 3 | A törzsszöveg **Calibri**, 12 pontos, sorkizárt, 1,15-ös sorközű, 6 pontos térközű; ezt a **Normál stílus módosításával** állítsd be. | 4 |
| 4 | Az alcímek **Címsor 2** stílusúak, 14 pontosak, félkövérek. | 3 |
| 5 | A nyitvatartás bekezdéséből készíts pontozott **felsorolást** (munkanapok, hétvége, ünnepnapok külön pontban). | 3 |
| 6 | A táblázat fejléce félkövér, szürke hátterű, a számokat tartalmazó oszlopok jobbra igazítottak, a táblázat körül vékony szegély van. | 4 |
| 7 | Szúrj be egy mozis képet a szöveg végére, 6 cm szélesre méretezve, arányosan, középre igazítva. | 3 |
| 8 | **Élőfej:** a 'Csillag Mozi' szöveg balra igazítva. **Élőláb:** automatikus oldalszám, jobbra igazítva. | 2 |
| 9 | Futtass **helyesírás-ellenőrzést**, a dokumentum nyelve magyar legyen. | 1 |

## II. Vizuális elemek (20 pont)

### A) Képszerkesztés (10 pont)

Használj egy saját, legalább 1200 pixel széles fényképet (például mozitermet vagy plakátot). Mentsd az eredetit `plakat.jpg` néven.

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | Méretezd át a képet **900 pixel szélesre**, az arányok megtartásával. | 2 |
| 2 | Vágd ki a kép közepéből egy **900 × 500 pixeles** téglalapot. | 2 |
| 3 | Állítsd a **fényerőt -10-re** és a **kontrasztot +20-ra**. | 2 |
| 4 | Írd rá a 'Ma este a moziban!' szöveget sárga színnel, kb. 40 pixeles betűvel, vízszintesen középre, a kép felső sávjába. | 2 |
| 5 | Mentsd a kész munkát `plakat_kesz.png` néven PNG formátumban. | 2 |

### B) Bemutató (10 pont)

Készíts **négydiás** bemutatót `moziest.pptx` (vagy `.odp`) néven: 1. dia: cím (*Moziest a Csillag Moziban*) és alcím (a neved); 2. dia: *Mit játszunk?*, négypontos felsorolás; 3. dia: *Jegyeladások*, a `plakat_kesz.png` és egy oszlopdiagram (Hétfő 48, Kedd 62, Szerda 55, Csütörtök 71, Péntek 134); 4. dia: *Várunk szeretettel!*, egy mondat.

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | A bemutató négy diából áll, a sorrend a leírás szerinti. | 1 |
| 2 | Az elrendezések megfelelőek, a címek valódi címhelyőrzőben vannak. | 2 |
| 3 | Az egységes háttér és a címek formázása a **diamintában** van beállítva. | 2 |
| 4 | A 2. dia felsorolása valódi felsorolás, legalább 24 pontos betűvel. | 1 |
| 5 | A 3. dián a kép és a diagram nem takarja egymást; a diagramnak címe és feliratozott tengelyei vannak. | 2 |
| 6 | Dia-szám az élőlábban (a címdia kivételével), minden diára áttűnés. | 2 |

## III. Táblázatkezelés (25 pont)

A mozi az első félév látogatóit gyűjtötte össze teremként. Másold be az adatokat egy új munkafüzetbe az A1 cellától:

```text
Hónap;1. terem;2. terem;3. terem;Kisterem
Január;820;640;510;190
Február;790;615;480;205
Március;905;700;560;230
Április;870;655;530;215
Május;760;590;455;180
Június;640;510;390;160
```

| Lépés | Teendő | Pont |
|---|---|---|
| 1 | Az **F1** cellába írd: 'Összesen'. Az F2:F7 tartományban **függvénnyel** számold ki hónaponként az összes látogatót. | 3 |
| 2 | A 8. sorban számold ki oszloponként az összeget, a 9. sorban az átlagot egészre kerekítve, a 10. sorban a legnagyobb értéket. | 4 |
| 3 | A **G1** cellába írd: 'Kisterem aránya'. A G2:G7 cellákban számold ki a kisterem látogatóinak arányát az adott havi összeshez képest, százalék formátumban, egy tizedesjeggyel. | 4 |
| 4 | A **H1** cellába írd: 'Minősítés'. A H2:H7 cellákban függvénnyel jelenítsd meg: 'kiemelt', ha az összes látogató legalább 2300, különben 'átlagos'. | 4 |
| 5 | A **J1** cellába írd: 'Erős hónapok'. A J2 cellában függvénnyel számold meg, hány hónapban volt az 1. terem látogatóinak száma 800 fölött. | 3 |
| 6 | Feltételes formázással emeld ki az F2:F7 tartományban a 2300 vagy annál nagyobb értékeket világoszöld háttérrel. | 2 |
| 7 | A fejlécsor félkövér és középre igazított, az A1:H10 tartomány vékony szegélyt kap. | 2 |
| 8 | Készíts oszlopdiagramot a hónapok összes látogatójáról 'Havi látogatók' címmel, feliratozott tengelyekkel. | 3 |

## IV. Adatbázis-kezelés (15 pont)

A mozi nyilvántartása két táblából áll: `film` és `vetites`. A táblák oszlopait és a négy lekérdezés pontos kimenetét minden feladat leírása megadja. A négy lekérdezés a lecke **Adatbázis 1–4** feladata; a pontok megoszlása: 3, 3, 4 és 5 pont.

A lekérdezéseket az érettségin is MariaDB-ben (phpMyAdmin) írod. Az alap SQL (`WHERE`, `GROUP BY`, `HAVING`, `ORDER BY`, `JOIN`) itt is ugyanaz.

## V. Algoritmizálás és programozás (15 pont)

A `vetitesek.txt` fájl a mozi vetítéseit tartalmazza, soronként `cím;műfaj;játékidő;kezdés;eladott jegyek;jegyár` alakban. Az öt részfeladat a lecke **Programozás 1–5** feladata, Python vagy C# nyelven. Pontok: 2, 2, 3, 3 és 5.

Az érettségin egyetlen programot írsz, amely sorban megoldja az összes részfeladatot, és a kimenetben minden részfeladat előtt kiírja a számát. Itt minden részfeladat önálló, hogy külön ellenőrizhető legyen, de a kiírt szöveg ugyanaz. Az ékezetmentes kiírás is elfogadott.

### Mire figyelj?

- A kezdőkód minden sort egy `Vetites` rekorddá alakít: a mezőivel dolgozz, ne a nyers szövegsorral.
- A "legtöbb" keresésénél azonos értéknél az **első** találat számít: csak szigorúan nagyobb érték cserélje le az eddigit.
- A 4. feladatban a beolvasott névvel dolgozz, és a "nincs ilyen" esetet is kezeld.
- A kerekítést formázással végezd, ne kézzel vágd le.

## Önértékelés

Add össze az automatikusan javított IV. és V. feladat pontjait (15 + 15), és add hozzá az I–III. feladatra a saját pontozásodat (70). Gyakorláshoz a 100 pontnak legalább a 60%-a a jó cél. Ha egy részfeladat nem ment, írd fel, mit kellett volna felismerned, és gyakorold az adott modulban.
