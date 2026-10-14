# InfoTanár.hu: teljes áttekintés és teendőlista (indulás előtt)

Saját használatra: mit kell még csinálni az alkalmazással, hogy 17-18 éves diákok gond nélkül, rendes tempóban tudjanak vele tanulni. Frissítendő, ahogy a tételek elkészülnek (jelölőnégyzetek a 6. fejezetben).

Készült: 2026-10-14, az `fullstack/backend-platform` ágon (`2497e9b`). A számlázás és a Barion **szándékosan kimarad** (későbbre halasztva), a többi minden benne van.

Részletes nyers jelentések (azonosítókkal, fájl:sorral), a `docs/roadmap/review/` mappában:

| Fájl | Tartalom | Tételek |
|---|---|---|
| `guest-account.md` | vendég, regisztráció, belépés, fiók (böngészős végigkattintás) | G-01 … G-22 |
| `learning-workspace.md` | tanulási út, lecke, kódfuttatás (böngészős) | L01 … L24 |
| `filetasks-exams.md` | fájlfeladatok, vizsgafutó, gyakorlók, szóbeli (böngészős) | F01 … F25 |
| `admin.md` | admin felület (böngészős) | A-01 … A-31 |
| `backend-code.md` | backend kód- és logikai audit | B/S/K/F |
| `frontend-code.md` | frontend kód, információs szerkezet, hozzáférhetőség | IA/CH/A/P/F |
| `content.md` | tartalom és tanterv-lefedettség | – |

A tesztterv külön van: `tests/testplan.md`. A fejlesztési előzmények: `docs/roadmap/backend-progress.md`.

**Éles üzemi kiegészítés:** `docs/roadmap/production-readiness.md` (OPS, PRIV, LAUNCH, REL tételek: deploy és visszagörgetés, vizsgaidei kapacitás, hibafigyelés, adatvédelem és kiskorúak, zárt béta, SEO, tartalom-csővezeték, kiadás-minőség). Ott van az új **0a fázis** (zárt béta előtti blokkolók), és az alábbi 5. fejezet fázisaihoz tartozó kiegészítések. A két dokumentum együtt a teljes terv; ütközésnél a `production-readiness.md` az újabb.
**Indítási modell: zárt béta**, osztályonként, meghívókóddal. Nyilvános nyitás csak a 0a, 0, 1 fázis, a tartalom és a jogi szöveg után.

---

## 1. Rövid ítélet

**A motor kész, a termék még nem.** A backend funkcionálisan teljes (WP0–WP11 merge-elve, 295 API-teszt zöld, az auditok nem találtak blokkoló kódhibát), de egy diák ma nagyjából egy óra tartalmat kapna, és a tartalomhoz vezető út sok helyen nem egyértelmű.

A három legfontosabb dolog:

1. **Tartalom.** 2 ág, 6 lecke, 6 feladat, 0 videó, 0 jegyzet, 0 mintavizsga, a 8 feladattípusból 6-hoz egyetlen feladat sincs. A főoldal hat tanulási utat ígér, kettő van. Ez a legnagyobb rés, és a tanár ma nem is tud videót feltölteni az adminban.
2. **A diák nem tudja, mi a következő lépés.** Belépés után a generikus feladatlistára kerül, a "Folytatás" a már kész leckére mutat, az onboarding sehol nincs linkelve, a főoldal belépve is vendég-marketinget mutat.
3. **Pánikhelyzetek.** Vizsgán és feltöltésnél hibás fájlcserénél semmi visszajelzés, az automatikus beadás hibája némán megáll, nincs kilépés-figyelmeztetés, a gyakorló feladatok ujratöltéskor elvesztik a munkát. Egy 17 éves ezeknél kapja el a legrosszabb élményt.

Ami **jól működik** (megerősítve böngészőben): regisztráció és e-mail megerősítés (hamisított és újrahasznált linkekkel is), jelszó-visszaállítás, fiók törlése és export, zárolt tartalmak üzenetei mindhárom állapotban, kódfuttatás 429-es üzenete, rejtett tesztek védelme, fájlvalidációs üzenetek, vizsgafutó újratöltés utáni állapottartása, lejárt vizsga egyenes az eredményre, a kódszabályok előzetes jelzése, jó magyar, következetes "te" hangnem, nincs konzolhiba a normál úton.

---

## 2. Mit néztem és mit nem (a bizalmi határ)

- **Böngészős végigkattintás** (Playwright, valódi Laravel, Judge0-mock): 4 ügynök, asztali 1280 és mobil 390 px nézettel, saját fiókokkal. Két környezet: A = valódi katalógus (6 lecke), B = a teszt-fixture-ök (fájlfeladatok, vizsgák).
- **Kódaudit**: backend és frontend, statikus olvasás, nem teljes körű (spot-check).
- **Tartalomaudit**: a hivatalos vizsgaleírás tükörforrásból (farkascs.hu); az OH saját PDF-jeit nem tudtuk megnyitni. Ellenőrizendő az OH-nál.
- **Nem néztük**: számlázás/fizetés; valódi Judge0 (a mock minden választ hamisít, így a helyes megoldás sikerága csak a B környezetben látszott); hosszú kimenet és időtúllépés; valódi telefon-billentyűzet; `doc_practice` (nincs seedelt feladat); valódi 30 perces vizsgalejárat (csak óra-előrecsavarással); screen reader.
- **Egy ügynök-kijelentés ellenőrizendő**: L12 (a "Folyamatban lévő lecke" számláló 0 maradt) nem lett újra megnézve.

---

## 3. Tervezési elvek 17-18 évesekhez

Ezek alapján rangsoroltam, és ezekhez kell mérni a javításokat:

1. **Mindig legyen egy nyilvánvaló következő lépés.** Belépés, lecke vége, feladat vége, hiba után: egy fő gomb, hogy mi jön. Nem menü, nem lista.
2. **Soha ne vesszen el a munka.** Piszkozat mentés mindenhol (gyakorló táblázat, web feladat, jegyzetek, szóbeli), kilépés-figyelmeztetés vizsgán és feltöltésen.
3. **Hibánál mondd meg, mit tegyen.** "Nem a te hibád, próbáld újra 1 perc múlva", nem "HTTP 503". Idő a korlátozásokhoz. Soha ne maradjon néma állapot.
4. **Rövid körök.** Egy feladat 10-15 perc, látható haladás, apró siker-visszajelzés. A 17 évesek telefonon is tanulnak: a mobil nem kivétel.
5. **Egy szó egy dologra.** Beadás / küldés / ellenőrzés / megoldás, feladat / feladatsor / vizsga: egységesíteni.
6. **Ne hazudjon az oldal.** Ne ígérjen hat tanulási utat, ha kettő van; ne mutasson "58 feladatot", ha hat van; ne mutassa a kész leckét "Itt tartottál"-ként.
7. **Hozzáférhető alapból.** Cím minden oldalnak, skip link, fókusz utvonalváltáskor, 44 px célpontok, kontraszt.

---

## 4. Átfogó témák (a nyers tételek összevonva)

Az azonosítók a fenti fájlokra mutatnak.

### T1. Tartalom (a legnagyobb rés)
- 6 lecke / 6 feladat / 0 videó / 0 jegyzet; csak középszint; programozásból 5 tétel (nincs keresés/rendezés/összefésülés); SQL 1 feladat; 0 táblázat-, szöveg-, vizuális-, web- és vizsgafeladat; szóbeli vázlatok helykitöltők. (L01-L03, G-03, `content.md`)
- Az SQL ág egyetlen leckéje teljesen ingyenes, a fizetőfal ott semmit nem csinál.
- A főoldal olyat ígér, ami nincs ("mindegyikhez saját tanulási út", "rövid videók"). (L02)
- Az "58 feladat jön össze" a Haladásomon 6 feladat mellett hamis. (L04)
- Hivatalos szerkezet (kontrollálandó): közép 180 perc / 100 pont (szöveg 25, vizuális 20, táblázat 25, adatbázis 15, programozás 15); emelt 240 perc / 120 pont (dokumentum VAGY táblázat 35, adatbázis 35, programozás 50); emelt szóbeli 30 pont. Az emelt adatbázis MariaDB, a platform sqlite-ot használ: dialektus-eltérés kockázat.

### T2. Navigáció és "mi a következő?"
- Belépés mindig `/feladatok`-ra visz, nem oda, ahol voltál. (IA1, L24)
- "Folytatás" localStorage-ból él (eszközönként), új eszközön 3+ kattintás; a kész leckére is mutathat. (IA3, L05)
- A főoldal belépve is vendég hero. (IA2, G-04)
- `/indulas` (onboarding) árva, a beállítások csak a szóbelit érintik; a választás nem érvényesül a tanulási úton, a visszaszámláló nem változik. (IA4, G-04, G-05)
- Menü nem függ a belépési állapottól: "Árak" előfizetőnek is, "Haladásom" vendégnek belépésre dob, kijelentkezés asztalon csak a `/fiok`-ban. (IA6, G-18)
- Két URL egy leckéhez, `/regisztracio` nem `GuestOnly`. (IA7, IA8)
- Hiányzik: keresés (L13, L14, F2), "Beadásaim" lista (F3), vizsgaeredmény-előzmények (F6), morzsamenü a SiteShell oldalain (IA13).
- Szóhasználat: beadás/küldés/ellenőrzés/megoldás, feladatsor/vizsga. (IA11, IA12)

### T3. Munkavédelem: elvesző munka és néma hibák
- **Blokkoló:** a Dropzone `error`-ja a "kész" állapotban nem látszik: hibás fájlcserénél a diák azt hiszi, az új fájl bekerült (vizsgán is). (F01)
- **Blokkoló:** vizsga automatikus beadása hibánál némán megáll 00:00:00-n, nincs újrapróba. (F03)
- **Blokkoló:** két lap esetén a 409 nem látszik, az óra tovább megy. (F02)
- Nincs `beforeunload`/`useBlocker` sehol; a logó vizsgát megerősítés nélkül elhagy. (IA9, F08)
- Vizsga kódrésze új lapon, kontextus nélkül, a pipa nem frissül, a beadás-modal "0 pontot kapsz"-t mond a megoldott feladatra. (F05, IA10)
- Gyakorló táblázat: cellába nem lehet írni, hibás képlet is pontot kap, újratöltés töröl. Web feladat: újratöltés töröl. (F10, F11)
- Feltöltés offline: 0%-on áll, nincs hiba/megszakítás. (F12)
- Szerkesztői űrlapokon nincs nem mentett változás figyelmeztetés (admin). (A-20)
- Szóbeli: `pending` a küldés előtt törlődik, hiba esetén a piszkozat elveszhet. (CH4)
- Vizsga: forrás-zip csak az indító oldalon van, nem a futó vizsgában; mobilon az óra nem sticky, nincs figyelmeztetés 10/5/1 percnél; a lock-üzenet csak Indítás után jelenik meg, "lecke" szóval. (F06, F07, F09, A8)
- Kezi pontozó modal, eredményoldal elavult adata (a mentett 10/10 helyett 9/10 látszik), cache-érvénytelenítési hiányok. (F04, F14, CH5, CH6)

### T4. Üzenetek, magyarítás, márka
- **Minden e-mail "Laravel"-nek szól** (fejléc, aláírás, ©, HTML title): `APP_NAME` hiány, `app:check-config`-ba kell. (G-02, L22, F23)
- Angol/félig angol validációs üzenetek az adminban ("A(z) label megadása kötelező.", "exercise id"). (A-14)
- PHP-ban fixen kódolt magyar/UI szövegek (`'Törölt felhasználó'`, parser-hibaüzenetek, constraint-üzenetek, health check). (K01)
- Rendszerhibánál "HTTP 503" és üres piros mezők a diák előtt. (L07)
- Időtartam nélküli korlát-üzenetek (belépés, fiók, export). (G-08, G-09)
- Egyszerre minden hiba a regisztrációs űrlapon, robotszerű jelszóüzenetek, a "már regisztráltak" felfedi a fiók létét. (G-06, G-07, B13)
- Ismétlődő szövegek: kódszabály kétszer, megerősítő oldal cím = törzs. (L08, G-11, L23)
- 404-es oldal nyers szöveggel, üres fejléccel. (L16, G-10)
- Üres állapotok nem mondják meg, mikor lesz tartalom. (G-03)

### T5. Jogi és adatvédelem (indulás előtt kötelező)
- Az ÁSZF, adatkezelés, impresszum **vázlat**, `[KITÖLTENDŐ]` helykitöltőkkel, és a regisztráció az elfogadásukhoz kötött. A build is figyelmeztet. (G-01, CH11)
- **Kiskorúak.** A platform kamaszoknak szól: nincs életkor / szülői hozzájárulás kezelés (GDPR 16 év alatt Magyarországon a jogász dönti el a pontos küszöböt), a regisztrációnál nincs figyelmeztetés. (F02, G-20)
- Az audit-napló szabad szöveges indoklást őriz örökre, IP és user-agent megőrzési idő nélkül. (B06)
- Jogi verziók kliens-stringek, nincs újraelfogadás. (B14)
- A fiók-törlés listenerei szinkronok: egy hiba után a fiók anonim, de nem takarított. (B05)
- Export mindent memóriába tölt. (F06 backend)

### T6. Backend helyesség és biztonság
- **Megoldott állapot visszaesik:** a fájlbeadás-megőrzés (10/feladat) és a 365 napos job nem tartja meg a sikeres beadást, a "megoldva" és a lecke-haladás a `file_submissions`-ból származik. (B01)
- **Közös számláló a névtelen throttle-oknál:** 11 lecke-teljesítés blokkolja a profil-módosítást; a `/client-errors`, `/health/ready`, `/webhooks/barion` egy vendég-IP számlálón. (B02)
- Nincs limit a regisztráción; belépés/jelszó-visszaállítás csak email+IP szerint (levélbomba, elosztott támadás). (B03, B04)
- Egy `queue:work` szolgál ki mindent (levél, percenkénti vizsgaseprés, számlázás), `retry_after` 90 s a 60 s-os timeout mellett. (B09)
- `trustProxies` hiányzik: proxy/CDN mögött minden vendég egy IP. (S01)
- A `/languages` hibája 1 órára cache-el üreset. (B07)
- Piszkozat ág leckéi elérhetők a feladat/videó/futtatás útvonalakon; a `RunCodeRequest` piszkozat-id-ket szivárogtat. (B10, B11)
- Vendég beadások sosem törlődnek; `running` sor örökre ott maradhat. (B08, B12)
- `app:check-config` nem ellenőriz DB-drivert, cache-t, token lejáratot, Judge0 tokent, `LOG_LEVEL=debug`-ot (a `.env.example` alapja), CORS-t. (S02)
- Frontend CSP csak Report-Only. (S03)
- Admin destruktív/export végpontok limit és jelszó-újramegerősítés nélkül. (S04)
- Kisebbek: dátum időzóna (B15), string `class_exists` kötés (B16), cache-alapú feladott-lista (B17), lecke-törlés TOCTOU (B18), `withoutOverlapping` queue jobon (K06).
- API-konzisztencia: `tasks` vs `exercises`, három lista-forma, nem lapozott listák, verziózás csak `/v1`. (K02)
- Audit hiányok: belépés, sikertelen belépés, jelszó-visszaállítás, kézi pontozás, vizsga-értékelés; jelszócsere értesítő hiányzik. (F03, F04)

### T7. Admin: a tanár nem tud tartalmat építeni
- **Nincs videó- és feliratfeltöltés** (csak egy útvonal-szövegmező). (A-01)
- Típusadatok nyers JSON-ként (web, sheet_browser, doc_browser, sql), fejlesztői hibaüzenetekkel. (A-03, A-04)
- Értékelőlap: szabad szöveges tulajdonság/elvárt, érvénytelen pont is mentődik, 22 típus mindenhol, a "Kipróbálás" nem segít. (A-05, A-06)
- Közzétételi ellenőrzések hiányoznak: üres lecke, nem létező videó, rubrika mintamegoldás nélkül, vizsgarész típus-illesztés, pontösszeg. (A-02, A-07, A-11, A-13)
- Törlések megerősítés nélkül; a modul/lecke törlési szöveg a szerver 409-ével ellentmond, áthelyezés nincs. (A-08, A-09)
- Vizsgarészhez id-t kell gépelni. (A-10)
- Nincs "Megnyitás tanulóként", referencia megoldás futtatás, tartalom-állapot nézet, beadás-nézet, statisztika, duplikálás, import/export, közlemény. (A-15 … A-19, A-29)
- Mobilon a vizsga oldal vízszintesen túlcsordul. (A-25)

### T8. Hozzáférhetőség, mobil, teljesítmény
- Nincs fókusz/görgetés utvonalváltáskor, **egy statikus `<title>` minden oldalon**, nincs skip link. (A1-A3, G-14, L15)
- Modal bezáró gomb, első hibás mező fókusza, 44 px célpontok (lábléc, regisztráció, belépés), Monaco mobilon billentyű-csapda tipp. (A4-A7, G-15)
- Süti-kártya takarja a tartalmat és a mobil tartalmat. (L06, G-13)
- Mobil: a kód-futtatás eredménye a szerkesztő alatt marad; háromsoros morzsa; az útvonal-sáv feliratai összetörnek; a megerősítő sáv nagy. (L09, L10, L18, G-12)
- **Monaco chunk 3,9 MB (1,0 MB gzip)** minden kódfeladatnál; 21 woff2 fájl; a katalógusfa ágankénti kérésekből épül. (P1, P2, P5)

### T9. Hiányzó funkciók, amiket egy tinédzser elvár
- Tipp lépcsők, minta-megoldás magyarázattal beadás után, elvárt/kapott kimenet különbség. (L20, F01 backend)
- Napi cél, sorozat, heti cél követés (a `weekly_hours` már mentve van), emlékeztető e-mail/értesítés. (F5, F01)
- Keresés, "Beadásaim", vizsga-előzmény/trend. (F2, F3, F6)
- Kapcsolat/visszajelzés és "hibás feladat" jelentés; közlemények. (F01 backend, A-29)
- Fiók: adatexport gomb a felületen (a backend tudja), munkamenet-lista, jelszócsere értesítő. (F4, S05, F04)
- Jelszó megjelenítés kapcsoló, erős jelszó tipp, gyakori jelszavak tiltása. (G-07, G-20)
- Sötét téma, Ctrl+Enter futtatás. (F7)

### T10. Kódtisztaság
- Elavult "még nincs a szerveren" ágak és kommentek (404 = "nem elérhető"), 6 extra lekérdezéses admin-áttekintő fallback, localStorage fallbackek bejelentkezett felhasználónak. (CH1-CH3, CH14, CLAUDE.md)
- Halott exportok, eszközök (`topicsQuery`, `InlineCode`, `FUNCTION_NAMES`, `hero.png`, `vite.svg`); ~28 felesleges export; nullable típus-eltérések. (CH7, CH8)
- 300 sornál nagyobb fájlok: TaskSolve 432, AdminExercise 402, AdminExam 358, RubricBuilder 349, AccountProfile 338, formula.ts 321; backend parserek 650-800 sor. (CH9, K03)
- Az `ErrorBoundary` nincs utvonalra kulcsolva. (CH13)

---

## 5. Ajánlott sorrend (fázisok)

A számlázás és a jogi szöveg élesítése a legvégére marad, ahogy kérted. A sorrend indoka: előbb a bizalom (ne vesszen el munka), aztán az első benyomás, aztán a tanár eszközei, és csak utána a tartalom tömeges gyártása (mert az eszköz nélkül nem lehet), végül az elköteleződés.

### Fázis 0a: élesítési kapuk (új; a részletek a `production-readiness.md` 3. fejezetében)
Kiadás-könyvtáras deploy és visszagörgetés (OPS-1, OPS-2, OPS-5, REL-7), vizsgaidei kapacitás és Redis (OPS-4, OPS-9), 5xx riasztás és uptime figyelő (OPS-3, OPS-11, OPS-12), `catalog:verify` (LAUNCH-3), zárt béta regisztrációs kapu (LAUNCH-2), naplók és localStorage adatvédelmi mechanikája (PRIV-5, PRIV-7, PRIV-9), éles füstpróba (REL-15). Ezek nélkül nincs béta.

### Fázis 0: megbízhatóság (kicsi, nagy hatás; 1-2 hét)
Kiegészítések a `production-readiness.md` 4. fejezetében (REL-1 versenyhelyzetek, PRIV-3 teljes törlés, PRIV-4 megőrzés, PRIV-10 hitelesítés).
Mind helyi javítás, a tesztterv P0 eseteivel együtt.
- F01, F02, F03 (Dropzone hiba, 409 kezelés, auto-beadás újrapróba), F08/IA9 (kilépés-figyelmeztetés), F04, F05, CH5/CH6 (cache), CH4 (szóbeli piszkozat).
- F10, F11 (gyakorlók piszkozata, cellaszerkesztés, hibaérték nem kap pontot), F12, F13.
- B01 (megoldott állapot megőrzése), B02 (nevesített limiterek), B03/B04 (regisztráció és belépés limit), B07, B09 (queue), S01 (trustProxies), S02 (check-config bővítés), B10/B11.
- L07 (rendszerhiba üzenet), G-08/G-09 (idővel ellátott limit-üzenetek), `APP_NAME` + marka (G-02).
- Frontend takarítás: CH1-CH3, CH7, CH14.

### Fázis 1: első benyomás és navigáció (1-2 hét)
- IA1-IA4, G-04, G-05, L05, L24: belépés után "Folytasd" (szerver oldali következő lecke vagy feladat), belépett főoldal, onboarding felajánlása és hatása, menü belépési állapot szerint, egy lecke-URL.
- L02/L04: a főoldal és a Haladásom ne ígérjen, ami nincs (a valós adatból dolgozzon).
- A1-A3, G-14, L15: oldalcímek, skip link, fókusz.
- L06, G-13: süti-sáv alul. L09, L10, L18: mobil munkaterület. G-06, G-07, G-15: regisztrációs űrlap, 44 px.
- Szóhasználat egységesítése (IA11, IA12).
- P1, P2: Monaco és betűtípusok csökkentése.

### Fázis 2: a tanár eszközei (2-3 hét)
Ennek előbb kell lennie, mint a tömeges tartalomnak.
- **A-01 videó- és feliratfeltöltés** (új backend végpont a meglévő `lesson_videos` lemezre és a frontend).
- A-15 "Megnyitás tanulóként", A-16 "Futtatás mintamegoldással", A-17/A-18 tartalom-állapot és beadás-nézet, A-19 duplikálás, A-08/A-09 megerősítések és valós törlés-szöveg.
- A-02/A-07/A-11/A-13 közzétételi ellenőrzések, A-03-A-06 típusadat-űrlapok és értékelőlap-segítség, A-14 magyarítás, A-10 feladatválasztó, A-20 mentetlen-figyelmeztetés.
- Backend: B06 (audit tartalom), B14 (jogi verziók), F03 (audit események).

### Fázis 3: tartalom (a legnagyobb munka; 8-10 hét részmunkaidőben)
Lásd `content.md`. Javaslat sorrendben:
1. A 6 meglévő feladat kiegészítése magyarázattal, megoldás-lépésekkel, 2-3 tipp. Több SQL lecke, hogy a fizetőfal értelmet kapjon.
2. MVP ~100-150 feladat: programozás ~50, SQL ~40, táblázat ~12, szövegszerkesztés ~8, vizuális ~6, web ~6; 4 közép + 3 emelt mintavizsga.
3. Szóbeli: valódi vázlatok és 20+ B) feladat.
4. Jogi/szerzői kérdés: az OH feladatsorok újrahasználata előtt tisztázni, vagy "stílusában" újraalkotni.
5. Ellenőrizendő: az emelt SQL (MariaDB) és a fájl-bemenetes emelt programozás a valódi Judge0-n (stdin? `additional_files`?).

### Fázis 4: elköteleződés (3-4 hét)
- Tipp lépcsők és megoldás-felfedés, napi cél és sorozat, heti cél, "gyenge pontjaid" (témacímke kell a feladatokra), emlékeztető e-mail, keresés, "Beadásaim", vizsga-trend, kapcsolat/hibajelentés, fiók export gomb és munkamenet-lista.

### Fázis 5: indulás (a számlázás itt jön)
- `go-live.md` operációs lista, jogi szövegek és kiskorúak kezelése (jogász), Barion és Számlázz.hu, MySQL-futtatás a CI-ben, terhelés- és biztonsági próba, a tesztterv P0-P1 esetei, valódi Judge0 próba, hibakövetés és riasztás, mentés-visszaállítási próba.

---

## 6. Követőlista

Pipáld ki, ha kész. A tételek mind a nyers jelentésekben vannak részletezve.

**Fázis 0a:** lásd a `production-readiness.md` 10. fejezetének követőlistáját (OPS-1/2/3/4/5/9/11/12, LAUNCH-2/3, PRIV-5/7/9, REL-15).

**Fázis 0**
- [ ] F01 Dropzone hiba a kész állapotban
- [ ] F02 409 kezelés, fókuszra újratöltés a vizsgán
- [ ] F03 auto-beadás újrapróba és látható sáv
- [ ] F08/IA9 kilépés-figyelmeztetés (vizsga, feltöltés, szerkesztő)
- [ ] F04, F05, CH5, CH6 elavult adat és cache
- [ ] CH4 szóbeli piszkozat
- [ ] F10, F11 gyakorlók és web feladat piszkozat, cellaszerkesztés
- [ ] F12, F13 offline és méret hiba
- [ ] B01 megoldott állapot megőrzése
- [ ] B02 nevesített limiterek
- [ ] B03, B04 regisztráció és belépés limit
- [ ] B07 languages cache
- [ ] B09 queue worker szétválasztás és timeout
- [ ] S01 trustProxies
- [ ] S02 check-config bővítése (APP_NAME, LOG_LEVEL, DB, cache, token lejárat)
- [ ] B10, B11 piszkozat ág és id szivárgás
- [ ] L07, G-08, G-09 üzenetek
- [ ] G-02 e-mail márka
- [ ] CH1-CH3, CH7, CH14 frontend takarítás

**Fázis 1**
- [ ] IA1-IA4, G-04, G-05 belépés, főoldal, onboarding
- [ ] L05, L24 Folytatás
- [ ] L02, L04 ne ígérjen, ami nincs
- [ ] A1-A3, G-14, L15 címek, skip link, fókusz
- [ ] L06, G-13 süti-sáv
- [ ] L09, L10, L18, G-12, G-15 mobil
- [ ] G-06, G-07 regisztrációs űrlap
- [ ] IA6, IA7, IA8, IA11, IA12 menü, URL, szóhasználat
- [ ] P1, P2 teljesítmény

**Fázis 2**
- [ ] A-01 videó és felirat feltöltés
- [ ] A-15, A-16, A-17, A-18, A-19 admin eszközök
- [ ] A-02, A-07, A-11, A-13 közzétételi ellenőrzések
- [ ] A-03-A-06 típusadat űrlap, értékelőlap segítség
- [ ] A-08, A-09, A-10, A-14, A-20

**Fázis 3**
- [ ] meglévő 6 feladat bővítése
- [ ] MVP tartalom (~100-150 feladat)
- [ ] mintavizsgák
- [ ] szóbeli vázlatok

**Fázis 4**
- [ ] tippek, megoldás-felfedés
- [ ] napi/heti cél, sorozat, emlékeztető
- [ ] keresés, Beadásaim, vizsga-trend
- [ ] kapcsolat és hibajelentés

**Fázis 5**
- [ ] jogi szövegek, kiskorúak
- [ ] Barion, Számlázz.hu
- [ ] MySQL a CI-ben
- [ ] valódi Judge0 próba
- [ ] terhelés- és biztonsági teszt
- [ ] go-live lista

---

## 7. Döntések, amelyek rád várnak

1. **Kiskorúak:** meddig kell szülői hozzájárulás? (Jogász.) Befolyásolja a regisztrációt, az adatkezelést és a ÁSZF-et.
2. **Tartalom forrása:** saját feladatok, vagy az OH hivatalos feladatsorainak átdolgozása (szerzői jog)?
3. **Hol legyen a határ az ingyenes és fizetős között**, ha a tartalom megszületik? Ma 2 ingyenes lecke ágonként; az SQL ág egyetlen leckéje teljesen ingyenes.
4. **Kézi pontozás önértékelése** (B19): beszámítson a sikerbe, vagy külön "önértékelt" állapot legyen?
5. **Két URL egy leckéhez:** melyik legyen a kanonikus (`/tanulasi-ut/:sav/:lecke` ajánlott)?
6. **Hány szint legyen az alapértelmezett a vizsgán**: gyakorló mód legyen az alapértelmezés (F18)?
7. **Az `integration-fixes`, `wp*` és `worktree-agent-*` ágak és munkafák** törlése (mind merge-elt): engedélyed kell.
8. **Merge a `main`-be és push** (deployt indít): a harness leállított, kéri a kifejezett jóváhagyásodat vagy egy Bash engedély-szabályt.

---

## 8. A felülvizsgálati környezet újraindítása

A jelentések alapjául szolgáló környezet a scratchpadben van (nem tartós): `scratchpad/review/start.sh`. Lényege: az `A` backend `migrate:fresh --seed` a `database/review-a.sqlite`-ra (8000), a `B` backend a `test:prepare-api-fixtures` fixture-ökkel (8001), Judge0-mock a 2358-on, két Vite dev szerver (5173 → A, 5174 → B), `PHPRC` egy `zip` és `intl` bővítménnyel bekapcsolt `php.ini`-re. Az ügynökök által a B környezetben létrehozott `ADM-*` és `filex1` adatok eldobhatók (a `testing.sqlite` újragenerálódik).
