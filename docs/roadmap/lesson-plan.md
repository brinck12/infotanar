# Tananyagterv: nulláról az emelt szintű digitális kultúra érettségiig

Állapot: **vázlat jóváhagyásra** (2026-10-17). Semmi nem készült el belőle; a tartalom az `content/catalog/` alatt, a `content/README.md` formátumában készül, minden lecke `published: false` állapotban indul.

## 1. Források és amit belőlük tudunk

- **Követelmény:** OH, *Digitális kultúra, részletes érettségi vizsgakövetelmények* (2024-es kiadvány, alkalmazás kezdete 2022. 01. 01.). Az emelt szint tartalmazza a középszintet.
- **Minta:** 2026. május 18-i emelt gyakorlati feladatlap (E2611). Szerkezete: 1A *Dokumentumkészítés* **vagy** 1B *Táblázatkezelés* (35 pont), 2. *Adatbázis-kezelés* (35 pont, SQL, taxis téma), 3. *Algoritmizálás és programozás* (50 pont, fájlból olvasó járműmozgás-feladat). Összesen 120 pont, 240 perc.
- **Szóbeli (emelt):** 20 perc, 30 pont. A) egy téma kifejtése a hat tartalmi területből (szövegszerkesztés, grafika és képszerkesztés, bemutatókészítés, publikálás a weben, táblázatkezelés, adatbázis-kezelés), B) egy vagy több programozási feladat megoldása és bemutatása. A tételek nem nyilvánosak, a tételsor legalább 20 tétel.
- **Jogi megjegyzés:** a hivatalos feladatsorok szövegét nem másoljuk. A mintát csak a szerkezet és a nehézség felmérésére használtuk; minden feladatunk saját, hasonló nehézségű.

### Mi a programozási követelmény (7. és 8. fejezet)

Közép: egyszerű adattípusok (egész, valós, logikai, karakter), véletlen értékek, szöveg és sorozat, szekvencia/elágazás/ciklus, típusalgoritmusok (összegzés, eldöntés, kiválasztás, keresés, megszámlálás, maximum-kiválasztás), egyetlen típusalgoritmust igénylő feladat, eljárások és függvények, állománykezelés, billentyűzet és képernyő, kulturált adatbevitel és -kivitel, tesztelés mintaadatokkal.

Emelt, ami ezen felül kell: többdimenziós adatszerkezet, összetett (vegyes típusú) adatszerkezet, **kiválogatás, rendezés, szétválogatás, metszet, unió**, közepes nehézségű, **típusalgoritmusok egymásba építését** igénylő feladat, mondatszerű algoritmus módosítása és kódolása, **rekurzió** (fogalom + rekurzív algoritmus kódolása), nyomkövetéses tesztelés, adatmodell felállítása feladatleírásból.

A 2026-os minta programozási feladata ezeket mutatja: a felhasználó adja meg az adatfájl nevét/azonosítóját, a program beolvassa a tabulátorral tagolt sorokat, majd 6–8 részfeladatban számol (első nem nulla elem, maximum/küszöb, leghosszabb szakasz, adott időpont keresése, összegzés), kimeneti fájlt ír tabulátorral tagolva, a kiírás előtt a részfeladat sorszámát írja ki (`2. feladat`).

## 2. Alapelvek

1. **Nulláról indulunk**, és minden érettségi-témakör bekerül (a diák az összes területre készül).
2. **Két nyelv, mindenhol.** Minden programozási lecke szövege, példája, feladata Pythonban és C#-ban is elkészül (`::: python` / `::: csharp` szakaszok, lásd `content/README.md`); az SQL nyelvfüggetlen. A C# kód mindig teljes program (Mono, C# 7).
3. **Kis lépések.** Egy lecke egy új dolgot vezet be, 3–5 feladattal: bemelegítő (átírás/kiegészítés) → önálló → "érettségis" forma. Minden lecke végén visszatérő hibák listája.
4. **Az érettségi formája korán.** Már az 1. modultól a feladatokban szerepel a vizsga stílusa: a részfeladat sorszámának kiírása, bekérés kiírt szöveggel, megadott kimeneti minta, ékezetmentes kiírás is elfogadott.
5. **Nehézség fokozatosan:** `level: kozep` az alapokra és a tételekre, `level: emelt` az emelt-témákra és a vizsgasorokra. Egy feladat `difficulty` 1–5.
6. **Súlyozás a pontok szerint.** Emeltben a programozás 50, az adatbázis 35, a dokumentum/táblázat 35 pont: a programozás és az SQL a pontok 71%-a, ezért ezek készülnek először és a legrészletesebben.

## 3. Sávok és terjedelem

| Sáv (`track`) | Modulok | Leckék | Fő vizsgarész |
|---|---|---|---|
| `programozas` | 9 | 49 | gyakorlati 3. (közép 15 p, emelt 50 p), szóbeli B |
| `adatbazis-kezeles` | 9 | 24 | gyakorlati 2. (közép 15 p, emelt 35 p), szóbeli A |
| `tablazatkezeles` | 6 | 14 | gyakorlati 1B (közép 25 p, emelt 35 p) |
| `dokumentumkeszites` | 4 | 24 | gyakorlati 1A (közép 25+20 p, emelt 35 p) |
| `szobeli` | 3 | 14 | szóbeli A+B, szaknyelv |
| `erettsegi-gyakorlas` | 3 | 10 | teljes feladatsorok, időzítve |
| **Összesen** | | **~135 lecke** | |

Ez több száz feladat; a megvalósítás ezért hullámokban megy (7. fejezet). Az első hullám (programozás 1–4. modul + SQL 1–5. modul) már használható közép szintű felkészítést ad.

## 4. A programozás sáv (részletesen)

Jelölés: **[K]** közép, **[E]** emelt. A "tipikus hiba" mezőt a szerző a leckébe írja.

### Modul 1: Alapok (8 lecke) [K]

| # | Lecke | Új fogalmak | Feladatok (témák) |
|---|---|---|---|
| 1 | Kiírás és bevitel | utasítás, kiírás, bevitel, változó | köszöntés, név beolvasása, két szám összege *(kész, referencia)* |
| 2 | Típusok és számolás | egész/valós/szöveg/logikai, `+ - * /`, egész osztás és maradék, típusátalakítás, kerekítés | kerület/terület, átlag, fizetés számolás, óra→perc, maradékos osztás |
| 3 | Elágazás | `if/else`, összehasonlítás | páros-e, nagyobb szám, jegy szövegesen, szökőév |
| 4 | Összetett feltételek | `and/or/not`, többágú elágazás, egymásba ágyazás | háromszög szerkeszthető-e, életkor-kategória, osztályzat-határok, éves nap-sorszám |
| 5 | Számlálós ciklus | `for`, ciklusváltozó, tartomány | 1..N kiírása, osztók, szorzótábla, csillagrajzolás |
| 6 | Feltételes ciklus | `while`, megszakítás, "amíg nem 0" bevitel, véletlen szám | számkitalálós játék, számjegyek összege, lnko (Euklidész), 0-ig beolvasott számok összege |
| 7 | Szövegek | hossz, indexelés, szeletelés, keresés, nagy/kisbetű, karakterek bejárása | magánhangzók száma, megfordítás, monogram, Caesar-kód, szöveg formázott kiírása |
| 8 | Hibakeresés és tesztelés | szintaktikai/futási/logikai hiba, tesztadatok, nyomkövetés kézzel és hibakeresővel | hibás kód javítása (3–4 feladat), kimenetjóslás, tesztesetek kitalálása |

### Modul 2: Sorozatok és függvények (6 lecke) [K]

| # | Lecke | Új fogalmak | Feladatok |
|---|---|---|---|
| 9 | Lista / tömb | létrehozás, elemek elérése, hossz, hozzáadás, bejárás | N szám beolvasása és kiírása fordítva, átlag, `szam[i]` indexelés |
| 10 | Sorok feldolgozása | `split`/`Split`, `join`/`Join`, szám-sorozat egy sorból, tagolt adat | szóközzel elválasztott számok összege, szavak megszámolása, `a;b;c` felbontása |
| 11 | Függvények | paraméter, visszatérési érték, helyi/globális változó, eljárás vs. függvény | `negyzet`, `paros`, `max2`, hatványozás, függvényekre bontott program |
| 12 | Halmaz és szótár | egyedi elemek, kulcs–érték, tartalmazás-vizsgálat | egyedi nevek, gyakoriság (szótár), "látott-e már" |
| 13 | Formázott kiírás | formátumsztringek, tizedesjegyek, igazítás, tabulátor | táblázatos kiírás, pénznem, `13.4 m/s` jellegű kimeneti minta |
| 14 | Kulturált adatbevitel | kiírt kérdés, érvényesítés (nem kötelező), `try`-parse, feladatsorszám kiírása | "érettségi stílusú" interaktív program |

### Modul 3: Programozási tételek (7 lecke) [K]

A diák először a *mondatszerű leírást* látja, aztán kódolja. A 3.1–3.5 leckék slugja egyezzen a már meglévő katalógus-slugokkal (`osszegzes-tetele`, `megszamlalas-tetele`, `maximumkivalasztas-tetele`, `eldontes-tetele`, `kivalogatas-tetele`), hogy a haladás megmaradjon.

| # | Lecke | Mit tanít | Feladatok |
|---|---|---|---|
| 15 | Összegzés | halmozó változó, kezdőérték | összeg, átlag, feltételes összeg |
| 16 | Megszámlálás | számláló, feltétel | páros darabszám, küszöb feletti, magánhangzók |
| 17 | Eldöntés | `van-e`, `minden-e`, korai kilépés | van-e negatív, mind pozitív-e, prímteszt |
| 18 | Kiválasztás és keresés | első találat helye, "biztosan van" vs. "lehet, hogy nincs" | első páros helye, szó keresése listában |
| 19 | Maximum- és minimumkiválasztás | érték és index, első/utolsó előfordulás | legnagyobb szám + helye, legrövidebb név |
| 20 | Kiválogatás [E-előkészítés] | új lista építése feltétellel | párosak, küszöb felettiek, hosszú szavak |
| 21 | Tételek összeépítése | több tétel egy ciklusban, egymás után | feltételes max, átlag feletti darabszám, "az első olyan, amelyik …" |

### Modul 4: Állománykezelés (5 lecke) [K→E]

| # | Lecke | Mit tanít | Feladatok |
|---|---|---|---|
| 22 | Szöveges fájl olvasása | fájl megnyitása, soronként, sorok száma | fájl összes sorának kiírása, megszámolása |
| 23 | Tagolt adatok | tabulátoros/pontosvesszős sorok, számmá alakítás, fejlécsor | oszlopok összege, tagolt sor feldolgozása |
| 24 | Fájl írása | kimeneti fájl, formátum (tabulátor), sortörés | átalakított adatok mentése, kimeneti fájl ellenőrzése |
| 25 | A fájlnév bekérése | `X.txt` felépítése futásidőben, fájl hiánya (nem kell kezelni) | azonosítóhoz tartozó fájl beolvasása |
| 26 | Teljes fájlos feladat | beolvas → feldolgoz → ír | mini-érettségi: 5 részfeladat egy adatfájlon |

### Modul 5: Összetett adatszerkezetek (4 lecke) [E]

| # | Lecke | Mit tanít |
|---|---|---|
| 27 | Rekord / osztály | több mezős adat: `class`/`dataclass` vs. C# `class`; adatmodell felállítása a feladatból |
| 28 | Rekordok listája | fájlból rekordlista, bejárás, mezők feldolgozása |
| 29 | Többdimenziós adat | 2D lista/tömb, sor-oszlop bejárás, mátrix-feladatok (sorösszeg, átló) |
| 30 | Adatmodellezés | "milyen adatot milyen típusban tárolok", táblázat → rekord/lista, az érettségi adatfájlokból modellt építeni |

### Modul 6: Emelt típusalgoritmusok (6 lecke) [E]

| # | Lecke | Mit tanít |
|---|---|---|
| 31 | Szétválogatás | egy listából két lista egy feltétel szerint |
| 32 | Rendezés | cserés/minimumkiválasztásos rendezés kézzel, a beépített rendezés használata |
| 33 | Rendezés rekordokon | kulcs szerinti, többszempontú rendezés, stabilitás |
| 34 | Metszet | két halmaz közös elemei, rendezett listák esetén lineáris |
| 35 | Unió | két halmaz egyesítése, ismétlődés kezelése |
| 36 | Összetett feladatok | tételek egymásba építése rekordokon (mint a vizsga 4–6. részfeladata): leghosszabb szakasz, első küszöbátlépés, két szomszédos elem vizsgálata |

### Modul 7: Rekurzió (3 lecke) [E]

| # | Lecke | Mit tanít |
|---|---|---|
| 37 | A rekurzió fogalma | alapeset, rekurzív hívás, hívási lánc, veremmélység |
| 38 | Klasszikus rekurzív feladatok | faktoriális, Fibonacci, hatvány, lnko, számjegyösszeg |
| 39 | Rekurzió szövegen és listán | palindrom, lista összege/maximuma, kettéosztás, mondatszerű rekurzív leírás kódolása |

### Modul 8: Algoritmusleírás és tesztelés (4 lecke) [K→E]

| # | Lecke | Mit tanít |
|---|---|---|
| 40 | Mondatszerű leírás | az érettségi algoritmus-jelölése olvasása, folyamatábra nélkül |
| 41 | Kódolás leírásból | adott mondatszerű algoritmus lekódolása; módosítása (más feltétel, más tétel) |
| 42 | Tesztelés és nyomkövetés | mintaadatok választása, szélső esetek (üres lista, egy elem), nyomkövetési táblázat |
| 43 | Hatékonyság és tisztaság | elnevezések, felesleges ciklusok, mi a "jó megoldás" a javítási útmutatóban |

### Modul 9: Érettségi programozási feladatok (6 lecke) [K és E]

| # | Lecke | Tartalom |
|---|---|---|
| 44 | Közép-szintű feladat lépésről lépésre | 5 részfeladat, szövegértés, kimeneti minta olvasása |
| 45 | Emelt feladat 1: fájl + rekord | adatfájl beolvasása rekordokba, 6–8 részfeladat |
| 46 | Emelt feladat 2: leghosszabb szakasz | sorozat feldolgozása, a "mikor történt először/utoljára" típus |
| 47 | Emelt feladat 3: rendezés és kiírás | rendezett eredmény fájlba |
| 48 | Emelt feladat 4: rekurzió vagy 2D | rekurzív és mátrixos feladat |
| 49 | Időzített emelt feladat | 100 perc, az egész feladatsor, ellenőrző lista |

Minden "Emelt feladat" lecke saját, a vizsgával azonos nehézségű feladatot dolgoz fel; egy-egy lecke 6–8 részfeladatból (feladatonként egy `Exercise`) áll.

## 5. A többi sáv (modul- és leckeszinten)

### 5.1 Adatbázis-kezelés (`adatbazis-kezeles`), 9 modul, 24 lecke

A követelmény: választó, csoportosító, frissítő, törlő lekérdezés **SQL-ben**, adatbázis és tábla létrehozása/törlése, allekérdezés, dátum- és szövegfüggvények, aggregáló függvények. Az emelt feladat tipikus formája: egy `.sql` adatbázis betöltése után 7–9 lekérdezés.

1. **Alapfogalmak (3):** adatbázis, tábla, rekord, mező, elsődleges/idegen kulcs, adattípusok, kapcsolat fajtái (1:N), importálás fájlból.
2. **SELECT (3):** oszlopválasztás, `DISTINCT`, alias, számított mező.
3. **Szűrés és rendezés (3):** `WHERE`, `AND/OR/NOT`, `BETWEEN`, `IN`, `LIKE`, `ORDER BY`, `LIMIT`, NULL.
4. **Függvények (3):** `ROUND`, `CONCAT`, `LENGTH`, `SUBSTRING`, `IF`, dátumfüggvények (`YEAR`, `MONTH`, `DAY`, `NOW`, `HOUR`…).
5. **Összesítés (3):** `COUNT/SUM/AVG/MIN/MAX`, `GROUP BY`, `HAVING`.
6. **Több tábla (3):** `JOIN`, `INNER/LEFT`, azonosító és kulcs, táblák közti kapcsolat felismerése.
7. **Allekérdezés (2):** skalár- és listaalkérdezés, `IN`/`EXISTS`, "a legkisebb/legnagyobb szerint".
8. **Módosítás és szerkezet (2):** `INSERT/UPDATE/DELETE`, `CREATE DATABASE/TABLE`, kulcsok, `DROP`.
9. **Érettségi SQL-feladatok (2+):** a vizsga stílusú, 7–9 részfeladatos lekérdezéssor (közép és emelt).

### 5.2 Táblázatkezelés (`tablazatkezeles`), 6 modul, 14 lecke

Alapok (cella-típusok, formátumok, importálás kódolással, 2 lecke) · Képletek és hivatkozások (relatív/abszolút/vegyes, munkalapok közt, 2) · Függvények (matematikai, statisztikai, logikai, szöveg- és dátumkezelő, kereső: FKERES/VKERES/INDEX-HOL, adatbázis-kezelő függvények, 4) · Rendezés, szűrés, kigyűjtés, feltételes formázás, névvel ellátott tartomány (3) · Diagramok és objektumok, nyomtatás/PDF (2) · Érettségi táblázat-feladat (1).

### 5.3 Dokumentumkészítés (`dokumentumkeszites`), 4 modul, 24 lecke

- **Szövegszerkesztés (9):** dokumentumegységek és tipográfia, karakter- és bekezdésformázás, felsorolás és tabulátor, stílusok (új stílus: emelt), szakaszok, élőfej/élőláb/lábjegyzet, táblázat/kép/alakzat, tartalomjegyzék, kördokumentum, nyomtatás PDF-be.
- **Grafika és képszerkesztés (5):** raszter vs. vektor, formátumok és konverzió, rétegek, vektoralakzatok és halmazműveletek, csomópontok, képjavítás.
- **Bemutatókészítés (4):** alapelvek, diaminta, animáció/áttűnés, interaktív bemutató.
- **Publikálás a weben (6):** HTML szerkezet, szöveges elemek, hivatkozások és képek, lista/táblázat, CSS kapcsolata és kijelölők, könyvtárszerkezet.

### 5.4 Szóbeli (`szobeli`), 3 modul, 14 lecke

- **A) témák kifejtése (6 lecke):** egy-egy a hat területről; mindegyik "tételvázlat + szaknyelv + saját példa" formában, a követelmény tartalmi szempontjai szerint.
- **B) programozási feladat bemutatása (4 lecke):** megoldás szóbeli magyarázata, kódmódosítás és -értelmezés, tipikus kérdések.
- **Felelet felépítése (4 lecke):** időbeosztás, a pontozási szempontok (tartalom 18, logika 4, szaknyelv 4, kommunikáció 4), próbafelelet.

### 5.5 Érettségi gyakorlás (`erettsegi-gyakorlas`), 3 modul, 10 lecke

Közép feladatsorok, emelt feladatsorok, hibalista és ismétlés. Minden sor saját, a vizsga szerkezetét követő feladatsor (nem hivatalos feladat másolata).

## 6. Mit igényel a platform (a tartalom ezektől függ)

| Igény | Hol kell | Állapot / teendő |
|---|---|---|
| Fájlbemenet kódfuttatáshoz (adatfájl, fájlnév bekérése) | programozás 4–9. modul | **Ellenőrizendő:** Judge0 `additional_files` vagy a fájl tartalma stdin-en. Ha stdin, a feladatleírás a fájlt "bemenetnek" nevezi, és a 25. lecke fájlnév-bekérése korlátozott. Döntést igényel |
| Kimeneti fájl ellenőrzése | programozás 24., 26., 49. lecke | **Hiányzik.** Megoldás: a program a fájl tartalmát a végén ki is írja, vagy az ellenőrző csak a stdout-ot nézi |
| SQL dialektus | SQL-sáv | Az érettségin MariaDB (`IF`, `CONCAT`, `YEAR`), a platform SQLite-ot használ. Döntés: a sandbox kiegészítése ezekkel a függvényekkel, vagy a feladatok dialektus-semlegesre írása és külön jelzés |
| Nem-kód feladattípusok | táblázat, dokumentum, grafika, bemutató, web | A típusok megvannak a `FRONTEND.md`-ben, a backendjük részben hiányzik (`sheet_upload`, `doc_upload`, `visual_upload`, `web`, böngészős gyakorlók). Ezek leckeszövegei addig megírhatók feladat nélkül |
| Mintakimenet-szerkesztő a feladatleírásban | programozás | A leírás Markdown, a kimeneti minta kódblokk; elég |
| Véletlen értékek | 6. lecke | Determinisztikus tesztekhez a feladat fix mintát vagy magot kérjen; a véletlenszerű feladatokat csak futtatni lehet, nem automatikusan ellenőrizni |

## 7. Megvalósítási sorrend (hullámok)

| Hullám | Tartalom | Lecke | Eredmény |
|---|---|---|---|
| 0 | Platform: döntés a fájlbemenetről és az SQL-dialektusról; 1. lecke kész | 1 | a szerző el tud kezdeni írni |
| 1 | Programozás 1–3. modul | 21 | teljes közép-szintű alap- és tételes anyag, Python + C# |
| 2 | SQL 1–6. modul | 18 | közép szintű adatbázis-felkészítés |
| 3 | Programozás 4–5. modul, SQL 7–9., szóbeli B | ~19 | fájlos feladatok, rekordok, érettségi SQL |
| 4 | Programozás 6–9. modul | 19 | az emelt programozás komplett |
| 5 | Táblázatkezelés, szóbeli A, gyakorló sorok | ~35 | közép táblázat és minden szóbeli téma |
| 6 | Dokumentum, grafika, bemutató, web | ~24 | teljes lefedés |

Lecke-gyártás menete lecketípusonként azonos (spec 8. fejezet): vázlat (a szerzőtől vagy innen) → lecke + feladatok → `catalog:import --dry-run` → `catalog:verify --drafts --negative` → átolvasás → `published: true` → `main`.

## 8. Nyitott kérdések

1. **Fájl a futtatásban:** stdin-en kapja a program a fájlt, vagy valódi fájl kell? (Ez a 4–9. modul tartalmát és a hozzá tartozó feladatok formáját dönti el.)
2. **SQL:** a MariaDB-eltérést kezeljük-e a sandboxban, vagy dialektus-semleges feladatokat írunk?
3. **Szóbeli tételek:** nyilvánosan nincs tételsor, a hat terület kifejtési szempontjait a követelményből vezetjük le. Van tanár, aki ezeket átnézi?
4. **A nem-kód sávok** (táblázat, dokumentum, web) kerüljenek-e be a béta tartalmába, vagy a programozás és SQL után jönnek? (A terv a második.)
5. **Videó:** lecke elé tervezünk-e rövid videót (a platform kezeli), vagy az első kiadás szöveges?
