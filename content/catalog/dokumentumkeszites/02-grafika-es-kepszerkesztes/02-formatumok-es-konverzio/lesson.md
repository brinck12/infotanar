---
slug: formatumok-es-konverzio
title: Képformátumok és konverzió
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért számít, milyen formátumban mentesz?

Az érettségi grafikai feladatai szinte mindig így végződnek: "mentsd el a képet JPEG formátumban, ezen a néven" vagy "mentsd el SVG-ként". A követelmény szerint tudnod kell grafikát megnyitni és **megadott formátumban menteni**, emelt szinten pedig a raszteres és a vektoros ábrát **egymásba alakítani**. Ha rossz formátumban mentesz, a feladat pontot veszít, hiába jó a kép.

A lecke végére tudni fogod a gyakori formátumok tulajdonságait, megtanulod a mentés és az exportálás különbségét, és meg tudod oldani az átalakítást raszter és vektor között.

## A tömörítés két fajtája

A képfájl tömörítve is tárolható, hogy kisebb legyen.

- **Veszteségmentes tömörítés:** a kép visszaállításakor pontosan az eredeti jön vissza (mint egy zip). A fájl kevésbé lesz kicsi.
- **Veszteséges tömörítés:** a program eldobja azokat a részleteket, amelyeket a szem kevésbé vesz észre. A fájl sokkal kisebb, de a minőség romlik, és **ami elveszett, nem hozható vissza**. Többszöri mentéskor a romlás halmozódik.

## A leggyakoribb formátumok

| Formátum | Kiterjesztés | Fajta | Tulajdonságai |
|---|---|---|---|
| JPEG | .jpg, .jpeg | raszter | veszteséges, 24 bites, fényképekre való, nincs átlátszóság |
| PNG | .png | raszter | veszteségmentes, átlátszóságot tud, ábrákhoz, képernyőképhez, szöveges képhez ideális |
| GIF | .gif | raszter | legfeljebb 256 szín, animációt tud, egy átlátszó szín |
| BMP | .bmp | raszter | általában tömörítetlen, nagy fájl |
| TIFF | .tif, .tiff | raszter | veszteségmentes, nyomdai és archiváló célra |
| SVG | .svg | vektor | szövegalapú (XML), webre és nyomtatásra, bármekkorára nagyítható |
| PDF | .pdf | mindkettő | dokumentumformátum, vektort és raszteres képet is tartalmazhat |
| saját formátumok | .xcf (GIMP), .psd (Photoshop), .pdn (Paint.NET) | raszter | a **rétegeket** is megőrzik |

Hogyan válassz? Ökölszabály:

- **Fénykép, kis fájlméret:** JPEG.
- **Rajz, ábra, éles él, átlátszó háttér:** PNG.
- **Egyszerű animáció:** GIF.
- **Vektoros ábra:** SVG.
- **Még szerkeszteni fogod rétegekkel:** a program saját formátuma (XCF, PSD, PDN), és csak a végén exportálsz.

## Mentés és exportálás

Amikor GIMP-ben, Photoshopban vagy Inkscape-ben dolgozol, kétféle mentés van.

- **Mentés (Fájl, Mentés):** a program saját formátumában ment, megőrizve a rétegeket vagy az alakzatokat, hogy később folytathasd.
- **Exportálás (GIMP: Fájl, Exportálás másként; Photoshop: Fájl, Exportálás vagy Mentés másként; Paint.NET: Fájl, Mentés másként; Inkscape: Fájl, Mentés másként vagy Másolat mentése):** a kívánt formátumban hozza létre a fájlt, a rétegeket egyetlen síkba **lapítja**.

Ha a feladat szerint a kész képet JPEG-ben kell leadni, exportáld JPEG-be. A rétegekkel megőrzött munkafájlt is tartsd meg: a lapított JPEG-ből a rétegek nem állíthatók vissza.

Mentéskor a program gyakran kérdez beállításokat:

- JPEG: a **minőség** (0–100). Magasabb szám jobb minőség és nagyobb fájl; a 80–90 jó kompromisszum.
- PNG: tömörítési szint (veszteségmentes marad, csak a méret változik).
- Átlátszó háttér: JPEG-ben nem lehet, ilyenkor a program fehér vagy más háttérszínt tesz oda.

## Méretezés a mentés előtt

A feladat gyakran megadja a kép méretét. Két különböző művelet létezik:

- **Kép átméretezése (Kép, Kép méretezése):** a teljes képet új képpontszámra alakítja. Az arány megtartásához a lánc ikont kell zárva hagyni, különben a kép torzul.
- **Vászon átméretezése:** a kép tartalmát nem nyújtja, csak a "lap" méretét növeli vagy csökkenti (a kép szélét levágja, vagy üres területet ad hozzá).

Gyakori hiba, hogy a diák a vásznat méretezi ott, ahol a képet kellene.

## Próbáld ki: ugyanaz a kép három formátumban

1. Nyiss meg egy fényképet, és mentsd JPEG-ként 90-es, majd 20-as minőséggel. Hasonlítsd össze a két fájl méretét és a megjelenést (nagyítsd az éles éleket).
2. Mentsd ugyanezt PNG-ként is. Melyik a legnagyobb?
3. Egy 800 × 600-as képet méretezz át 400 × 300-ra. Mentsd el. Ellenőrizd a fájl tulajdonságaiban a méretet.

## Átalakítás raszter és vektor között

**Vektorból rasztert** egyszerű: az **exportálás** vagy a **rasterizálás**. Inkscape-ben a Fájl, Bitkép exportálása menüben megadod a méretet (képpontban vagy dpi-ben), és a program PNG-t készít. Fontos: a méretet **a mentéskor kell jól megadni**, mert a kész PNG már nem nagyítható veszteség nélkül. Irodai programban a vektoros ábra kijelölése után a Másolás, majd Irányított beillesztés (kép) is raszteressé teszi.

**Rasztert vektorrá** nehezebb, mert a programnak fel kell ismernie az alakzatok határát. Ezt **vektorizálásnak** (nyomkövetésnek) hívják. Inkscape-ben: jelöld ki a bitképet, majd **Útvonal, Bitkép nyomkövetése** (Trace Bitmap). A beállításoknál megadhatod a küszöbértéket (a világos és sötét határát) vagy a színek számát. Az eredmény SVG, amelyben a kép **útvonalakból** áll. Ez jól működik egyszerű, kevés színű képen (logó, aláírás, rajz), fényképen azonban rossz, "festményes" eredményt ad.

Megjegyzés: a konverzió nem kötelezően tökéletes. Az eredményt mindig ellenőrizd, és a nem kívánt részeket (például a háttér-négyzetet) töröld.

## Gyakorold

1. Melyik formátumot választod egy átlátszó hátterű logóhoz, amelyet weblapra szánsz, és bármilyen háttérre kerülhet?

   *Megoldás:* PNG (raszteres, átlátszóságot tud), vagy SVG, ha vektoros és nagyítani is kell.

2. Egy fényképet többször JPEG-ként mentettél, majd megnyitottad és újra mentetted. Miért romlik a minősége?

   *Megoldás:* A veszteséges tömörítés minden mentésnél újabb részletet dob el, és ez halmozódik.

3. Egy rétegekkel készült képet a feladat szerint JPEG-ben kell leadni. Hogyan mented?

   *Megoldás:* A saját formátumban (például XCF) mented a munkát, majd exportálod JPEG-be. Az exportálás a rétegeket lapítja.

4. Egy aláírás szkennelt képét vektorossá kell alakítani. Mit használsz Inkscape-ben?

   *Megoldás:* Útvonal, Bitkép nyomkövetése; a küszöbérték beállítása után az eredmény vektoros útvonal.

## Gyakori hibák

- **Rossz kiterjesztés:** a fájl nevét átírod .jpg-re, de a tartalma nem változik. A formátumot mindig a **Mentés másként / Exportálás** adja.
- **Rétegek elvesztése:** a kész JPEG-ben nincs réteg, ezért a munkafájlt előbb mentsd.
- **Átlátszóság JPEG-ben:** nincs; PNG-t válassz.
- **Fotó GIF-ben:** a 256 színtől csíkos lesz.
- **Vektoros ábra kis PNG-be exportálva,** amelyet később nagyítanál: eleve nagyobb méretben exportálj.
- **Torzított méretezés:** az arányt tartsd meg.

## Összefoglalás

- A tömörítés lehet veszteséges (JPEG) vagy veszteségmentes (PNG, TIFF).
- JPEG fényképhez, PNG ábrához és átlátszósághoz, GIF animációhoz, SVG vektorhoz.
- A mentés megőrzi a rétegeket, az exportálás a kért formátumban lapított fájlt hoz létre.
- A kép és a vászon méretezése különböző művelet.
- Vektorból raszter exportálással, rasztert vektorrá nyomkövetéssel lehet alakítani; az utóbbi egyszerű képeken jó.

**Érettségi szint:** megadott formátumban menteni és megnyitni **középszinten** is kell. A raszter- és vektorgrafika **egymásba alakítása emelt szintű** követelmény.
