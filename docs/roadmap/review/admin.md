# Admin bongeszos vegigkattintas (ugynok jelentes, tomoritve)

31 talalat: 1 blokkolo, 17 fontos, 9 kellemetlen, 4 otlet. Szamlazas/szamla oldal kihagyva. Az ugynok ADM- adatot hagyott env B-ben (track 2, modul 3, lecke 10, feladatok 10-17, vizsga 4).

- A-01 blokkolo | lecke | nincs video/felirat feltoltes az adminban, csak "Video eleresi utja" szovegmezo, nincs feltoltesi vegpont | video+felirat feltoltes
- A-02 fontos | lecke kozzetetel | ures tananyaggal es nem letezo videoutvonallal is kozzetehet | ellenorzes kozzeteteskor
- A-03 fontos | tipus-adatok JSON | nyers JSON a web, sheet_browser, doc_browser, sql tipusnal | urlap vagy sema-sugo, elo validalas
- A-04 fontos | JSON hibak fejlesztoi nyelven ("Ismeretlen mezo: value. A kivalasztott spec.checks.0.type ervenytelen.") | magyar uzenet, lehetseges ertekekkel
- A-05 fontos | ertekelolap | szabad szoveges tulajdonsag/elvart ertek, ertelmetlen pont ("bold: igen") is mentodik, a Kiprobalas csak "nem tudjuk ellenorizni" | tipusonkenti lista, validalas, sugo
- A-06 fontos | ertekelolap | tablazatos feladatnal is mind a 22 tipus | szures feladattipus szerint
- A-07 fontos | feladat kozzetetel | feltoltos feladat hibas rubrikaval, mintamegoldas nelkul is kozzetehet (csak a vizsga ellenoriz) | kozos kozzetehetoseg-ellenorzes
- A-08 fontos | torlesek | rubrikapont, csatolmany, vizsgareszt, vizsgafajl torlese megerosites nelkul | megerosites/visszavonas
- A-09 fontos | modul/lecke/ag torlese | a modal azt mondja, minden alatta torlodik, a szerver 409-et ad; athelyezes nincs | valos szoveg, darabszam, athelyezes
- A-10 fontos | vizsgaresz | a feladat azonositojat szamkent kell begepelni, az admin sehol nem mutatja az id-ket | feladatvalaszto kereesovel
- A-11 fontos | vizsgaresz | "Szovegszerkesztes" reszhez tablazatos feladatot is elfogad | tipusillesztes
- A-12 fontos | "Uj vizsga" | kattintasra azonnal nevtelen piszkozatot hoz letre | elobb nev
- A-13 fontos | vizsga | az osszpontszam (100) es a reszek osszege (25) nincs osszevetve | osszegzo sor, figyelmeztetes
- A-14 fontos | maygarositas | angol/felig angol uzenetek: "A(z) label megadasa kotelezo.", "A kivalasztott exercise id nem letezik.", "The URL-azonosito field must only contain letters, numbers, dashes..." | lang/hu/validation.php attributes
- A-15 fontos | nincs "Megnyitas tanuloként" elonezet sehol | gomb leckén, feladaton, vizsgan
- A-16 fontos | kodos feladat | nincs referencia megoldas, a tesztesetek nem probalhatok | "Futtatas mintamegoldassal"
- A-17 fontos | katalogus | nincs fa-nezet, szures (piszkozat/hianyos), kereses; az attekintes csak az agakat szamolja | tartalom-allapot tablazat
- A-18 fontos | beadasok | nincs beadas-nezet, feladatonkenti statisztika, kezi pontozo nezet az adminban | lista, statisztika
- A-19 fontos | nincs duplikalas, import/export | duplikalas gomb, JSON import/export
- A-20 kell. | feladat urlap | nincs nem mentett valtozas figyelmeztetes vagy automentes; Tesztesetek/Ertekelolap azonnal ment, a tobbi Mentes gombbal | beforeunload/useBlocker
- A-21 kell. | "0 teszteset" cimke feltoltos es web tipusnal is | tipus-jelveny
- A-22 kell. | futtatasi korlat ms es KB | mp es MB
- A-23 kell. | kozzetetel kapcsolo | "Piszkozat" jelveny a mentesig marad; hibauzenet az oldal alján | hiba a kapcsolo alatt
- A-24 kell. | Szabalyok ful | csak Python tiltasok, C#-ra nincs, magyarazat nincs | nyelvenkent lista
- A-25 kell. | mobil 390 px | vizsga oldalon vizszintes tulcsordulas (604 px) | reszponziv tablazat
- A-26 kell. | felhasznalo | nincs fiok torles/adatexport gomb, pedig a backend tudja | gomb megerositessel
- A-27 kell. | vizsga | atnevezes utan a fejlec a regi, a cim mindig "Gyakorlo vizsga szerkesztese"
- A-28 otlet | felhasznalok | jo: kotelezo indoklas, megerositesek; hianyzik tomeges muvelet, CSV export, utolso belepes
- A-29 otlet | nincs kozlemeny a diakoknak, nincs hibabejelentes feladatonkent
- A-30 otlet | rendezes csak fel/le gomb | athelyezes ide / drag and drop
- A-31 otlet | jo: Markdown elonezet, "Kiprobalas mintamegoldassal", magyar kozzetetel uzenetek a vizsgan
