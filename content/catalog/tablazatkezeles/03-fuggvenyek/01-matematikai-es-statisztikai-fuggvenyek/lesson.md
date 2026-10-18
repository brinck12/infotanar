---
slug: matematikai-es-statisztikai-fuggvenyek
title: Matematikai és statisztikai függvények
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (a feltételes összegzés és számlálás gyakori az emelt feladatokban is).*

## A függvény felépítése

A függvény egy kész számítási recept. Neve van, utána zárójelben az **argumentumok** állnak pontosvesszővel elválasztva: `=SZUM(C2:C9)`. Az argumentum lehet szám, cella, tartomány vagy másik függvény. Függvényt begépelhetsz, vagy a `Függvény beszúrása` gombbal (`fx` a szerkesztőléc mellett) választhatod ki, és a párbeszédablak megmutatja az argumentumok sorrendjét.

A függvények magyar nevét használjuk, és mellé zárójelben az angol megfelelőt is megtanulod, mert a nemzetközi anyagokban azt látod. A megnyitott fájl nyelvétől függetlenül a program a saját nyelvén mutatja a függvényneveket.

## A mintatáblázat

Egy témazáró pontszámai. A `Gréta` pontszáma hiányzik (hiányzott a dolgozatról), a `C8` cella üres.

| | A | B | C |
|---|---|---|---|
| 1 | Név | Osztály | Pont |
| 2 | Anna | 11.A | 42 |
| 3 | Bence | 11.B | 35 |
| 4 | Csilla | 11.A | 48 |
| 5 | Dávid | 11.B | 29 |
| 6 | Emma | 11.A | 37 |
| 7 | Feri | 11.B | 40 |
| 8 | Gréta | 11.A | |
| 9 | Hanna | 11.B | 44 |

## Összegzés, átlag, szélsőérték

| Képlet | Mit számol? | Eredmény |
|---|---|---|
| `=SZUM(C2:C9)` (SUM) | összeg | `275` |
| `=ÁTLAG(C2:C9)` (AVERAGE) | átlag | `39,2857...` (7 számból) |
| `=MIN(C2:C9)` | legkisebb | `29` |
| `=MAX(C2:C9)` | legnagyobb | `48` |

Az `ÁTLAG` az **üres cellát kihagyja**, ezért 275-öt 7-tel osztja, nem 8-cal. Ha az üres cellát nullának akarod számítani, a nullát be kell írni.

## Darabszámok

| Képlet | Mit számol? | Eredmény |
|---|---|---|
| `=DARAB(C2:C9)` (COUNT) | a **számokat** tartalmazó cellák | `7` |
| `=DARAB2(A2:A9)` (COUNTA) | a **nem üres** cellák | `8` |
| `=DARAB2(C2:C9)` | a nem üres cellák a pontoknál | `7` |
| `=DARABÜRES(C2:C9)` (COUNTBLANK) | az üres cellák | `1` |

A különbség: a `DARAB` csak számot számlál, a `DARAB2` mindent, ami nem üres (szöveget is). A nevek megszámlálására tehát a `DARAB2` való, a pontok megszámlálására a `DARAB`.

## Feltételes számlálás és összegzés

Sokszor nem az egész tartományra, csak a feltételnek megfelelő cellákra van szükség.

**DARABTELI** (COUNTIF): hány cella felel meg a feltételnek. Szerkezete: `=DARABTELI(tartomány; feltétel)`.

- `=DARABTELI(B2:B9;"11.A")` → `4` (négy 11.A-s diák, Gréta is).
- `=DARABTELI(C2:C9;">=40")` → `4` (Anna 42, Csilla 48, Feri 40, Hanna 44).

A feltétel idézőjelben áll, ha szöveg vagy összehasonlító jel szerepel benne (`">=40"`, `"<>11.A"`). Cellára is hivatkozhatsz: `=DARABTELI(B2:B9;E1)`, ha az `E1`-ben a `11.A` szöveg áll.

**SZUMHA** (SUMIF): összeg a feltételnek megfelelő sorokból. Szerkezete: `=SZUMHA(feltételtartomány; feltétel; összegtartomány)`.

- `=SZUMHA(B2:B9;"11.A";C2:C9)` → `127` (42 + 48 + 37; Gréta cellája üres).

**ÁTLAGHA** (AVERAGEIF): ugyanilyen, de átlagot ad.

- `=ÁTLAGHA(B2:B9;"11.A";C2:C9)` → `42,3333...` (127 / 3, az üres cella kimarad).

Fontos a sorrend: a `SZUMHA` és az `ÁTLAGHA` **első** argumentuma az a tartomány, amelyben a feltételt vizsgálod, az **utolsó** az, amelyet összegzel.

## Kerekítés

A **KEREKÍTÉS** (ROUND) függvény megváltoztatja magát az értéket, nem csak a megjelenést. Szerkezete: `=KEREKÍTÉS(szám; hány_tizedes)`.

- `=KEREKÍTÉS(ÁTLAG(C2:C9);1)` → `39,3`
- `=KEREKÍTÉS(ÁTLAG(C2:C9);0)` → `39`
- `=KEREKÍTÉS(1234;-2)` → `1200` (negatív szám a tízesekre, százasokra kerekít)

Rokon függvények: `KEREK.FEL` (ROUNDUP) mindig felfelé, `KEREK.LE` (ROUNDDOWN) mindig lefelé kerekít, az egész részt az `EGÉSZ` (INT) adja. Ha a feladat „kerekítse egészre”, használd a KEREKÍTÉS függvényt, ne a tizedesjegyek csökkentését.

## Gyakorold

1. Írd meg a képletet, amely megadja, hányan kaptak legalább 40 pontot az egész csoportban. Mi az eredmény?
2. Add meg a 11.B osztály pontjainak összegét. Mekkora?
3. Mi a különbség a `=DARAB(A2:A9)` és a `=DARAB2(A2:A9)` eredménye között?
4. Az átlagot egy tizedesre kerekítve írd ki egy képlettel úgy, hogy a kerekítés az értéket is érintse.

**Megoldás**

- 1. `=DARABTELI(C2:C9;">=40")` → `4`.
- 2. `=SZUMHA(B2:B9;"11.B";C2:C9)` → `35 + 29 + 40 + 44 = 148`.
- 3. A `DARAB` szöveget nem számlál, ezért `0`; a `DARAB2` az összes nem üres cellát, ezért `8`.
- 4. `=KEREKÍTÉS(ÁTLAG(C2:C9);1)` → `39,3`.

## Gyakori hibák

- A `SZUMHA` argumentumainak sorrendjét felcseréled.
- A feltételt idézőjel nélkül írod, ha összehasonlító jel van benne.
- A `DARAB`-ot használod szövegeknél, és nullát kapsz.
- A kerekítést csak a tizedesjegyek csökkentésével oldod meg, és a további számolás a kerekítetlen értéket használja.
- Az átlagba az üres és a nulla cellát összekevered: a nulla beleszámít az átlagba, az üres nem.

## Összefoglalás

A SZUM, ÁTLAG, MIN, MAX az összesítés alapjai, a DARAB és DARAB2 más-más cellákat számlál. A DARABTELI, SZUMHA, ÁTLAGHA feltételes változatok, a KEREKÍTÉS pedig az értéket kerekíti. Az összes itt szereplő függvény közép szinten elvárt, az emelt feladatokban kombinálva szerepelnek.
