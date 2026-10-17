---
slug: nevek-es-munkalap-beallitasok
title: Nevek és munkalap-beállítások
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (élőfej, élőláb, oldalbeállítás); emelt (elnevezett tartományok használata képletben, nyomtatás PDF-be adott feltételek szerint).*

## Elnevezett tartományok a képletekben (emelt szint)

Az előző leckékben láttad a tartomány elnevezésének alapját. Itt a hasznát nézzük meg: a nevek olvashatóbbá teszik a képleteket, és nem csúsznak el másoláskor. Mintatáblázat a pontszámokkal (`A1:C9`, fejléc az 1. sorban):

| Név | Osztály | Pont |
|---|---|---|
| Anna | 11.A | 42 |
| Bence | 11.B | 35 |
| Csilla | 11.A | 48 |
| Dávid | 11.B | 29 |
| Emma | 11.A | 37 |
| Feri | 11.B | 40 |
| Gréta | 11.A | |
| Hanna | 11.B | 44 |

Elnevezzük két tartományt: a `B2:B9` neve legyen `Osztalyok`, a `C2:C9` neve legyen `Pontok`. A Névmezőbe (a szerkesztőléc bal oldalán) írod a nevet a tartomány kijelölése után, `Enter`. Vagy: **Excel**: `Képletek` > `Név megadása` / `Névkezelő`; **LibreOffice**: `Beszúrás` > `Nevek` > `Megadás...` (`Ctrl+F3`). Kijelölés után a **Létrehozás** (Excel: `Kijelölésből létrehozás`; `Ctrl+Shift+F3`) a fejléc szövegéből is csinál nevet, ezért a fejléc legyen szabálykövető (szóköz és ékezet nélkül, ha lehet).

Ezután:

| Képlet | Eredmény |
|---|---|
| `=ÁTLAG(Pontok)` | `39,2857...` |
| `=MAX(Pontok)` | `48` |
| `=SZUMHA(Osztalyok;"11.A";Pontok)` | `127` |
| `=DARABTELI(Pontok;">=40")` | `4` |

A `Pontok` név abszolút hivatkozásként viselkedik: a képletet bárhová másolhatod, a név ugyanazt a tartományt jelenti. Ha a tartomány bővül, a nevet egyszer kell átírni (`Névkezelő`), nem minden képletet.

Egy cellát is elnevezhetsz állandóként: ha a `F1` cellát `Hatar`-nak nevezed, és benne `40` áll, akkor a képlet `=HA(C2>=Hatar;"megfelelt";"nem felelt meg")` olvasható, és a határ módosítása egy helyen történik.

Szabályok: a név betűvel vagy aláhúzással kezdődik, nem tartalmazhat szóközt, és nem lehet cellacím (nem jó: `K1`, `AB12`). A nevek hatóköre lehet az egész munkafüzet vagy egy munkalap; az érettségin általában az egész munkafüzet a jó.

## Oldalbeállítás

A nyomtatás előtt az oldalt be kell állítani. Elérés: **Excel**: `Lapelrendezés` > `Oldalbeállítás` (a csoport jobb alsó nyila); **LibreOffice**: `Formátum` > `Oldal...` (`Oldalstílus`). A fontosabb beállítások:

- **Tájolás**: álló vagy fekvő. Széles táblázathoz fekvő kell.
- **Papírméret**: általában A4.
- **Margók**: felső, alsó, bal, jobb. Itt kérhetsz **vízszintes középre igazítást** az oldalon.
- **Méretezés**: egy oldalra illesztés. Excel: `Oldalbeállítás` > `Lap` fül > `Igazítás` > `1` oldal szélesen, `1` oldal magasan (vagy `Lapelrendezés` > `Méretezés`); LibreOffice: `Lap` fül > `Skála mód` > `Nyomtatási tartomány igazítása szélességre/magasságra`.
- **Nyomtatási terület**: csak egy tartomány nyomtatódik. Excel: `Lapelrendezés` > `Nyomtatási terület` > `Nyomtatási terület kijelölése`; LibreOffice: `Formátum` > `Nyomtatási tartományok` > `Meghatározás`.
- **Ismétlődő sorok**: a fejléc minden oldalon megjelenik. Excel: `Nyomtatási címek` > `Ismétlődő sorok`: `$1:$1`; LibreOffice: `Lap` fül vagy `Formátum` > `Nyomtatási tartományok` > `Szerkesztés` > `Ismétlendő sorok`.
- **Rácsvonalak és sor/oszlopfejlécek** nyomtatása: kapcsolható.

## Élőfej és élőláb

Az **élőfej** az oldal tetején, az **élőláb** az alján ismétlődő szöveg. Tipikus feladatszöveg: „Az élőfejbe, középre írd a saját neved, az élőláb jobb oldalán legyen az oldalszám.”

- **Excel**: `Beszúrás` > `Élőfej és élőláb`; a lap tetején három mező (bal, közép, jobb) jelenik meg, bele lehet írni. Az `Élőfej és élőláb eszközök` fülön az `Oldalszám`, `Oldalak száma`, `Aktuális dátum`, `Fájlnév` elemek szúrhatók be.
- **LibreOffice**: `Beszúrás` > `Élőfej és élőláb` > `Alapértelmezett oldalstílus` > `Élőfej` / `Élőláb`; a `Formátum` > `Oldal...` > `Élőfej` fülön a `Szerkesztés...` gomb nyitja meg a bal, közép, jobb szövegmezőket; az oldalszámot a `Mezők` közül illeszted be.

Elvárt eredmény például: „Kovács Anna” középen, és az oldalszám a jobb alsó sarokban (`1. oldal`).

## Nyomtatás PDF-be

Emelt szinten előfordul, hogy a táblázatot **adott feltételek szerint fájlba kell nyomtatni**: PDF formátumban, meghatározott nyomtatási területtel, fekvő tájolással, egy oldalra illesztve.

- **Excel**: `Fájl` > `Exportálás` > `PDF/XPS-dokumentum létrehozása`, vagy `Fájl` > `Mentés másként` > `Típus: PDF`. A `Beállítások...` gombnál választhatod: aktív lap, kijelölés, egész munkafüzet.
- **LibreOffice**: `Fájl` > `Exportálás PDF-ként...`; a `Tartomány` résznél az oldalak, a kijelölés vagy az egész dokumentum választható.

Mentés előtt nézd meg a **nyomtatási képet** (`Fájl` > `Nyomtatás` előnézet): ott látod, hogy a táblázat egy oldalra kerül-e, és az élőfej, élőláb rendben van-e. A fájl nevét és helyét a feladat megadja; a hibás név vagy hely pontvesztést jelent.

## Gyakorold

1. Nevezd el a `C2:C9` tartományt `Pontok`-nak, és írd meg a legnagyobb pontszám képletét névvel. Mit ad?
2. Írd meg a 11.B osztályú diákok átlagát névvel (a `Osztalyok`, `Pontok` nevek ismertek). Mennyi az eredmény?
3. Sorolj fel három beállítást, amellyel egy széles táblázat egy A4-es oldalra kerül.
4. Hová állítod be, hogy a fejléc minden nyomtatott oldalon megjelenjen?

**Megoldás**

- 1. `=MAX(Pontok)` → `48`.
- 2. `=ÁTLAGHA(Osztalyok;"11.B";Pontok)` → `37` (148 / 4).
- 3. Fekvő tájolás; méretezés egy oldal szélesre és magasra; kisebb margók (vagy nyomtatási terület szűkítése).
- 4. Az `Ismétlődő sorok` (Nyomtatási címek) közé az `$1:$1` sort.

## Gyakori hibák

- A nevet szóközzel vagy cellacímmel próbálod megadni.
- A név a rossz tartományra mutat, mert elcsúszott a kijelölés.
- Élőfejbe írod, ami az élőlábba való (vagy a megadott oldalra: bal, közép, jobb).
- A PDF-be nyomtatás előtt nem nézed meg az előnézetet, és a táblázat két oldalra tördelődik.
- A nyomtatási terület üresen marad, és az egész munkalap nyomtatódik.

## Összefoglalás

Az elnevezett tartományok olvashatóbbá és biztosabbá teszik a képleteket. Az oldalbeállítás, az élőfej és élőláb a nyomtatás előkészítése, a PDF-be nyomtatás pedig a kész táblázat fájlba mentése. A nevek képletben való használata és a feltételek szerinti PDF-nyomtatás emelt szintű, az oldalbeállítás és az élőfej, élőláb közép szintű anyag.
