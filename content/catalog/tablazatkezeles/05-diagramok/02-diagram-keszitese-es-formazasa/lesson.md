---
slug: diagram-keszitese-es-formazasa
title: Diagram formázása és elemei
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (címek, tengelyek, jelmagyarázat, adatfeliratok); emelt (másodlagos tengely, kombinált diagram).*

## Miért kell formázni?

Az elkészült diagram még nem érettségi-kész. A feladat többnyire előírja, mi legyen a címe, mit írj a tengelyekre, hol legyen a jelmagyarázat. Minden elemet külön lehet beállítani, és a pontozás is elemenként történik. Ebben a leckében sorra vesszük őket.

A mintaadat egy mozi heti adata (`A1:D5`):

| Film | Jegyár (Ft) | Eladott jegy (db) | Bevétel (Ft) |
|---|---|---|---|
| Hold | 2200 | 184 | 404800 |
| Nyár | 1800 | 236 | 424800 |
| Mese | 1500 | 310 | 465000 |
| Tó | 1900 | 127 | 241300 |

## Hogyan nyisd meg a beállításokat?

A diagram minden eleme külön kijelölhető: kattints rá, és a **jobb gombbal** válaszd a `... formázása` menüpontot. Ez a leggyorsabb mód mindkét programban.

- **Excel**: a diagramra kattintva a diagram mellett megjelenik egy pluszjeles gomb (`Diagramelemek`), amellyel elemeket adhatsz hozzá vagy vehetsz el.
- **LibreOffice**: a diagramra **dupla kattintással** szerkesztő módba lépsz; a `Beszúrás` menüben vannak a címek, a jelmagyarázat és a feliratok, a `Formátum` menüben a kijelölt elem formázása. A szerkesztésből a diagramon kívüli kattintással lépsz ki.

## Diagramcím és tengelycímek

A **diagramcím** a diagram témáját mondja meg („Heti bevétel filmenként”). A **tengelycím** megmondja, mi van a tengelyen: a vízszintesen „Film”, a függőlegesen „Bevétel (Ft)”. A mértékegységet mindig írd ki.

- **Excel**: `Diagramtervezés` > `Diagramelem hozzáadása` > `Diagramcím` / `Tengelycímek`.
- **LibreOffice**: `Beszúrás` > `Címek...`, ott a főcím, az alcím és a tengelyek címei.

A feladatban megadott szöveget szó szerint írd be.

## A tengelyek beállítása

A függőleges tengelyen beállíthatod:

- a **legkisebb és legnagyobb értéket** (alapból automatikus),
- a **főbeosztás** távolságát (például 100 helyett 50-esével),
- a **számformátumot** (ezres tagolás, tizedesjegyek),
- a tengely elrejtését.

A művelet: jobb kattintás a függőleges tengelyre > `Tengely formázása` (Excel) vagy `Y tengely...` (LibreOffice), a `Skála` fülön. Oszlopdiagramnál ne állítsd a legkisebb értéket nullánál nagyobbra, mert az oszlopok aránya megtévesztő lesz: úgy tűnik, hogy az egyik oszlop sokszorosa a másiknak.

A vízszintes (kategória-) tengelyen a feliratok szögét és sorrendjét állíthatod. Ha a címkék nem férnek el, döntsd meg őket, vagy válts sávdiagramra.

## Jelmagyarázat és adatfeliratok

A **jelmagyarázat** megmondja, melyik szín melyik adatsor. Elhelyezheted jobb oldalt, alul vagy felül. Ha csak egy adatsorod van, gyakran fölösleges, és a feladat kérheti, hogy töröld. Az adatsor neve a fejléccellából jön; átnevezéshez írd át a fejléc szövegét, vagy az adattartomány ablakban a nevet.

Az **adatfelirat** az oszlop mellé vagy fölé írja az értéket. Excel: `Diagramelem hozzáadása` > `Adatfeliratok`; LibreOffice: `Beszúrás` > `Adatfeliratok...`. Kördiagramnál a felirat lehet százalék is: ilyenkor a százalék megjelenítését kell bekapcsolnod.

## Adatsorok formázása

Az adatsor színét, a vonal vastagságát és a jelölőpontokat az adatsorra jobb kattintással, az `Adatsor formázása` menüponttal állítod. Egyetlen oszlop vagy egy kördiagram-szelet külön is kijelölhető (kétszer kattints rá), így kiemelhetsz egy értéket, például a legnagyobbat más színnel. Kördiagramnál a szeletet ki is húzhatod.

## Másodlagos tengely (emelt szint)

Ha két adatsor nagyságrendje nagyon eltér, az egyik tengelyen kicsinek látszik a másik. A `Bevétel (Ft)` értékei több százezresek, az `Eladott jegy (db)` értékei néhány százasok. Közös skálán a darabszám adatsor alig látszana.

Megoldás: a második adatsor kapjon **másodlagos tengelyt**, a diagram jobb oldalán saját skálával.

- **Excel**: jobb kattintás az adatsorra > `Adatsor formázása` > `Adatsor beállításai` > `Másodlagos tengely`.
- **LibreOffice**: jobb kattintás az adatsorra > `Adatsor formázása` > `Beállítások` fül > `Adatsor igazítása` > `Másodlagos Y tengely`.

A másodlagos tengelyhez is írj tengelycímet („Eladott jegy (db)”).

## Kombinált diagram (emelt szint)

A **kombinált diagram** egyetlen diagramban több típust használ. A tipikus feladat: a bevétel oszlopként, az eladott jegy vonalként, másodlagos tengelyen.

1. Jelöld ki a `Film`, az `Eladott jegy (db)` és a `Bevétel (Ft)` oszlopot (`A1:A5`, `C1:D5`, a `Ctrl` billentyűvel), és készíts csoportos oszlopdiagramot.
2. **Excel**: jobb kattintás az `Eladott jegy (db)` adatsorra > `Adatsor diagramtípusának módosítása` > `Kombinált`; ennek az adatsornak a típusa `Vonal`, és pipáld be a `Másodlagos tengely` négyzetet. **LibreOffice**: jobb kattintás a diagramra > `Diagramtípus...` > `Oszlop és vonal`, majd az `Eladott jegy (db)` adatsort a fenti módon tedd másodlagos tengelyre.
3. Add meg a címeket: főcím, vízszintes tengely („Film”), bal oldali tengely („Bevétel (Ft)”), jobb oldali tengely („Eladott jegy (db)”).
4. Állítsd a jelmagyarázatot alulra.

Az eredmény: a `Mese` oszlopa a legmagasabb (465 000 Ft), és a darabszámot mutató vonal is itt van a csúcson (310 db). A kettő együtt mutatja, hogy a bevétel és a darabszám szorosan együtt mozog.

## Hol legyen a diagram?

Alapból a munkalapon van, de a feladat kérheti, hogy külön **diagramlapon** legyen. **Excel**: jobb kattintás a diagramon > `Diagram áthelyezése` > `Új munkalap`. **LibreOffice**: a diagram a munkalapon él; a helyét és a méretét a `Pozíció és méret` ablakban (`F4`) adhatod meg. Ügyelj arra, hogy a diagram ne takarjon adatot.

## Gyakorold

1. Készíts a mintaadatból oszlopdiagramot az eladott jegyek számáról. Címe: „Heti jegyeladás”, a függőleges tengely címe: „Eladott jegy (db)”. Töröld a jelmagyarázatot, és kapcsold be az adatfeliratot.
2. Hogyan emeled ki a legjobban fogyó film oszlopát más színnel?
3. Miért kell másodlagos tengely, ha a bevételt és a jegyek számát ugyanabban a diagramban ábrázolod?

**Megoldás**

- 1. Kijelölöd az `A1:A5` és a `C1:C5` tartományt, oszlopdiagramot készítesz, majd a fent leírt módon hozzáadod a címeket és az adatfeliratot, és törlöd a jelmagyarázatot.
- 2. Az oszlopra kétszer kattintasz (az első kattintás az egész adatsort, a második az egyetlen oszlopot jelöli ki), majd `Adatpont formázása`, kitöltőszín.
- 3. A két adatsor nagyságrendje nagyon eltér (százezres és százas számok), ezért közös skálán a kisebb értékű adatsor szinte láthatatlan lenne.

## Gyakori hibák

- A tengelycímről lemarad a mértékegység.
- A diagramcím nem egyezik a feladatban megadottal (elütés, kisbetű).
- Másodlagos tengelyt használsz, de nem írsz rá címet, így nem derül ki, melyik skála melyik adatsoré.
- A kombinált diagramban mindkét adatsor oszlop marad, ezért az oszlopok egymást takarják.
- A függőleges tengelyt oszlopdiagramnál nem nullától indítod.
- Az adatsor neve „Adatsor1” marad, mert a fejlécet nem jelölted ki.

## Összefoglalás

A diagram elemei: cím, tengelyek (tengelycímmel és mértékegységgel), adatsorok, jelmagyarázat, adatfeliratok. Mindegyiket jobb kattintással, a `... formázása` menüponttal állítod. Emelt szinten a nagyon eltérő nagyságrendű adatsort másodlagos tengelyre teszed, és kombinált diagramban egy oszlop- és egy vonaldiagramot egyesítesz. A feladatban megadott szövegeket, helyeket és típusokat pontosan kövesd.
