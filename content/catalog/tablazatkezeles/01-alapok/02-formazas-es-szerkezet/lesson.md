---
slug: formazas-es-szerkezet
title: Formázás és szerkezet
position: 1
free: true
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (a tartomány elnevezése és a nevek használata képletben: emelt).*

## Miért formázunk?

A formázás nem szépségverseny: az érettségin pontosan megmondják, mit kell beállítani (például „a fejléc legyen félkövér, a cellák háttere szürke”). Ebben a leckében a cella- és karakterformázás, az egyesítés, az oszlopszélesség, a munkalap átnevezése és a tartományok elnevezése következik.

## Karakterformázás

A karakterek betűtípusát, méretét, stílusát (félkövér, dőlt, aláhúzott) és színét a kijelölt cellákra állítod be. **Excel**: `Kezdőlap` fül, `Betűtípus` csoport. **LibreOffice**: az eszköztár vagy `Formátum` > `Cellák...` > `Betűtípus` fül. Mindkét programban működik a `Ctrl+1` (Cellák formázása) is, itt egyszerre mindent beállíthatsz.

Példa a feladatszövegre: „A fejléc (A1:D1) legyen 12 pontos, félkövér, fehér betűszínű, sötétkék hátterű.” Lépések:

1. Kijelölöd az `A1:D1` tartományt (kattintás az A1-re, `Shift` + kattintás a D1-re).
2. Betűméret: 12; félkövér (`Ctrl+B`); betűszín: fehér.
3. Háttérszín: sötétkék. (A fehér betű csak sötét háttéren látszik.)

## Cellaformázás: igazítás, szegély, háttér

A `Cellák formázása` ablakban három fül kell:

- **Igazítás**: vízszintes (balra, középre, jobbra), függőleges, sortörés, szövegirány.
- **Szegély**: melyik oldalakra, milyen vonaltípussal és színnel.
- **Kitöltés** (Excel) / **Háttér** (LibreOffice): a cella háttérszíne vagy mintázata. Mintával kitöltésnél a minta és a minta színe külön állítható.

Szegélynél gyakori hiba, hogy csak a külső szegélyt állítod be, miközben a feladat „minden cella szegélyezett” kifejezést használ: ilyenkor a belső vonalak is kellenek.

## Sor- és oszlopbeállítások

**Oszlopszélesség**: a fejléc (A, B, C) két oszlopa közötti szegélyen duplán kattintasz, a program a legszélesebb tartalomhoz igazítja az oszlopot. Pontos értéket jobb gombbal adhatsz: `Oszlopszélesség...`. A **sormagasság** ugyanígy állítható. Ha a cellában `#####` látszik, az oszlop túl keskeny a szám megjelenítéséhez, ez nem hiba az adatban.

**Cellák egyesítése**: jelöld ki az `A1:D1` tartományt, majd **Excel**: `Kezdőlap` > `Egyesítés és középre`; **LibreOffice**: `Formátum` > `Cellák egyesítése` > `Cellák egyesítése`. Az egyesített cellában csak a bal felső cella tartalma marad meg. Címsorokra jó, de adattáblázat belsejében ne egyesíts: a rendezés és a szűrés nem működik rajta rendesen.

## Munkalap átnevezése

A lapfülre duplán kattintasz (vagy jobb gomb > `Átnevezés`), beírod az új nevet, `Enter`. A név nem tartalmazhat bizonyos jeleket (`/ \ ? * [ ]`, Excelben a `:` sem), és a képletekben így hivatkozol rá: `Árak!B2` (Excel) vagy `$Árak.B2` (LibreOffice). A lapfül jobb gombos menüjében színt is adhatsz a fülnek, másolhatod vagy áthelyezheted a lapot.

## Tartomány elnevezése (emelt szint)

Egy cellát vagy tartományt névvel is el lehet látni, és a képletben a név használható a cím helyett. A mintatáblázatban az `F1` cellában van az ÁFA-kulcs (`27%`).

| | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 1 | Termék | Nettó ár | Bruttó ár | | ÁFA-kulcs | 27% |
| 2 | Füzet | 250 | | | | |
| 3 | Toll | 180 | | | | |

Az `F1` elnevezése:

- **Excel**: kijelölöd az `F1`-et, a **Névmezőbe** (a szerkesztőléc bal oldalán lévő kis mező) beírod: `AFA`, `Enter`. Vagy: `Képletek` > `Név megadása`.
- **LibreOffice**: kijelölöd az `F1`-et, a Névmezőbe beírod: `AFA`, `Enter`. Vagy: `Beszúrás` > `Nevek` > `Megadás...` (`Ctrl+F3`).

Ezután a `C2` cellába ezt írhatod:

`=B2*(1+AFA)`

Eredmény a `C2`-ben: `317,5` (250 · 1,27). A név másoláskor nem változik, úgy viselkedik, mintha `$F$1` lenne, tehát a `C3`-ban is ugyanarra a cellára hivatkozik; ott az eredmény `228,6` (180 · 1,27).

A nevekre vonatkozó szabályok: betűvel kezdődik, nincs benne szóköz, nem lehet cellacím formájú (az `AB12` vagy a `K1` tilos), és a kis- és nagybetű nem számít. A tartománynevek (például `Pontok` a `C2:C9` tartományra) a függvényekben is használhatók: `=ÁTLAG(Pontok)`.

## Gyakorold

1. Állítsd a „Füzet” szöveget tartalmazó cella háttérszínét világoszöldre és a szegélyét „minden oldalon vékony vonal”-ra. Mely füleket használod a `Cellák formázása` ablakban?
2. Az `A1:D1` tartományt egyesítetted, de a B1-ben lévő szöveg eltűnt. Miért?
3. Nevezd el a `B2:B3` tartományt `Netto`-nak, és add meg az összegük képletét névvel. Mi az eredmény?
4. A cellában `#####` látszik. Mi a teendő?

**Megoldás**

- 1. Kitöltés (Excel) / Háttér (LibreOffice) a színhez, Szegély a vonalakhoz.
- 2. Egyesítéskor csak a bal felső cella (A1) tartalma marad meg.
- 3. Kijelölöd a `B2:B3`-at, a Névmezőbe beírod: `Netto`; a képlet: `=SZUM(Netto)`, az eredmény `430`.
- 4. Az oszlopot szélesebbre kell állítani (dupla kattintás az oszlopszegélyen).

## Gyakori hibák

- A tartománynevet szóközzel vagy cellacímmel próbálod megadni.
- Egyesített cellákat teszel az adattáblázatba, és később nem tudsz rendezni.
- A karakterformázás csak az első cellára kerül, mert nem jelölted ki az egész tartományt.
- A `#####` jelet adathibának hiszed, pedig csak az oszlopszélesség kevés.

## Összefoglalás

A formázás a megjelenést állítja: karakterek, igazítás, szegély, háttér, oszlopszélesség, egyesítés. A munkalap neve és a tartományok nevei segítik a tájékozódást és a képletek olvashatóságát. A tartomány elnevezése és a névvel való hivatkozás az emelt szint része, a többi közép szintű.
