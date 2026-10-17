---
slug: vektoralakzatok-es-halmazmuveletek
title: Vektoralakzatok és halmazműveletek
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Ábrák alakzatokból

A vektorgrafikus ábra alakzatokból épül: téglalapokból, ellipszisekből, sokszögekből, vonalakból. A követelmény szerint tudnod kell alakzatot rajzolni, javítani, módosítani, transzformálni, a méretét, szegélyét, kitöltését, feliratát és átlátszóságát állítani, az alakzatokat csoportosítani, igazítani, elosztani, **emelt szinten pedig halmazműveleteket végezni velük**. A leckében Inkscape-et használunk példának, de az irodai programok (LibreOffice Draw, Word, Impress) alakzatai ugyanígy működnek.

## Alakzat rajzolása és kijelölése

Az eszköztárból válaszd ki az alakzatot (téglalap, ellipszis, sokszög, csillag, vonal), és húzással rajzold meg. Néhány hasznos trükk:

- **Shift** nyomva: a téglalapból négyzet, az ellipszisből kör lesz.
- **Ctrl** nyomva (Inkscape-ben): egész számú arány vagy rögzített szög.
- A **kijelölés** eszközzel (nyíl) kattintva az alakzatot kijelölöd. Több alakzat kijelölése: Shift+kattintás, vagy kijelölő téglalap húzása.

Az alakzat kijelölve nyolc fogantyút mutat a sarkain és az oldalain. A sarkokat húzva méretezel, a középsőket húzva egy irányba nyújtasz. A **Shift** lenyomásával a méretezés a középpont körül történik, a **Ctrl** lenyomásával az arány megmarad.

## Tulajdonságok

Minden alakzatnak három fő tulajdonsága van:

- **Kitöltés (fill):** az alakzat belsejének színe, színátmenet vagy minta. Lehet "nincs kitöltés" is.
- **Körvonal (stroke, szegély):** színe, vastagsága, mintája (folytonos, szaggatott, pontozott), a vonalvégek formája.
- **Átlátszóság (opacity):** 0–100%. A teljes alakzatra vonatkozik, vagy külön a kitöltésre és a körvonalra.

Inkscape-ben: Objektum, **Kitöltés és körvonal** (Ctrl+Shift+F). Irodai programban: jobb gombbal Alakzat formázása.

**Méret és hely:** pontos értéket a felső eszköztáron (X, Y, Sz, M mezők) vagy a Transzformálás ablakban adhatsz meg. A mértékegység (mm, px, cm) feladatban fontos, ügyelj rá.

**Felirat:** az alakzatba a szövegeszközzel vagy dupla kattintással írhatsz szöveget. Irodai programban a felirat az alakzat része, vektoros programban gyakran külön szövegobjektum, amit az alakzathoz igazítasz.

## Transzformálás

A követelmény három transzformációt nevez meg:

- **Elforgatás:** szögben, a középpont (vagy más pont) körül. A kijelölt alakzaton második kattintásra a forgató fogantyúk jelennek meg; pontos szöget a Transzformálás ablakban adhatsz meg (Objektum, Transzformálás, Forgatás).
- **Tükrözés:** vízszintes vagy függőleges (H és V billentyű Inkscape-ben).
- **Nyírás (dőlés, skew):** az alakzat egyik oldalát eltolja, a téglalapból paralelogramma lesz. Szögben vagy távolságban adható meg.

Ezek az alakzat **alakját** változtatják, a tartalmat (kitöltés, körvonal) nem.

## Próbáld ki: egy egyszerű jel

1. Rajzolj egy 60 × 60 mm-es négyzetet kék kitöltéssel, fekete körvonallal.
2. Másold (Ctrl+D duplikál), és forgasd el 45°-kal.
3. Mindkettő kijelölve igazítsd őket vízszintesen és függőlegesen középre (Objektum, Igazítás és elosztás). Nyolcágú csillagot kaptál.
4. Állítsd a felső alakzat átlátszóságát 50%-ra, és figyeld meg az átfedést.

## Csoportosítás, sorrend, igazítás

Több alakzatból álló ábrát érdemes **csoportba foglalni** (Ctrl+G). A csoport úgy mozog, méreteződik és forog, mint egyetlen alakzat; a csoportbontással (Ctrl+Shift+G) újra különválnak. Egy csoport belsejébe kettős kattintással léphetsz be.

A **sorrend (z-sorrend)** adja meg, melyik alakzat takarja a másikat: előre hozás (Home), hátra küldés (End), eggyel előre (Page Up), eggyel hátra (Page Down).

Az **igazítás** több alakzat közös vonalra hozását jelenti (balra, jobbra, középre, felülre, alulra), az **elosztás** pedig azonos távolságot hoz létre köztük. Mindkettőhöz legalább két (elosztáshoz három) alakzat kijelölése kell. Soha ne a szemedre hagyatkozz: az igazítást eszközzel végezd. Segít még a rács és a segédvonalak, valamint a **illesztés** (snap), ami a mozgatott alakzatot a rácshoz vagy egy másik alakzat széléhez igazítja.

## Halmazműveletek

Az alakzatokat úgy is kezelheted, mintha ponthalmazok lennének. A **halmazművelet** két (vagy több) átfedő alakzatból új alakzatot készít. Inkscape-ben az **Útvonal** menüben találod; Draw-ban a Forma menü; Illustratorban a Pathfinder. Négy alapművelet van:

| Művelet | Eredmény | Szokásos jelölés |
|---|---|---|
| Egyesítés (unió) | a két alakzat területe együtt | Útvonal, Unió |
| Különbség | az alsó alakzatból kivonódik a felső | Útvonal, Különbség |
| Metszet | csak a közös rész marad | Útvonal, Metszet |
| Kizáró vagy (XOR) | ami csak az egyikben van, a közös rész eltűnik | Útvonal, Kizáró vagy |

Fontos: a **különbségnél a sorrend számít**. Az Inkscape-ben az alsó alakzatból a felső levonódik. Ha fordított az eredmény, küldd hátra vagy előre az egyik alakzatot.

Mire jó ez? Példák:

- **Holdsarló:** nagy körből kivonsz egy kicsit (különbség).
- **Fogaskerék vagy kulcslyuk:** körből kivonod a téglalapot és a kisebb kört.
- **Szív:** két kör és egy elforgatott négyzet egyesítése.
- **Lencse:** két kör metszete.

A halmazművelet után az eredmény egyetlen **útvonal**, amelynek csomópontjait már szerkesztheted (lásd a következő leckét), de az eredeti alakzatok már nem külön vannak.

## Próbáld ki: holdsarló és lencse

1. Rajzolj két, azonos méretű kört, és tedd át egymáson, kissé eltolva. Mentsd el másolatban.
2. Jelöld ki mindkettőt, és válaszd az Útvonal, Metszet parancsot. Lencsét kapsz.
3. Visszavonás után alkalmazd a Különbség parancsot. Holdsarlót kapsz. Cseréld meg a sorrendet (a másik kör kerüljön felülre), és nézd meg, mi változik.
4. Végül próbáld ki az Unió és a Kizáró vagy műveletet is.

## Gyakorold

1. Feladat leírása: "Készíts gyűrűt: egy 40 mm átmérőjű körből vond ki a közepére illesztett 30 mm átmérőjű kört." Milyen lépések kellenek?

   *Megoldás:* Két kör rajzolása a megadott méretekben, igazítás középre, a kisebbet előre hozva a Különbség művelet.

2. Hogyan készítesz két alakzatból olyat, amelyiknek csak a közös területe marad meg?

   *Megoldás:* Metszet.

3. Egy ábra három alakzatát együtt kell másolni, nyújtani, forgatni. Mit tegyél először?

   *Megoldás:* Csoportba foglalni (Ctrl+G).

4. Egy sor öt kört egyenlő közzel kell elhelyezni. Mit használsz?

   *Megoldás:* Az Igazítás és elosztás eszközt: előbb az első és az utolsó kört a helyére viszed, majd mind az ötöt kijelölve az elosztást alkalmazod.

## Gyakori hibák

- **Kézzel igazítás szemre:** a pixelnyi eltérés látszik. Használj igazítást és elosztást.
- **A halmazművelet sorrendjének figyelmen kívül hagyása:** a különbség eredménye fordított lesz. Ellenőrizd, melyik alakzat van felül.
- **Csoportosítás elfelejtése,** ezért a mozgatás szétcsúsztatja az ábrát.
- **A méretezés arányának elvesztése:** Ctrl vagy a lánc zárása nélkül az ábra torzul.
- **Átlátszóság és kitöltés összekeverése:** az objektum átlátszósága az egész alakzatot érinti, a kitöltés alfa csatornája csak a belsejét.
- **Halmazművelet előtti másolat hiánya:** utána az eredeti alakzatok már nem külön vannak. Duplikáld, ha még kellenek.
- **A szöveg is alakzat:** halmazművelet előtt a szöveget útvonallá kell alakítani (Útvonal, Objektum útvonallá).

## Összefoglalás

- A vektoros ábra alakzatokból áll; a kitöltés, körvonal és átlátszóság alakzatonként állítható.
- Transzformációk: forgatás, tükrözés, nyírás, méretezés; pontos érték megadható.
- A csoportosítás, az igazítás és az elosztás eszközzel történik, nem szemre.
- A sorrend határozza meg, melyik alakzat takar.
- Halmazműveletek: unió, különbség, metszet, kizáró vagy; a különbségnél a sorrend számít.

**Érettségi szint:** az alakzatok rajzolása, tulajdonságai, transzformálása, csoportosítása és igazítása **középszinten** követelmény. A **halmazműveletek emelt szintű** elem.
