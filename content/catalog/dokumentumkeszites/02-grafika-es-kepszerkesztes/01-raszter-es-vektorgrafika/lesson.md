---
slug: raszter-es-vektorgrafika
title: Raszter- és vektorgrafika
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Két külön világ

Egy kép a számítógépen kétféleképpen tárolható. Az egyik a **rasztergrafika**: a kép apró, színes négyzetek (képpontok, pixelek) rácsa, ahogy egy kockás papíron kiszínezett ábra. A másik a **vektorgrafika**: a kép nem pontokból áll, hanem leírásból, például "rajzolj egy kört a (100, 80) pontba, 50 egység sugárral, kék kitöltéssel".

Az érettségi követelménye szerint ismerned kell a raszter- és a vektorgrafikus ábrák tárolási és szerkesztési módszereit, és tudnod kell mindkettőt létrehozni és módosítani. Ez a lecke a különbséget tisztázza, a következők a részleteket.

A lecke végére el tudod dönteni, hogy egy feladathoz melyik fajtát érdemes használni, és fel tudod ismerni a kettő tipikus tulajdonságait.

## A rasztergrafika

A raszteres kép **képpontokból** áll. Minden képponthoz tartozik egy szín, és a kép a pontok sorainak és oszlopainak táblázata. Egy 800 × 600-as kép 480 000 képpontot tartalmaz.

Fontos fogalmak:

- **Felbontás:** a képpontok száma szélesség × magasság szerint (például 1920 × 1080). Nyomtatáskor a sűrűséget **dpi**-ben (pont per hüvelyk) mérjük; a képernyőre szánt kép 72–96 dpi, a nyomtatásra szánt 300 dpi szokott lenni.
- **Színmélység:** egy képpont színét hány bit írja le. A 24 bites kép (RGB, mindhárom színcsatorna 8 bit) kb. 16,7 millió színt tud. A 8 bites kép legfeljebb 256 színű.
- **Fájlméret:** a tömörítetlen kép mérete = képpontok száma × színmélység. Egy 1920 × 1080-as, 24 bites kép tömörítetlenül kb. 6 MB.

A rasztergrafika előnye, hogy **fényképet és bonyolult színátmenetet** is jól tárol. Hátránya, hogy **nagyításkor elvész a minőség**: a program nem tud új részletet kitalálni, ezért a képpontokat nagyítja, és a kép "kockás" (pixeles) lesz. A fájl mérete a felbontással nő.

Tipikus raszteres programok: Paint, Paint.NET, GIMP, Photoshop.

## A vektorgrafika

A vektoros ábra **alakzatokból** áll: vonalból, téglalapból, ellipszisből, görbéből. Minden alakzatról a fájl a tulajdonságait őrzi: hol van, mekkora, milyen a vonala és kitöltése. Nagyításkor a program újraszámolja és újrarajzolja az alakzatot, ezért a vonalak **bármekkora méretben élesek** maradnak.

A vektorgrafika előnyei:

- veszteség nélkül nagyítható és kicsinyíthető (embléma, logó, térkép, műszaki rajz);
- a fájl mérete kicsi és nem függ a nagyítástól;
- minden alakzat **külön szerkeszthető** utólag: átszínezhető, mozgatható, törölhető.

Hátránya: fényképet nem lehet vele természetesen tárolni, mert annyi apró színátmenet lenne, hogy a leírás nagyobb lenne a raszteres képnél.

Tipikus vektoros programok: Inkscape, Adobe Illustrator, CorelDRAW. Az irodai programok (Word, LibreOffice Writer, Impress) rajzeszközei és az alakzatai is vektorosak.

## Összehasonlítás

| Szempont | Raszter | Vektor |
|---|---|---|
| Alapegység | képpont | alakzat (matematikai leírás) |
| Nagyítás | pixeles lesz | éles marad |
| Fénykép | igen | nem |
| Logó, ábra, rajz | lehetséges, de nagyításnál romlik | ideális |
| Fájlméret | a felbontással nő | az alakzatok számával nő |
| Utólagos szerkesztés | a képpontokat módosítod | az alakzatokat módosítod |

Hasonlat: a raszteres kép olyan, mint egy kirakott mozaik. Közelről látszanak a kövek, és nem lehet belőle kisebb vagy nagyobb mozaikot csinálni minőségvesztés nélkül. A vektoros kép olyan, mint a recept: bármekkora tortához elkészíthető belőle a megfelelő változat.

## Próbáld ki: a nagyítás próbája

1. Nyiss meg egy fényképet egy képszerkesztőben (Paint, Paint.NET vagy GIMP), és nagyítsd 800%-ra. Figyeld meg a négyzetes képpontokat.
2. Nyiss egy új dokumentumot egy vektoros programban (Inkscape) vagy egy irodai programban. Rajzolj egy ellipszist egy ferde vonallal, és nagyítsd ugyanúgy 800%-ra. Az élek simák maradnak.
3. Jegyezd fel: melyiknek romlott a minőség, és miért.

## Honnan tudod, melyik fajtát kell használnod?

Érettségi feladatban ritkán kérdezik meg közvetlenül, mégis döntened kell. Egyszerű szabály:

- **Fénykép vagy képjavítás** (kivágás, fényerő, retusálás): raszter.
- **Egyszerű, tiszta alakzatokból álló ábra, logó, plakát, folyamatábra**, ahol az alakzatokat külön kell mozgatni, átszínezni, vagy bármekkorára kell nagyítani: vektor.
- Ha a feladat "rétegeket" említ vagy "a képet kivágni", az raszteres művelet. Ha "csoportosítsd", "igazítsd", "csomópontot szerkessz", "halmazműveletet végezz", az vektoros.

Gyakori, hogy a kettőt együtt használod: egy fényképre vektoros feliratot vagy nyilat helyezel, a végső dokumentumba pedig mindkettő bekerül.

## Szöveges környezetben

A követelmény szerint ábrát és képet szöveges dokumentumban is el kell tudnod helyezni. A szövegszerkesztő a képet beszúrja (**Beszúrás, Kép**), és a méretét az **oldalarány megtartásával** kell változtatni. Az irodai program saját rajzeszközei vektoros alakzatot hoznak létre; ezeket a szövegszerkesztő lecke már bemutatta. A kép feliratozása, körbefuttatása és elhelyezése ugyanúgy működik, függetlenül attól, hogy a kép raszteres vagy vektoros.

## Gyakorold

1. Egy iskola logóját a plakáton A4-es méretben, majd molinó méretben is használnák. Melyik grafikát kell választani?

   *Megoldás:* Vektorosat, mert veszteség nélkül nagyítható.

2. Mekkora a tömörítetlen mérete egy 1000 × 500-as, 24 bites képnek?

   *Megoldás:* 1000 × 500 = 500 000 képpont, egyenként 3 bájt, vagyis 1 500 000 bájt, kb. 1,5 MB.

3. A képernyőn egy ferde vonal lépcsősnek látszik, ha nagyítod. Raszteres vagy vektoros a kép?

   *Megoldás:* Raszteres.

4. Egy ábrán a kört utólag át kell színezni, anélkül, hogy az egész ábrát újra kellene rajzolni. Melyik fajtával könnyebb?

   *Megoldás:* Vektorossal, mert a kör önálló alakzat, a kitöltése egy tulajdonsága.

## Gyakori hibák

- **A felbontás és a méret keverése:** a képpontok száma nem ugyanaz, mint a nyomtatott méret. Ugyanaz a kép 300 dpi-n kisebb, 72 dpi-n nagyobb lenne a papíron.
- **Kisméretű raszteres kép felnagyítása**, majd csodálkozás, hogy kockás. A hiányzó részletet nem lehet visszaszerezni.
- **Fénykép "vektorizálása" azzal a reménnyel, hogy tökéletes lesz:** a fénykép árnyalatai vektoros ábrán nem jönnek át természetesen.
- **Az arány eltorzítása** méretezéskor: mindig a sarokpontot húzd, vagy kapcsold be az arány rögzítését.
- **Ábra rajzolása raszteres programban,** amikor később még módosítani kell: vektorosban érdemes.

## Összefoglalás

- A raszteres kép képpontokból áll; a felbontás és a színmélység adja a minőségét és a méretét; nagyításkor pixeles lesz.
- A vektoros kép alakzatokból és azok tulajdonságaiból áll; veszteség nélkül méretezhető, az alakzatok külön szerkeszthetők.
- Fényképhez és képjavításhoz raszter, logóhoz, ábrához és rajzhoz vektor való.
- A kettő együtt is használható, és mindkettő beilleszthető szöveges dokumentumba.

**Érettségi szint:** a két fajta ismerete, létrehozása és szerkesztése már **középszinten** követelmény. Emelt szinten a kettő egymásba alakítása is feladat (lásd a következő leckét).
