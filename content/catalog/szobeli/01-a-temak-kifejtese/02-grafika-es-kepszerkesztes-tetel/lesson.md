---
slug: grafika-es-kepszerkesztes-tetel
title: "Grafika és képszerkesztés: tételvázlat"
position: 1
free: true
published: false
reviewed_by:
reviewed_at:
---

## Mire használd ezt a vázlatot?

A hivatalos szóbeli tételsorok nem nyilvánosak, ez a vázlat **saját felkészítő anyag** a vizsgakövetelmény alapján. A grafika és képszerkesztés témakörben azt várják tőled, hogy megkülönbözteted a kétféle képtípust, ismered a leggyakoribb formátumokat, és be tudod mutatni az alapvető képszerkesztési műveleteket.

## Kulcsfogalmak és pontos definíciók

- **Raszteres (bittérképes) kép**: pixelekből, azaz színes képpontokból álló rács. Minden pixelnek külön színe van. Nagyításkor a pixelek láthatóvá válnak, a minőség romlik. Tipikus példa: fénykép.
- **Vektorgrafikus kép**: matematikai leírással adott alakzatokból (szakasz, görbe, kitöltés) áll. Veszteség nélkül nagyítható, mérete általában kicsi. Tipikus példa: logó, ábra, térkép.
- **Felbontás**: a kép pixeleinek száma (például 1920x1080), illetve a pixelsűrűség (ppi, nyomtatásnál dpi). Több pixel nagyobb fájlt jelent.
- **Színmélység**: egy pixel színének tárolásához használt bitek száma. 24 bit esetén 16,7 millió szín lehetséges (RGB, csatornánként 8 bit).
- **RGB**: additív színmodell (vörös, zöld, kék): képernyőre. **CMYK**: szubtraktív színmodell (cián, bíbor, sárga, fekete): nyomtatásra.
- **Tömörítés**: veszteséges (JPEG: kisebb fájl, de adat vész el) és veszteségmentes (PNG, GIF: az eredeti visszaállítható).
- **Réteg**: átlátszó fólia a képen. A rétegek külön szerkeszthetők, sorrendjük és átlátszóságuk változtatható.
- **Maszk**: azt szabályozza, a réteg mely része látszik.

## Fájlformátumok röviden

| Formátum | Típus | Jellemző |
|---|---|---|
| JPEG | raszter | veszteséges tömörítés, fényképekhez, nincs átlátszóság |
| PNG | raszter | veszteségmentes, átlátszóságot is tud, ábrákhoz, képernyőképhez |
| GIF | raszter | legfeljebb 256 szín, egyszerű animáció |
| BMP | raszter | tömörítetlen, nagy fájl |
| TIFF | raszter | nyomdai, veszteségmentes |
| SVG | vektor | szöveges (XML) leírás, weben is használható |
| PSD / XCF | raszter | a rétegeket megőrző munkafájl (Photoshop, GIMP) |

## A kifejtés javasolt sorrendje

1. **Kétféle kép**: raszter és vektor, jellemzőkkel és példákkal.
2. **Színkezelés**: RGB és CMYK, színmélység, felbontás.
3. **Formátumok**: melyik mire való, és miért (fénykép: JPEG, logó átlátszó háttérrel: PNG vagy SVG).
4. **Alapműveletek**: kivágás, átméretezés, forgatás, tükrözés, színkorrekció (fényerő, kontraszt, telítettség), retusálás.
5. **Rétegek**: mire jók, hogyan készül képösszeállítás, szöveg a képen.
6. **Szűrők és effektek**: életlenítés, élesítés, torzítás.
7. **Mentés**: a rétegezett munkafájlt és a kész képet külön mentjük.
8. **Felhasználás**: webre kis méret, nyomtatásra nagy felbontás. Szerzői jog említése.

## Hogyan számolj a fájlmérettel?

A bizottság szívesen kér egy gyors számítást. A tömörítetlen kép mérete: szélesség x magasság x színmélység (bit) / 8 bájt. Egy 1000x800 pixeles, 24 bites kép: 1000 x 800 x 3 = 2 400 000 bájt, vagyis nagyjából 2,3 MiB. A JPEG ennek a töredékére tömöríti, de veszít az információból. Ha felére csökkented a kép szélességét és magasságát, a pixelek száma a **negyedére** esik, tehát a tömörítetlen méret is a negyedére csökken. Ezt a gondolatmenetet érdemes néhány mondatban elmondani, mert a számolás a szakmai érettséget mutatja.

## Szemléltetés a gépen

- Nyiss meg egy fényképet, nagyíts rá 800%-ra: látszanak a pixelek. Ugyanezt tedd meg egy vektoros ábrával: éles marad.
- Mentsd el ugyanazt a képet JPEG-ként alacsony minőséggel és PNG-ként, és hasonlítsd össze a fájlméretet.
- Mutass egy kétrétegű összeállítást (háttér és szöveg), kapcsold ki az egyik réteget, majd állíts át átlátszóságot.
- Vágj ki egy tárgyat, és tedd új háttérre.

## Tipikus bizottsági kérdések és mintaválaszok

**Miért nem jó a JPEG logóhoz?**
A veszteséges tömörítés elmossa az éles széleket, és nem támogatja az átlátszóságot. A logóhoz PNG vagy még inkább vektoros SVG való.

**Mi történik, ha kicsi raszteres képet nagyítunk?**
A program új pixeleket számol (interpoláció), a kép elmosódik vagy szemcsés lesz, mert nincs több információ. A vektoros kép újraszámolódik, ezért éles marad.

**Mit jelent a veszteséges tömörítés?**
A tömörítéskor a szemnek kevésbé feltűnő információk elvesznek, ezért a kép nem állítható vissza pontosan az eredetire. Ismételt mentésnél a romlás halmozódik.

**Mi a különbség a felbontás és a méret között?**
A felbontás a pixelek száma vagy sűrűsége, a méret lehet pixelben vagy fizikai (cm). Ugyanaz a pixelszám különböző nyomtatási méretnél más ppi-t jelent.

**Mire jók a rétegek?**
Az elemek egymástól függetlenül módosíthatók, és a módosítás visszavonható, ezért roncsolásmentes szerkesztést tesznek lehetővé.

## Gyakori hibák

- Azt mondod, a "vektoros kép nem fénykép formátum": pontosabb, hogy fényképhez nem alkalmas, mert a valós képet nem lehet kevés alakzattal leírni.
- A JPEG és a PNG összekeverése az átlátszóság kérdésénél.
- A felbontást a fájlmérettel azonosítod.
- Rétegezett munkát csak JPEG-ként mentesz, így a rétegek elvesznek.
- A kép **arányos** átméretezésének mellőzése: torzul a kép.

## Összefoglalás

- Raszter: pixelek, fényképekhez; vektor: alakzatok, logókhoz és ábrákhoz.
- RGB képernyőre, CMYK nyomtatásra.
- JPEG veszteséges, PNG veszteségmentes és átlátszó, GIF max. 256 szín, SVG vektoros.
- A rétegek a roncsolásmentes szerkesztés alapjai.
- Mutass mindig példát: a pixelek nagyítása és a fájlméret-összehasonlítás látványos és gyors.
