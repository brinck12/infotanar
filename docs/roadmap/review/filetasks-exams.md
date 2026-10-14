# Fajlfeladat, vizsga, gyakorlo es szobeli bongeszos vegigkattintas (ugynok jelentes, tomoritve)

3 blokkolo, 9 fontos, 8 kellemetlen, 3 otlet. Nem tesztelt: doc_practice (nincs seedelt feladat), valodi 30 perces lejarat (csak ora-elorecsavarassal), szobeli idozito lejarat, melyebb billentyuzet-fokusz.
Megjegyzes: a Playwright chromium-1223 hianyzik; a headless_shell 1248-at kell executablePath-szal hasznalni. A seedelt diak nem premium, a vizsgak zarolva vannak neki.

Blokkolo
- F01 | shared/ui/Dropzone.tsx (kesz allapot), fajlfeladat es vizsgafuto | az `error` csak az ures allapotban rajzolodik. Sikeres feltoltes utan egy hibas fajl (.xlsm, rossz tipus, 409) cserejekor semmi nem latszik, a regi fajlnev "Feltoltve" marad, a diak azt hiszi, az uj bekerult | hiba a kesz agban is: "az uj fajl NEM kerult be"
- F03 | ExamRunner automatikus beadas | lejaratkor az auto-beadas egyszer indul; ha a kerese elbukik, az idozito 00:00:00-n marad pirosan, nincs uzenet, ujraproba vagy modal | ujraproba backoff-fal, lathato sav es Beadas gomb
- F02 | ExamRunner, ket lap | a 2. lapon beadva az 1. lapon a feltoltes 409, de semmi nem latszik (F01); a diak a futo nezeten marad, az ora megy | 409-nel atiranyitas az eredmenyre ("mar beadtad / lejart"); fokuszra ujratoltes

Fontos
- F04 | FileTaskWorkspace: latest = upload.data ?? attempts.data[0] | kezi pontok mentese utan a szerveren 10/10, a kepernyon marad "9 / 10" es "1 pont kezi ellenorzesre var" ujratoltesig | latest a cache-bol, vagy upload.reset()
- F05 | vizsgafuto es kodresz | a szerkesztoben beadva a resz nem kap pipat, a beadas modal "1 resz ures, 0 pontot kapsz" annak ellenere hogy megoldotta; a szerkeszto uj lapon nyilik kontextus nelkul | fokuszra ujratoltes, idozito/sav a szerkesztoben vizsga kozben, "Vissza a vizsgahoz"
- F06 | vizsgafuto | forrasok.zip csak a Start oldalon, a futo vizsgan nincs | zip chip az oldalsavban
- F07 | mobil futo | a fejlec az idozitovel nem sticky; nincs figyelmeztetes 10/5/1 percnel | sticky fejlec, szinvaltas + aria-live 5 perc alatt
- F08 | vizsga indulas/kilepes | nincs beforeunload/kilepes-figyelmeztetes, a logo megerosites nelkul kivisz; az Inditas csendben visszaadja a futo kiserletet a valasztott modot figyelmen kivul hagyva | "Fut egy probalkozasod" sav + mod-eltérés jelzes (ujratoltes kozben az ora es feltoltesek megmaradnak: jo)
- F09 | ExamStart nem premium diaknak | a zar csak Inditas utan jelenik meg, "Ez a lecke az elofizetes resze" szoveggel egy vizsgarol | zar betolteskor, vizsga-szoveggel
- F10 | gyakorlo tablazat /feladatok/9 | cellara kattintva nem lehet irni, csak a kepletsav mukodik; #NEV? (SUM) es #ERTEK! (vesszo) magyarazat nelkul; hibas keplet is 1/1 pont; ujratoltes torli a munkat | kozvetlen cellaszerkesztes, magyar fuggvenynev/pontosvesszo tipp, hibaertek ne kapjon pontot, localStorage piszkozat
- F11 | web feladat /feladatok/7 | ujratoltes elveszti a kodot; mobilon az eredmeny a szerkeszto folott, a gombnal nincs visszajelzes | piszkozat, visszajelzes a gombnal
- F12 | feltoltes offline | "Feltoltes es ellenorzes... 0%" 20+ mp-ig hiba es megszakitas nelkul | halozati hiba korai felismerese, "Nincs internet" + Ujra/Megse
- F13 | feltoltesi hibak | tul nagy (3 MB hamis xlsx) fajl "tartalma nem felel meg"-et kap, nem "tul nagy"-ot; a tobbi hibaszoveg (makro, rossz tipus, serult) tiszta | merettel kezdeni
- F14 | kezi pontozo modal | a mintakep teljes szelesseg es magas, a Megvan/Nincs meg gombok es Mentes gorgetessel erhetok el | max-height, nagyitas, sticky gombok

Kellemetlen
- F15 | eredmeny | nincs "megoldva/nem" mondat (80% kuszob), nincs "ezt javitsd eloszor" osszegzes (jo: csoportsavok, "Amit talaltunk", elozo kiserlet, tipp tetelenkent)
- F16 | fajlfeladat oldal | az ures dropzone villan toltes kozben; mobilon a feltoltes a hosszu leiras es nagy minta alatt, eredmenyre nincs auto-gorgetes | skeleton, scrollIntoView
- F17 | vizsga eredmeny | nem mondja, hogy lejart-e az ido; nincs mod/eltelt ido; a kezi pont sav "grafikai es animacios elemeknel" akkor is, ha tablazat | altalanositas, fejlec sor
- F18 | vizsga indulas | alapertelmezett mod az idozitett, a checklist opcionalis | alapertelmezett gyakorlo vagy megerosites
- F19 | futo | "tolthetsz fel uj verziot" sav a kodreszen is | reszenkenti szoveg
- F20 | /beadasok/:id vizsgaeredmenybol | "Javitott fajl feltoltese" a szabad feladatra visz, nem a lezart vizsgara | "Vissza az eredmenyhez"
- F21 | szobeli | felkeszules 30 perc minden szinten, a bevezeto emelthez kotne; kozepszinten ellenorizni; az idozito ujratoltesre nullazodik | szintfuggo idok
- F22 | gyakorlo feladatok | erintetlen feladat piros X-szel (0/1 pont) indul; a suti sav takarja az aljat | semleges kezdoallapot
- F23 otlet | levelek | "Laravel" marka (APP_NAME)
- F24 otlet | szobeli lista jo ("Meg nem gyakoroltad/Egyszer gyakoroltad", jegyzetek es pipak megmaradnak)
- F25 otlet | vizsgalista jo "Folytatas" gombbal; hianyzik a hatralevo ido es a mod a kartyan

Jol mukodik: fajlvalidacios uzenetek (makro, rejtett makro, rossz kiterjesztes, serult), failed-allapot sav, rubrika csoportok, elozo kiserlet pontszama, kezi pontok mentese (szerver oldalon), ujratoltes vizsga kozben, lejart vizsga egybol az eredmenyre, beadas modal a fajlok listajaval, dupla Inditas ugyanazt a kiserletet adja.
