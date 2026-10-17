---
slug: kozep-szintu-tablazat-feladat
title: Közép szintű táblázat-feladat lépésről lépésre
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép. Az alábbi feladat saját, a vizsga szerkezetét követő minta, nem hivatalos feladat.*

## Hogyan épül fel egy táblázatos érettségi feladat?

A gyakorlati vizsgán a táblázatkezelős feladat egy **forrásfájlból** indul (általában szöveges, tabulátorral tagolt adatból), és sok kisebb lépést tartalmaz. A lépések külön pontot érnek, és többnyire egymásra épülnek: ha az egyik oszlop rossz, a rá hivatkozó képlet is az. Ebben a leckében egy teljes közép szintű mintafeladatot oldunk meg, a pontozás a minta saját beosztása.

Három szabály az egész feladatra:

1. **Olvasd végig a teljes leírást**, mielőtt hozzákezdesz. Sok lépés ugyanarra az oszlopra hivatkozik.
2. **Képletet írj, ne számot.** Ha a feladat „számítsa ki”, a cellában képlet legyen, hogy az adat változásakor is helyes maradjon.
3. **Mentsd el gyakran**, a feladatban megadott néven és formátumban.

## A feladat

> **Mozi.** A `mozi.txt` fájl (UTF-8, tabulátorral tagolt) egy mozi heti jegyeladásait tartalmazza. Az első sor a fejléc. Oszlopai: film címe, műfaj, jegyár (Ft), eladott jegyek száma (db).
>
> 1. Nyissa meg a fájlt táblázatkezelővel, és mentse `mozi` néven a program saját formátumában. (1 pont)
> 2. A munkalap neve legyen `Jegyeladás`. (1 pont)
> 3. Az `E1` cellába írja be: `Bevétel (Ft)`, `F1`-be: `Megítélés`. (1 pont)
> 4. Az `E` oszlopban számítsa ki filmenként a bevételt! (2 pont)
> 5. Az `F` oszlopban jelenítse meg, hogy a film népszerű-e: ha legalább 150 jegyet adtak el, a cellába `népszerű`, különben `átlagos` kerüljön! (3 pont)
> 6. Az `A8:B11` tartományban számítsa ki a következőket: az összes eladott jegy száma, az összes bevétel, az átlagos bevétel, a legnagyobb bevétel. Mindegyik elé írja oda a megnevezését. (4 pont)
> 7. Számolja meg, hány thriller műfajú film van! (2 pont)
> 8. Számítsa ki a thriller filmek összbevételét! (2 pont)
> 9. Formázza a bevételt ezres tagolású, `Ft` mértékegységű számként; a fejléc legyen félkövér, szegélyezett és szürke hátterű. (3 pont)
> 10. Rendezze a táblázatot bevétel szerint csökkenő sorrendbe! (2 pont)
> 11. Készítsen oszlopdiagramot a filmenkénti bevételről! A diagram címe `Heti bevétel`, a függőleges tengely címe `Bevétel (Ft)`, a jelmagyarázat ne legyen látható! (4 pont)

Az adat (`A1:D7`):

| Film | Műfaj | Jegyár (Ft) | Eladott jegy (db) |
|---|---|---|---|
| Hold | sci-fi | 2200 | 184 |
| Nyár | vígjáték | 1800 | 236 |
| Őrjárat | thriller | 2000 | 152 |
| Mese | animáció | 1500 | 310 |
| Éjjel | thriller | 2000 | 98 |
| Tó | dráma | 1900 | 127 |

## 1–3. lépés: megnyitás, munkalap, fejlécek

**Excel**: `Fájl` > `Megnyitás`, a `mozi.txt` kiválasztása, a szövegbeolvasó varázslóban `Tagolt`, elválasztó a `Tabulátor`, a fájl eredete `Unicode (UTF-8)`. **LibreOffice**: `Fájl` > `Megnyitás`, a szövegimportálás ablakban a karakterkészlet `Unicode (UTF-8)`, az elválasztó `Tabulátor`. Az ékezetek szépen jelennek meg; ha kérdőjeleket vagy fura jeleket látsz, rossz kódolást választottál, ezért nyisd meg újra.

Mentés: `Fájl` > `Mentés másként`, a név `mozi`, a formátum `.xlsx` (Excel) vagy `.ods` (LibreOffice), ahogyan a feladat kéri. A munkalap átnevezése: duplán kattintasz a lapfülre, és beírod, hogy `Jegyeladás`. A fejléccellákba egyszerűen beírod a szöveget.

## 4. lépés: bevétel

A bevétel a jegyár és az eladott jegyek szorzata. Az `E2` cellába:

`=C2*D2`

Az `E2` cella kitöltőnégyzetét lehúzod az `E7` cellaig (vagy duplán kattintasz rá). A relatív hivatkozás miatt az `E3` képlete `=C3*D3` lesz, és így tovább. Az eredményben `E2` = 404 800.

## 5. lépés: népszerű vagy átlagos

Itt kell a `HA` függvény. A szerkezet: `HA(feltétel; ha_igaz; ha_hamis)`. Az `F2` cellába:

`=HA(D2>=150;"népszerű";"átlagos")`

Az eredmény a `Hold`-ra `népszerű`, az `Éjjel`-re `átlagos`. A szöveget idézőjelbe kell tenni. A „legalább 150” azt jelenti, hogy `>=`, és nem `>`.

## 6. lépés: összesítések

Az `A8:A11` cellákba beírod a megnevezéseket (`Összes jegy`, `Összes bevétel`, `Átlagos bevétel`, `Legnagyobb bevétel`), a `B8:B11` cellákba a képleteket:

- `=SZUM(D2:D7)` → 1107
- `=SZUM(E2:E7)` → 2 035 900
- `=ÁTLAG(E2:E7)` → 339 316,67 (az átlag nem egész szám; a formázás majd kerekíti a megjelenítést)
- `=MAX(E2:E7)` → 465 000

A tartományban ne szerepeljen az összesítő sor, különben körkörös hivatkozást kapsz, és ne szerepeljen benne a fejléc sem.

## 7–8. lépés: feltételes számolás

A thrillerek száma a `DARABTELI` (Excel) függvénnyel számolható; a LibreOffice-ban a neve `DARABHA`. A paraméterei: a vizsgált tartomány és a feltétel.

- Excel: `=DARABTELI(B2:B7;"thriller")` → 2
- LibreOffice: `=DARABHA(B2:B7;"thriller")` → 2

Az összbevétel a `SZUMHA` függvénnyel megy, mindkét programban: `SZUMHA(feltétel_tartomány; feltétel; összegzendő_tartomány)`.

`=SZUMHA(B2:B7;"thriller";E2:E7)` → 500 000 (304 000 + 196 000).

Jó szokás a feltételt külön cellába írni (például `B14` = `thriller`), és arra hivatkozni, így a képlet nem tartalmaz beégetett szöveget. A feltétel-tartományt és a számolt tartományt viszont fix kijelöléssel (`$`) érdemes megadni, ha lemásolod a képletet.

## 9. lépés: formázás

Jelöld ki az `E2:E7` tartományt, majd **Excel**: `Cellák formázása` (`Ctrl+1`) > `Szám` > `Egyéni`, kód: `# ##0 "Ft"`. **LibreOffice**: `Formátum` > `Cellák` > `Számok` > formátumkód: `# ##0 "Ft"`. A `Ft` az idézőjelben nem része a számnak, csak a megjelenést adja. A fejlécre: félkövér, `Szegély`, `Háttérszín` szürke. A formázás nem változtatja meg a cella értékét.

## 10. lépés: rendezés

Jelölj ki egy cellát az adatok között (az `E` oszlopban), és válaszd: **Excel** `Adat` > `Rendezés`; **LibreOffice** `Adatok` > `Rendezés`. Legyen a rendezési kulcs az `E` oszlop (`Bevétel (Ft)`), sorrendje csökkenő, és legyen bejelölve, hogy az adatok **fejlécet tartalmaznak**. Az eredmény első sora a `Mese` (465 000), az utolsó az `Éjjel` (196 000). A rendezés után ellenőrizd, hogy az összesítő sorok (`A8:B11`) nem keveredtek bele: a rendezett tartomány csak az `A1:F7`.

## 11. lépés: diagram

Jelöld ki az `A1:A7` és az `E1:E7` tartományt (`Ctrl`-lal), és készíts csoportos oszlopdiagramot. Add meg a címet (`Heti bevétel`), a függőleges tengely címét (`Bevétel (Ft)`), és töröld a jelmagyarázatot. Ha több adatsor kerülne a diagramra, az `Adatsor` kiválasztását ellenőrizd.

## Ellenőrző lista beadás előtt

- Minden szám képlettel számolt, nem begépelt érték.
- A mentett fájl neve és formátuma pontosan a kért.
- Mindenhol a feladat szó szerinti szövegét használtad (munkalap neve, címek).
- Nincs `#ÉRTÉK!`, `#HIV!` vagy `#NÉV?` hibaérték.
- A diagramon minden kért elem látszik, a nem kért nem.

## Gyakori hibák

- A szöveges forrást rossz kódolással nyitod meg, ezért az ékezetek elromlanak.
- Az összesítésnél a fejlécet vagy az összesítő cellát is belefoglalod a tartományba.
- A `HA` függvényben a szöveget idézőjel nélkül írod, vagy `>` jelet használsz a „legalább” helyett.
- A számformátumot úgy „készíted el”, hogy a szám után beírod a `Ft` szöveget a cellába: így a cella szöveg lesz, és nem lehet vele számolni.
- Rendezéskor csak egy oszlopot jelölsz ki, így az adatok sorai szétcsúsznak.

## Összefoglalás

A közép szintű táblázat-feladat sok kicsi lépés: importálás, képletek (`HA`, `SZUM`, `ÁTLAG`, `MAX`, `DARABTELI` / `DARABHA`, `SZUMHA`), formázás, rendezés és diagram. Mindig a teljes leírást olvasd el először, képletet írj, a feltételeket pontosan fordítsd le (`>=` a „legalább”), a végén pedig menj végig az ellenőrző listán.
