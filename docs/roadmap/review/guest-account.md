# Vendeg es fiok bongeszos vegigkattintas (ugynok jelentes, tomoritve)

1 blokkolo, 5 fontos, 12 kellemetlen, 3 otlet. Az e-mail csere linkjet nem vitte vegig (429, lasd G-08). Szamlazas kihagyva.

- G-01 blokkolo (inditas elott) | /aszf /adatkezeles /impresszum | mindharom "vazlat", tele [KITOLTENDO] helyorzovel (cegnev, adoszam, e-mail, megorzesi ido); a regisztracio az elfogadasukhoz kotott | kitolteni
- G-02 fontos | e-mailek (megerosites, jelszo-visszaallitas) | fejlec "Laravel: http://localhost:5173", alairas "Udvozlettel: Laravel", "(c) 2026 Laravel", HTML title "Laravel"; a tárgyak magyarok | marka, alairas, lablec InfoTanar
- G-03 fontos | lecke oldal, /vizsgak | ingyenes leckén sincs video/jegyzet; a /vizsgak ures ("Ezen a szinten meg nincs feladatsor") | tartalom az ingyenes leckekbe; ures allapot mondja meg, mikor lesz
- G-04 fontos | elso 60 masodperc | regisztracio utan "Nezd meg a leveleidet", majd "Tovabb a tanulasi utra"; a /indulas sosem jelenik meg; a belepett fooldal vendeg-marketinget mutat | onboarding felajanlasa; belepett fooldal = "Folytasd"
- G-05 fontos | /indulas | Emelt, 2028, C# kivalasztasa utan "Kesz, kezdjuk" /tanulasi-utra visz, ahol meg Kozepszint van; a "Meg 209 nap" nem valtozik; nincs mentes-visszajelzes | a valasztasok ervenyesitese es visszajelzes
- G-06 fontos | /regisztracio | ures urlapon csak az ASZF-hiba latszik; a tobbi hiba csak a pipa utan | minden hiba egyszerre
- G-07 kell. | regisztracio szerver hibak | "A(z) jelszo tartalmazzon legalabb egy szamot/betut." robotszeru; "Ezzel az e-mail-cimmel mar regisztraltak." felfedi a fiok letezeset; a password1 elfogadott | "A jelszo ..."; belepes/jelszo-visszaallitas link; gyakori jelszavak tiltasa
- G-08 fontos | /fiok | 3 hibas jelszocsere + 1 e-mail kerelem utan az e-mail csere es az adatexport is 429-et kap, csak "Tul sok probalkozas, probald ujra kesobb." | idotartam megadasa; az export ne ossza a jelszo-ellenorzes limiterjet
- G-09 kell. | /bejelentkezes | a 6. hibas probalkozas ugyanazt az idotartam nelkuli zarolasi uzenetet adja | "Probald ujra 1 perc mulva."
- G-10 kell. | /email-megerosites parameterek nelkul | /auth/verify-email// 404, nyers "A keresett eroforras nem talalhato." | kliens oldali kezeles
- G-11 kell. | megerosites siker oldal | cim es torzs ugyanaz | torzsben kovetkezo lepes
- G-12 kell. | megerosito sav mobilon | nagy sav minden oldalon; "Uj level kuldese" utan a gomb eltunik | kisebb, ujrakuldes maradjon
- G-13 kell. | suti-ertesites | lebego doboz takarja a tartalmat/lablec linkeket, nincs "tovabbi info" | also sav, link az /adatkezelesre
- G-14 kell. | minden oldal | azonos tab cim; nincs skip link | oldalankenti cim, skip link
- G-15 kell. | mobil /regisztracio /bejelentkezes | 44 px alatti celpontok: checkbox 22x22, "Belepes" 53x24, "Elfelejtetted?" 91x24, "Regisztralj" 70x24, "Mennyibe kerul?" 119x30, jogi linkek ~25 px | padding
- G-16 kell. | fiok torles | ures jelszora nincs visszajelzes; torles utan a fooldalon nincs "Fiokod torolve" | hibauzenet es megerosites
- G-17 kell. | munkamenet lejarat | ervenytelen token a /haladas-on a /bejelentkezes-re dob "A munkameneted lejart" sav nelkul | lejart jelzo inditasi 401-nel is
- G-18 kell. | desktop fejlec | kijelentkezes csak a /fiok-on belul; a felhasznalonev csak link | felhasznaloi menu: Fiokom, Kilepes
- G-19 otlet | /fiok | sikeres toastok az oldal aljan | inline siker a kartyaban
- G-20 otlet | /regisztracio | nincs jelszo megjelenites kapcsolo, eros-jelszo tipp; 16 ev alatti figyelmeztetes sincs, pedig az adatkezelesi szoveg emliti a kiskoruakat
- G-21 otlet | /arak | tiszta (ingyenes vs Premium tabla, 2 990 Ft/ho, GYIK, Barion); a pipa/kotojel cellak ures szovegnek hatnak | kepernyoolvaso szoveg
- G-22 mukodik | regisztracio, dupla kattintas (egy fiok), e-mail megerosites (hamisitott/ujrahasznalt link), elfelejtett/uj jelszo (semleges valasz, egyszer hasznalhato, lejart link), 404, mobil menu, nev- es jelszocsere, JSON export, fiok torles jelszo-megerositessel, 401 kezeles, magyar ekezetek, nincs konzolhiba
