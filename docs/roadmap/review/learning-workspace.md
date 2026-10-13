# Tanulas es kodfuttatas bongeszos vegigkattintas (ugynok jelentes, tomoritve)

3 blokkolo, 8 fontos, 11 kellemetlen, 3 otlet. Katalogus (env A): 2 sav, 3 modul, 6 lecke (3 ingyenes), 6 feladat (5 Python/C#, 1 SQL), 0 video, 0 jegyzet, csak kozepszint. Konzolhiba nincs. Kepek: scratchpad/review/learn/.

Blokkolo (tartalmi)
- L01 | minden lecke: "Ehhez a leckehez meg nem keszult video es jegyzet"; a lecke = 1 feladat, tanulnivalo nincs
- L02 | a fooldal 6 savot igér (Tablazat, Szoveg, Grafika, Weboldal...) "mindegyikhez sajat tanulasi ut", de csak 2 van; "rovid videok" sincs
- L03 | az erettsegi 5 gyakorlati reszebol 2 sav; programozasbol 5 tetel (nincs kereses/rendezes/osszefesules), nincs emelt

Fontos
- L05 | Haladasom "Folytatas" gomb es "Itt tartottal" a mar TELJESITETT leckere mutat; L04: "Heti 2 feladattal 58 feladat jon ossze" - 6 feladat van
- L06 | suti-kartya a tartalom fole uszik (mobilon kozepen takar), warning ikonnal | also sav, info-ikon
- L07 | rendszerhibanal "Rendszerhiba ... (HTTP 503)" + ures Bemenet/Elvart/Te kimeneted mezok pirosan | racsot elrejteni, "Nem a te hibad, probald ujra 1 perc mulva"
- L09 | feladat mobilon: Feladat/Kod ful; futtatas utan az eredmeny a szerkeszto alatt, nem ugrik oda | auto-gorgetes vagy sticky gombok
- L11 | vendeg Futtatas/Beadas: nem neztem vegig a vendeg Beadast (10/perc limit); ellenorizendo, hogy vilagos "Lepj be" uzenet jon-e

Kellemetlen
- L08 | szabalysertes: "Ennel a feladatnal ciklust kell hasznalnod." ketszer
- L10 | feladat fejlec mobilon: 3 soros morzsa + kulon "Belepes"; vendegnek nincs jelezve, hogy a haladas nem mentodik
- L12 | /haladas "Folyamatban levo lecke" szamlalo 0 maradt, mikozben a megprobalt leckén "Folyamatban" cimke van (nem ellenorzott ujra)
- L13 | /feladatok: nincs kereses, nyelv (Python/C#/SQL) es nehezseg szuro; szint+tema+allapot van
- L14 | sehol nincs kereses (Ctrl+K otlet)
- L15 | a legtobb oldal <title>-je azonos
- L16 | /feladatok/9999: "A keresett eroforras nem talalhato" + ures fejlec (nincs menu)
- L17 | /beadasok/:id kod-beadasra 404 (a frontend /file-submissions/:id-t kér); a dashboard "Legutobbi beadasok" sor nem kattinthato
- L18 | mobil /tanulasi-ut: "Hol vannak a pontok?" sav feliratai osszetorodnek ("Adatba zis-kezeles") | mobilon lista
- L22 | megerosito e-mail: "Laravel: ...", "(c) 2026 Laravel", "Udvozlettel: Laravel" (APP_NAME hiany) | APP_NAME=InfoTanar, app:check-config-ba
- L23 | /email-megerosites siker: cim es szoveg ugyanaz ketszer
- L24 | belepes utan mindig /feladatok, nem oda, ahol voltal

Otlet
- L19 | elmelet-leckehez nincs "Kesz, tovabb" gomb a UI-ban (POST /lessons/{id}/complete); most nincs elmelet
- L20 | nincs tipp, mintamegoldas beadas utan, diff az elvart/kapott kimenetre
- L21 | "Kiindulo kod visszaallitasa" megerositese nem tesztelt

Jol mukodik: zarolt lecke uzenetek mindharom allapotban vilagosak; 429 uzenet ("Ujra probalhatod 13 masodperc mulva", gombok letiltva, 20 futtatas/perc); siker-ag (env B): "Lecke teljesitve" + "Kovetkezo lecke", rejtett tesztek csak talalat-jelolessel; dashboard: erettsegi visszaszamlalo (209 nap), savonkenti haladas; kodszabaly elore jelezve, vazlat bongeszoben mentodik; SQL feladat: sema a leirasban.
Nem megitelheto: hosszu kimenet, idotullepes (mock), valodi telefon-billentyuzet, siker-ag env A-ban (mock echo), fizetes.
