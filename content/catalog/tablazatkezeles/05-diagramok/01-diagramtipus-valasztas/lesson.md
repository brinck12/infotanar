---
slug: diagramtipus-valasztas
title: Diagramtípus választása és készítése
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (diagram készítése, módosítása, a megfelelő típus kiválasztása).*

## Mire jó egy diagram?

Egy számokkal teli táblázatból nehéz kiolvasni, melyik érték a legnagyobb, vagy hogyan változik valami az idő során. A diagram ugyanazt az adatot képként mutatja, így egy pillantás is elég. Az érettségin ezért két dolgot várnak tőled: hogy **elkészítsd** a diagramot, és hogy az adathoz illő **típust válassz**.

A leckében egy mozi heti jegyeladásait használjuk (`A1:D5`, a fejléc az 1. sorban):

| Film | Műfaj | Jegyár (Ft) | Eladott jegy (db) |
|---|---|---|---|
| Hold | sci-fi | 2200 | 184 |
| Nyár | vígjáték | 1800 | 236 |
| Mese | animáció | 1500 | 310 |
| Tó | dráma | 1900 | 127 |

## A diagram részei, röviden

Mielőtt készítesz egyet, ismerd meg a szavakat:

- **Adatsor**: az ábrázolt számok egy sora vagy oszlopa (például az `Eladott jegy (db)` oszlop). Egy diagramban több adatsor is lehet.
- **Kategória**: ami alapján az adatokat csoportosítod, itt a filmek címe. Ez kerül a vízszintes tengely feliratára.
- **Tengely**: a vízszintes (kategória-) és a függőleges (érték-) vonal a skálával.
- **Diagramcím, jelmagyarázat**: a diagram neve, illetve az adatsorok színeinek magyarázata.

## A leggyakoribb típusok

**Oszlopdiagram.** Függőleges oszlopok magassága mutatja az értéket. Akkor használd, ha **különálló kategóriákat hasonlítasz össze**: melyik film fogyott a legjobban? A **sávdiagram** ugyanez fektetve, hosszú kategórianevekhez jó, mert a címkék jól elférnek.

**Vonaldiagram.** Pontok vonallal összekötve. **Időbeli változást** mutat: hónapról hónapra, évről évre. A vonal azt sugallja, hogy a pontok között folytonos az átmenet, ezért különálló kategóriákra (filmekre) nem illik.

**Kördiagram.** Egyetlen adatsor részeit mutatja az egészhez képest, a szeletek együtt 100%-ot adnak. Akkor jó, ha az **arányok** a fontosak (melyik film hozta a jegyek mekkora részét), és kevés, legfeljebb 5–6 szelet van. Negatív érték nem ábrázolható vele, és több adatsort sem érdemes beletenni.

**Pont (pont-xy) diagram.** Két számadat összefüggését mutatja: minden pont egy adatpár, például a jegyár és az eladott darabszám. Mindkét tengelyen szám van. Akkor választod, ha **összefüggést, kapcsolatot** vizsgálsz.

**Területdiagram.** Mint a vonaldiagram, de a vonal alatti rész ki van színezve. Az időbeli alakulás mellett a nagyságot is hangsúlyozza.

| Mit akarsz megmutatni? | Típus |
|---|---|
| kategóriák összehasonlítása | oszlop vagy sáv |
| változás az idő során | vonal |
| részarány az egészből | kör |
| két mennyiség összefüggése | pont |

## Diagram készítése lépésről lépésre

1. **Jelöld ki az adatot**, a fejlécekkel együtt. Ha a két ábrázolandó oszlop nem szomszédos (itt a filmek címe az `A` oszlopban, a darabszám a `D` oszlopban van), jelöld ki az `A1:A5` tartományt, tartsd lenyomva a `Ctrl` billentyűt, és jelöld ki a `D1:D5` tartományt is.
2. **Excel**: `Beszúrás` > `Diagramok`, és kiválasztod a típust, például `Oszlop` > `Csoportos oszlop`.
   **LibreOffice**: `Beszúrás` > `Diagram...`, a varázslóban kiválasztod a típust, majd a `Befejezés` gombbal elkészül.
3. A diagram megjelenik a munkalapon. Az egérrel mozgathatod, a sarkainál fogva átméretezheted.
4. Ha rossz az eredmény, kattints a diagramra, és módosítsd. **Excel**: `Diagramtervezés` > `Adatok kijelölése`; **LibreOffice**: jobb kattintás > `Adattartományok...`.

Az eredményben a vízszintes tengelyen négy film szerepel, mindegyik felett egy oszlop: a `Mese` oszlopa a legmagasabb (310), a `Tó` a legalacsonyabb (127).

**Próbáld ki:** készíts kördiagramot ugyanebből az adatból. Melyik film kapja a legnagyobb szeletet? (A `Mese`: 310 az összesen 857 jegyből, vagyis kb. 36%.)

## Adatsor soronként vagy oszloponként

A program kitalálja, hogy az adatsor a sorokban vagy az oszlopokban van. Ha az eredmény fordítottnak látszik (a filmek a jelmagyarázatba kerültek, a tengelyen pedig valami más áll), cseréld fel. **Excel**: `Diagramtervezés` > `Sor/oszlop váltása`. **LibreOffice**: az `Adattartományok` ablakban válaszd az `Adatsorok oszlopokban` vagy `Adatsorok sorokban` lehetőséget.

Ha két adatsort rajzolnál egy diagramba (jegyár és darabszám), a skálájuk annyira különbözik (2200 és 184), hogy az egyik a másik mellett alig látszik. Erre a következő lecke ad megoldást: a másodlagos tengelyt.

## Hogyan válassz típust az érettségin?

A feladat azt írja, mit kell **megmutatni**. Olvasd el a kulcsszavakat:

- „hasonlítsa össze”, „melyik a legnagyobb” → oszlop,
- „időbeli alakulás”, „hónaponként” → vonal,
- „arány”, „megoszlás”, „százalékos részesedés” → kör,
- „összefüggés” → pont.

Gyakran a feladat meg is adja a típust, de ilyenkor is érdemes végiggondolnod, hogy az adat illik-e hozzá. Ha te választasz, indokolni is tudnod kell: a szóbelin ez gyakori kérdés.

## Gyakori hibák

- Kördiagramot készítesz idősorra, vagy olyan adatra, amelynek az összege nem értelmes egész.
- A fejlécet nem jelölöd ki, így az adatsor neve „Adatsor1” lesz a jelmagyarázatban.
- Az évszám oszlopot a program adatsornak veszi (mert szám), és külön oszlopként rajzolja ki, nem kategóriaként. Ilyenkor az évszámot kategóriatengely-címkének kell megadnod.
- Vonaldiagramot használsz különálló kategóriákra.
- A diagram nem a kijelölt tartományt ábrázolja, mert nem jelölted ki pontosan.

## Összefoglalás

A diagram az adatsorokat a kategóriák mentén rajzolja ki. Az oszlop- (sáv-) diagram összehasonlít, a vonaldiagram időbeli változást mutat, a kördiagram részarányt ábrázol, a pontdiagram két mennyiség összefüggését. A készítés: kijelölöd az adatot a fejlécekkel együtt, kiválasztod a típust, és ha kell, módosítod az adattartományt vagy felcseréled a sorokat és oszlopokat. A típust mindig a feladat szövege szerint válaszd.
