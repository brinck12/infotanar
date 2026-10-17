---
slug: rendezes-es-szures
title: Rendezés és szűrés
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (rendezés, automatikus szűrő); emelt (irányított szűrés, kigyűjtés más helyre).*

## Az adattábla szabályai

A rendezés és a szűrés egy **összefüggő adattáblán** működik jól: az első sorban fejlécek vannak, alatta egy sor egy rekord (például egy diák), egy oszlop egy mező. Ne legyen benne teljesen üres sor vagy oszlop, mert a program ott „levágja” a táblázatot, és csak egy részét rendezi. Ne legyen egyesített cella az adatok között.

A mintatáblázat az előző leckék pontszámai (`A1:C9`):

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

## Rendezés egy szempont szerint

Kattints az adattáblán belül egy cellára (nem kell kijelölni az egészet), majd:

- **Excel**: `Adatok` > `Rendezés`, vagy `Kezdőlap` > `Rendezés és szűrés`.
- **LibreOffice**: `Adatok` > `Rendezés...`.

A párbeszédablakban megadod az oszlopot és az irányt (növekvő: A–Z, 0–9; csökkenő: Z–A, 9–0). Figyelj a „**Az adatok fejlécet tartalmaznak**” jelölőnégyzetre (Excel: `Az adataim fejlécet tartalmaznak`; LibreOffice: `A tartomány oszlopcímkéket tartalmaz`): ha be van jelölve, az első sor nem keveredik az adatok közé.

Ha csak a `Pont` oszlop szerint rendezel csökkenően, az eredmény:

| Név | Osztály | Pont |
|---|---|---|
| Csilla | 11.A | 48 |
| Hanna | 11.B | 44 |
| Anna | 11.A | 42 |
| Feri | 11.B | 40 |
| Emma | 11.A | 37 |
| Bence | 11.B | 35 |
| Dávid | 11.B | 29 |
| Gréta | 11.A | |

A rendezés a **teljes sort** mozgatja, nem csak az egy oszlopot: a nevek követik a pontszámokat. Az üres cella a végére kerül, akár növekvő, akár csökkenő a sorrend. Ha véletlenül csak egy oszlopot jelöltél ki, a program rákérdez, hogy kiterjessze-e a kijelölést; válaszd azt, hogy kiterjeszti.

## Rendezés több szempont szerint

A második szempont az első egyenlőségeit dönti el. Rendezzük **Osztály** szerint növekvően, azon belül **Pont** szerint csökkenően. Az ablakban az első szintnél az `Osztály`, az `Szint hozzáadása` (Excel) vagy a `Beállítások` fülön a második kulcsnál a `Pont`. Az eredmény:

| Név | Osztály | Pont |
|---|---|---|
| Csilla | 11.A | 48 |
| Anna | 11.A | 42 |
| Emma | 11.A | 37 |
| Gréta | 11.A | |
| Hanna | 11.B | 44 |
| Feri | 11.B | 40 |
| Bence | 11.B | 35 |
| Dávid | 11.B | 29 |

Három szempontot is megadhatsz. A szempontok sorrendje számít: a legfontosabb legyen az első.

Saját sorrend (például hétfő, kedd, szerda…) is lehet: Excelben a rendezésnél a `Sorrend` listából az `Egyéni lista`, LibreOfficeban a `Beállítások` fülön az `Egyéni rendezési sorrend` választható.

## Automatikus szűrő

A szűrő elrejti azokat a sorokat, amelyek nem felelnek meg a feltételnek, az adatok nem törlődnek. Bekapcsolása: kattints az adattáblán belülre, majd **Excel**: `Adatok` > `Szűrő`; **LibreOffice**: `Adatok` > `Automatikus szűrő`. Mindkét programban a `Ctrl+Shift+L` is működik. A fejlécekben kis nyilak jelennek meg.

- A `Osztály` oszlop nyilában kiválasztod: `11.A` → csak a négy 11.A-s sor látszik.
- A `Pont` nyilában számszűrő: „nagyobb vagy egyenlő” → `40`.

Ha egyszerre két oszlopra szűrsz, a feltételek **ÉS** kapcsolatban vannak: `Osztály = 11.A` és `Pont >= 40`. Az eredmény Anna (42) és Csilla (48). A szűrt sorok sorszáma kék (Excel), vagy kimaradnak a számok (LibreOffice), így látod, hogy sorok vannak elrejtve. A szűrést a `Szűrő törlése` paranccsal töröld, a nyilak eltüntetéséhez kapcsold ki a szűrőt.

Fontos: a szűrt táblázatból a másolás csak a látható sorokat viszi át, és a SZUM a rejtett sorokat is beleszámolja. Ha csak a láthatókat kell összegezni, a `RÉSZÖSSZEG` (SUBTOTAL) függvény kell: a `=RÉSZÖSSZEG(109;C2:C9)` a látható sorok összegét adja.

## Irányított szűrés és kigyűjtés (emelt szint)

Az automatikus szűrő a helyén szűr, az irányított szűrés (más néven speciális szűrő) az eredményt **más helyre is kimásolja** (kigyűjtés), és összetett feltételeket enged. Szükséged van egy **feltételtartományra**: a feltételtábla első sora a fejlécnév, alatta a feltételek.

| | E | F |
|---|---|---|
| 1 | Osztály | Pont |
| 2 | 11.A | >=40 |

A azonos sorban lévő feltételek ÉS kapcsolatúak, a külön sorokban lévők VAGY kapcsolatúak.

- **Excel**: `Adatok` > `Speciális` (Rendezés és szűrés csoport). Beállítod: `Másolás más helyre`, `Lista tartománya`: `A1:C9`, `Szűrőfeltételek tartománya`: `E1:F2`, `Hová másolja`: például `H1`.
- **LibreOffice**: `Adatok` > `További szűrők` > `Speciális szűrő...`, kijelölöd a feltételtartományt, majd a `Beállítások` alatt az `Eredmény másolása ide` mezőbe beírod a célt (`$Munka.$H$1`).

Az eredmény a `H1` cellától:

| Név | Osztály | Pont |
|---|---|---|
| Anna | 11.A | 42 |
| Csilla | 11.A | 48 |

Ha a feltétel VAGY kapcsolatú lenne (`Osztály = 11.A` **vagy** `Pont >= 40`), akkor a feltételeket külön sorba írod: `E2` = `11.A`, `F3` = `>=40`, és a feltételtartomány `E1:F3`.

## Gyakorold

1. Rendezd a táblázatot név szerint ábécé szerint csökkenően. Ki kerül az első helyre?
2. Rendezd Pont szerint csökkenően, azon belül osztály szerint növekvően. Miért kevés ez az osztályonkénti rangsorhoz?
3. Szűrd ki azokat, akik 11.B-sek és legalább 40 pontosak. Kik látszanak?
4. Egy szűrt táblázatban a `=SZUM(C2:C9)` összeget ad. Miért nem a látható sorokét, és mivel javítod?

**Megoldás**

- 1. Hanna kerül az első helyre (a név szerinti ábécé végén áll).
- 2. A pontszám egyedi, így a második szempont alig számít; osztályonként rangsorolni az első szempont az osztály, a második a pont kell, hogy legyen.
- 3. Feri (40) és Hanna (44).
- 4. A SZUM a rejtett sorokat is összeadja; a `=RÉSZÖSSZEG(109;C2:C9)` csak a láthatókat.

## Gyakori hibák

- Üres sor van az adattáblában, ezért a program csak egy részét rendezi.
- Csak egy oszlopot rendezel, és az adatok szétcsúsznak egymástól.
- A fejlécsort is rendezésbe vonod, mert a jelölőnégyzet nincs bejelölve.
- Az irányított szűrésnél a feltételtartomány fejléce nem azonos az adattábla fejlécével.
- A szűrést kikapcsolod, és azt hiszed, hogy az adatok törlődtek (nem, csak rejtve voltak).

## Összefoglalás

A rendezés a sorok sorrendjét változtatja, több szempontnál a sorrend számít. Az automatikus szűrő a feltételnek nem megfelelő sorokat elrejti. Az irányított szűrés külön feltételtartománnyal dolgozik, és az eredményt más helyre is kigyűjtheti. A rendezés és az automatikus szűrő közép szintű, az irányított szűrés emelt szintű anyag.
