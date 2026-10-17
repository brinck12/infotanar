---
slug: csomopontok
title: Csomópontok és útvonalak
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az alakzat belseje

Eddig az alakzatot egyben kezelted: mozgattad, forgattad, színezted. Ez a lecke az alakzat **belsejébe** nyúl. Minden vektoros görbe vagy sokszög **csomópontokból** (node, horgonypont) és az őket összekötő **szakaszokból** áll. Ha a csomópontokat mozgatod, az alakzat formája változik. A követelmény szerint **emelt szinten** csomópontokat és csomópontműveleteket kell használnod az ábrakészítéshez. Ezzel olyan formákat is rajzolhatsz, amelyekhez nincs kész alakzat: szívet, levelet, hullámot, aláírást.

Az eszközöket Inkscape-ben mutatjuk (Csomópontszerkesztő, F2 vagy N), de a fogalmak a Draw, Illustrator és CorelDRAW programban is ugyanazok.

## Útvonal, csomópont, szakasz

Az **útvonal** (path) a vektorgrafika általános alakzata. Egy téglalap vagy ellipszis is lehet útvonal, de az alapalakzatot először **útvonallá kell alakítani** (Útvonal, Objektum útvonallá, Shift+Ctrl+C), ha csomópontjait szerkeszteni akarod. Utána az alakzat már nem "téglalap", hanem négy csomópontból álló útvonal.

Az útvonal lehet:

- **nyitott:** két végpontja van, nincsenek összekötve (vonal, hullám);
- **zárt:** a vége visszaér a kezdetre (belseje kitölthető).

Az útvonal két csomópontja közti **szakasz** lehet **egyenes** vagy **görbe**.

## Csomópontok típusai és a Bézier-görbe

A görbe szakaszokat **Bézier-görbék** írják le. Minden görbepontnak két **fogantyúja** (kontrollpont, vezérlő) van: ezek a pontból kinyúló vonalak, amelyek végét húzva a görbe formáját állítod. A fogantyú iránya a görbe érintőjét adja meg, a hossza pedig azt, hogy a görbe mennyire "húz" a pont felé.

Három fő csomóponttípus:

- **Sarokpont (éles, corner):** a két fogantyú **egymástól függetlenül** mozog. A görbe a ponton éles töréssel megy át. Például a szív alsó csúcsa.
- **Sima (smooth):** a két fogantyú egy egyenesben van, de hosszuk különbözhet. A görbe törés nélkül halad át.
- **Szimmetrikus (symmetric):** a két fogantyú egy egyenesben és azonos hosszú. Az átmenet mindkét oldalon tükörszerű.

Egyenes szakasz végén nincs fogantyú. Inkscape-ben a felső eszköztáron a csomópont típusát kattintással választod (Sarokpont, Sima, Szimmetrikus, Automatikus sima).

## Csomópontműveletek

A Csomópont eszközzel (N) a csomópontokra kattintva jelölheted ki őket (Shift: több). A fontosabb műveletek:

| Művelet | Mit csinál | Inkscape |
|---|---|---|
| Csomópont beszúrása | új pontot tesz két meglévő közé (a forma nem változik) | dupla kattintás az útvonalon, vagy Beszúrás gomb |
| Csomópont törlése | a pontot eltávolítja, a görbe a szomszédokhoz igazodik | Delete (Ctrl+Delete a forma megőrzésével) |
| Összekötés | két nyitott végpontot egyesít | Csomópontok összekötése |
| Szétválasztás (törés) | az útvonalat a ponton kettévágja | Útvonal törése a csomópontnál |
| Szakasz átalakítása | egyenesből görbe, görbéből egyenes | Szakasz egyenessé vagy görbévé |
| Típusváltás | sarok, sima, szimmetrikus | felső eszköztár |
| Útvonal zárása | a két végpont összekötésével zárt alakzat lesz | két végpont összekötése szakasszal |

A pontokat a nyíl billentyűkkel finoman, vagy a hozzájuk tartozó mezőkben (X, Y) pontosan is eltolhatod.

## Útvonal rajzolása

A **Bézier-eszköz** (B) kattintásokkal rajzol: minden kattintás egy sarokpontot tesz le, a szakaszok egyenesek. Ha kattintás helyett **lenyomva húzol**, a pont görbepont lesz, és a húzás irányából jön a fogantyú. A rajzolást az Enter, vagy az útvonal kezdőpontjára kattintás zárja (zárt alakzat).

A **szabadkézi** eszköz az egér mozgását követi, majd csomópontokra egyszerűsíti. Ennek eredménye általában túl sok csomópont, érdemes az Útvonal, Egyszerűsítés (Ctrl+L) paranccsal csökkenteni.

Jó útvonalban **kevés csomópont** van. Egy kör négy ponttal, egy hullám a hullámhegyeknél és -völgyeknél lévő pontokkal rajzolható. Ha túl sokat teszel, a görbe csálé lesz.

## Próbáld ki: szív rajzolása

1. Rajzolj egy négyzetet, forgasd el 45°-kal, majd alakítsd útvonallá.
2. Kapcsold be a csomópont eszközt. A négyzet négy sarokpontja van.
3. A bal felső és jobb felső szakaszt jelöld ki, és alakítsd **görbévé**. A felső két oldal húzással ívelhető.
4. Húzd ki a fogantyúkat úgy, hogy két "dombot" kapj. A legalsó pont maradjon sarokpont.
5. Töltsd ki pirossal. A kapott forma szív.

Ugyanezt halmazműveletekkel is megkaptad volna (két kör és egy négyzet unióját): a csomópontos megoldás pontosabb, kevesebb ponttal.

## Csomópont és halmazművelet együtt

A kettő jól kiegészíti egymást. A halmazművelet gyorsan készít összetett formát, a csomópontok finomítják. Tipikus munkamenet:

1. A halmazművelettel összerakod a nagy formát (unió, különbség).
2. A csomópont eszközzel kitörlöd a felesleges pontokat, kiigazítod a törést.
3. A színt, körvonalat az egész útvonalra állítod.

Egy útvonalnak lehet **több alútvonala** is (például a gyűrű két köre). Az **Útvonal, Összekapcsolás** (Ctrl+K) hozza létre, a **Szétválasztás** (Ctrl+Shift+K) bontja szét. A kitöltési szabály (páros-páratlan vagy nem nulla) dönti el, hogy a belső terület kilyukad-e.

## Gyakorold

1. Egy téglalapot szeretnél úgy módosítani, hogy az egyik sarka le legyen kerekítve. Mit teszel?

   *Megoldás:* Útvonallá alakítod, a csomópont eszközzel kijelölöd a sarok csomópontját, és a szakaszait görbévé alakítod, a fogantyúkat húzod. (Egyszerűbb a téglalap sarokkerekítése, de ez csak az összes sarokra hat.)

2. Mi a különbség a sarok- és a sima csomópont között?

   *Megoldás:* A sarokpont két fogantyúja független, a görbe élesen tör; a simánál a fogantyúk egy egyenesben vannak, a görbe törés nélkül halad át.

3. Hogyan készítesz zárt alakzatot egy nyitott vonalból?

   *Megoldás:* A két végpontot összekötöd (kijelölöd mindkettőt, Csomópontok összekötése), vagy a rajzolásnál az első pontra kattintasz.

4. Egy szabadkézi vonalnak százötven csomópontja van, és ormótlan. Mit teszel?

   *Megoldás:* Útvonal, Egyszerűsítés, majd a megmaradt pontokat kézzel igazítod.

## Gyakori hibák

- **Az alapalakzat útvonallá alakításának elfelejtése:** a Csomópont eszköz a téglalapnál csak a sarokkerekítő fogantyúkat mutatja.
- **Túl sok csomópont:** a görbe hullámos lesz, és nehéz szerkeszteni.
- **A fogantyúk összekeverése a csomópontokkal:** a fogantyú végének húzása a görbét formálja, nem mozgatja a pontot.
- **Rossz csomóponttípus:** sima pont ott, ahol törésnek kell lennie, vagy fordítva.
- **Nyitott útvonal kitöltése:** látszólag zárt, de a végpontok nincsenek összekötve; a kitöltés ilyenkor furcsa lehet, vagy nem látszik.
- **Törlés alakmegőrzés nélkül:** a Delete után a forma megváltozik; ha meg akarod tartani, Ctrl+Delete.
- **Halmazművelet után felejtett felesleges pont,** ami a körvonalon apró törést okoz.

## Összefoglalás

- Az útvonal csomópontokból és szakaszokból áll; lehet nyitott vagy zárt.
- Az alapalakzatot útvonallá kell alakítani a csomópontszerkesztéshez.
- A görbét a csomópontok fogantyúi alakítják (Bézier-görbe); típusai: sarok, sima, szimmetrikus.
- Csomópontműveletek: beszúrás, törlés, összekötés, szétválasztás, szakasz egyenes/görbe, típusváltás.
- Jó ábrában kevés, jól elhelyezett csomópont van.
- A halmazművelet és a csomópontszerkesztés kiegészítik egymást.

**Érettségi szint:** a csomópontok és csomópontműveletek használata **emelt szintű** követelmény. A feladat általában egy mintaábra elkészítése, ahol az alakzatokból halmazműveletekkel összerakott formát csomópontokkal kell finomítani. A központi kérdés mindig az: **melyik eszköz a legkevesebb lépésből eléri a kívánt formát.**
