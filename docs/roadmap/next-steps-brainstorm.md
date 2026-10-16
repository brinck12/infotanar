# Következő lépések: ötletek (2026-10-16)

Saját használatra. A `production-readiness.md` a kötelező munkát listázza, ez a **mi növeli az esélyt, hogy a termékből bevétel legyen**.

## Kiinduló helyzet

- A platform technikailag jórészt kész: futtatás, értékelés, vizsgák, fájlfeladatok, hozzáférés-kezelés, számlázás (halasztva).
- A katalógus **üres**: a `CatalogSeeder` 5 mintafeladatot tartalmaz. A termék értéke a tartalom és a bizalom, nem a kód.
- Egyetlen felhasználó sincs, és nincs bizonyíték arra, hogy fizetnének érte.

## 1. Tartalom (a legnagyobb rés)

Amit Claude meg tud írni: leckeszöveg, magyarázó példák, feladatleírások, tesztesetek (látható és rejtett), mintamegoldások, tippek, kvíz, vizsgasor-vázlat, videóforgatókönyv, szóbeli tételvázlat.

Amit **nem** lehet Claude-ra bízni:
- **Szakmai helyesség a hivatalos követelményhez képest.** A digitális kultúra érettségi (2024-től új rendszer) követelményeit, témaköreit és a feladattípusokat az Oktatási Hivatal közlése határozza meg. Claude tudása ezekről hiányos lehet; a katalógus gerincét (témakörök, szintek, pontozás) az OH vizsgaleírásából és a közölt mintafeladatokból kell felépíteni, és egy érettségiztető tanárnak át kell néznie.
- **A videók**: nem készíthetők így; a forgatókönyv és a diák-szöveg igen. Az első indulás videó nélkül, szöveges leckékkel is lehetséges.
- **Valódi vizsgafeladatok másolása**: a hivatalos feladatsorok szerzői jogilag nem szabadon újrahasznosíthatók; saját, hasonló nehézségű feladatok kellenek.

Javasolt folyamat:
1. Témakör-térkép az OH követelményből (te + tanár).
2. Claude kitölti a `LAUNCH-4` Markdown/YAML formátumot: leckénként szöveg, feladatonként leírás, korlátok, tesztek, mintamegoldás, tipp.
3. `catalog:import --dry-run`, majd `catalog:verify` valódi Judge0-n: a mintamegoldás minden teszten átmegy, a hibás megoldás elbukik. Ez kiszűri a legtöbb tévedésemet.
4. Tanári átolvasás, majd közzététel.
5. Cél a béta elejére: egy ág, kb. 15–25 lecke, 40–60 feladat. Nem a teljes tananyag.

Előfeltétel: `LAUNCH-4` (import/export), különben mindent adminűrlapon kell begépelni.

## 2. Mit építsünk még (kód)

Nagy hatás, kis/közepes munka:
- **LAUNCH-4 tartalom-import**: a tartalom gitben él, átnézhető, verifikálható. Ez a leghasznosabb következő kódmunka.
- **Haladás és ismétlés**: gyenge témakörök ajánlása a hibás beadásokból ("ezt gyakorold még"), napi 10 perces ismétlő sor. Kevés kód, sok megtartás.
- **Vizsgaszimulátor**: az `exams` modul megvan; kell néhány teljes, időzített mintasor és egy eredmény-összegző ("ennyi pontod lenne").
- **Tanári nézet (LAUNCH-8)**: osztálykód, haladás-tábla. Az osztály-alapú értékesítés (iskola/tanár fizet) sokkal valószínűbb bevétel, mint az egyéni diákok előfizetése, mert a tanár a döntéshozó.
- **Mobilra telepíthetőség és gyors betöltés (LAUNCH-10/11)**: a célközönség telefonon tanul.
- **Analitika (LAUNCH-7)**: öt tölcsér-lépés, hogy az indulás után tényleg lásd, hol esnek ki.

Később: AI-alapú magyarázat a hibás megoldáshoz (költség és adatvédelem: kiskorúak, új adatfeldolgozó, előbb jogász), szülői nézet, ajánló link.

## 3. Lesz-e belőle pénz? Őszintén

Mellette szól:
- Valódi, ismétlődő igény: minden évben van érettségiző korosztály, az informatika/digitális kultúra az egyik tárgy, ahol a gyakorlati feladatokhoz gyakorlás kell.
- Az automatikus értékelés (kód, SQL, táblázat, dokumentum) költséghatékony, és a legtöbb ingyenes anyag nem ad azonnali visszajelzést.
- Alacsony üzemeltetési költség (egy szerver, Judge0).

Ellene szól / kockázat:
- **Kicsi, szezonális piac**: a tanulók többsége márciusban–májusban és szeptemberben–októberben aktív, a nyár és a tél gyenge.
- **Az ingyenes alternatívák** (iskolai anyagok, YouTube, tanári oldalak) erősek; fizetni csak akkor fognak, ha a te anyagod jobban megfelel a tényleges vizsgának.
- **Kiskorúak**: szülői hozzájárulás, adatvédelem, ÁSZF: jogi költség és késleltetés (PRIV-1, PRIV-2).
- **Nincs bizonyíték** fizetési hajlandóságra. Ezt nem a kód, hanem a béta mutatja meg.

Mit érdemes mérni a zárt bétában (osztályonként 1–2 tanárral):
1. Hányan regisztrálnak és térnek vissza a 2. napon.
2. Hányan oldanak meg ≥ 5 feladatot.
3. Mit mondanak a tanárok: használnák-e az óráikon, fizetne-e az iskola.
4. Fizetnének-e a diákok/szülők (egyszerű teszt: "előfizetés" gomb fizetés nélkül, csak az érdeklődést számolva).

Reális modellek (a jelenlegi kód a havi előfizetést támogatja, Barion + Számlázz.hu):
- **Egyéni diák**: havi/szezonális előfizetés (szezonális csomag: pl. "érettségiig" egy összegben, ez egyszerűbb, mint a havi megújítás).
- **Iskolai/tanári licenc** (LAUNCH-8 után): osztályonkénti vagy iskolai éves díj számlára. Kisebb darabszám, de nagyobb tétel és kisebb lemorzsolódás.
- Ingyenes réteg (az első 2 lecke ágonként) marad a kipróbáláshoz.

Árazásra ne adjak számot: ehhez piaci adat kell (versenytársak, a célcsoport fizetőképessége), amit most nem ellenőriztem.

## 4. Javasolt sorrend

1. Push előtti lista (`docs/runbooks/pre-push-checklist.md`) szerver oldalon, push.
2. `LAUNCH-4` import/export csővezeték (kód).
3. Témakör-térkép az OH követelményből + az első ág kitöltése (Claude ír, `catalog:verify` ellenőriz, tanár átnéz).
4. Zárt béta 1–2 osztállyal, analitika bekapcsolva.
5. A béta adataiból döntés: tanári licenc (LAUNCH-8) vagy egyéni előfizetés, és csak ezután a számlázás élesítése (REL-2 stubok, Barion/Számlázz próba).
6. Jogi háttér (PRIV-1/2) a nyilvános nyitás előtt.
