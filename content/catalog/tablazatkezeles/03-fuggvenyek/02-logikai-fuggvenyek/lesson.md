---
slug: logikai-fuggvenyek
title: Logikai függvények
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (az egymásba ágyazott HA és az összetett feltételek: emelt feladatokban is gyakoriak).*

## Logikai érték és összehasonlítás

A logikai érték kétféle lehet: `IGAZ` (TRUE) vagy `HAMIS` (FALSE). Összehasonlító műveletekkel kapod: `=`, `<`, `>`, `<=`, `>=`, `<>` (nem egyenlő). Például, ha a `C2` értéke 42, akkor a `=C2>=40` képlet eredménye `IGAZ`, a `=C2=50` eredménye `HAMIS`. A szöveg összehasonlításánál a kis- és nagybetű nem számít, és idézőjelbe kell tenni: `=B2="11.A"`.

## A HA függvény

A **HA** (IF) függvény három argumentuma: `=HA(feltétel; ha_igaz; ha_hamis)`. A feltételtől függően az egyik vagy a másik eredményt adja.

A mintatáblázat az előző lecke pontszámait használja (A: Név, B: Osztály, C: Pont, a `D` oszlopba számolunk):

| Név | Osztály | Pont | `=HA(C2>=40;"megfelelt";"nem felelt meg")` |
|---|---|---|---|
| Anna | 11.A | 42 | megfelelt |
| Bence | 11.B | 35 | nem felelt meg |
| Csilla | 11.A | 48 | megfelelt |
| Dávid | 11.B | 29 | nem felelt meg |
| Emma | 11.A | 37 | nem felelt meg |
| Feri | 11.B | 40 | megfelelt |
| Hanna | 11.B | 44 | megfelelt |

A szöveges eredményt idézőjelbe kell tenni, a számot nem: `=HA(C2>=40;1;0)`. Az eredmény helyén másik képlet is állhat: `=HA(C2>=40;C2*2;C2)`.

Ha a cella üres (például Gréta pontszáma), az összehasonlításban nullának számít, ezért `=HA(C8>=40;"megfelelt";"nem felelt meg")` eredménye „nem felelt meg”. Ha ezt másképp akarod kezelni, külön ágat írsz: `=HA(C8="";"hiányzik";HA(C8>=40;"megfelelt";"nem felelt meg"))`, ez a „hiányzik” szöveget adja.

## ÉS, VAGY, NEM

Összetett feltételhez logikai függvényeket használsz:

- **ÉS** (AND): akkor `IGAZ`, ha **minden** feltétel igaz.
- **VAGY** (OR): akkor `IGAZ`, ha **legalább egy** feltétel igaz.
- **NEM** (NOT): megfordítja az értéket.

| Képlet (a 2. sorra) | Anna (11.A, 42) | Emma (11.A, 37) | Bence (11.B, 35) |
|---|---|---|---|
| `=ÉS(B2="11.A";C2>=40)` | IGAZ | HAMIS | HAMIS |
| `=VAGY(B2="11.A";C2>=40)` | IGAZ | IGAZ | HAMIS |
| `=NEM(B2="11.A")` | HAMIS | HAMIS | IGAZ |

A függvények a `HA` feltételében használhatók: `=HA(ÉS(B2="11.A";C2>=40);"jutalom";"")`. Ez Annánál a „jutalom” szöveget adja, Emmánál és Bencénél üres szöveget (két idézőjel egymás mellett: üres szöveg).

A `VAGY` tipikus alkalmazása a tartományon kívüli érték keresése: `=VAGY(C2>=45;C2<30)` Csillánál (48) `IGAZ`, Dávidnál (29) `IGAZ`, Annánál (42) `HAMIS`. Figyelj arra, hogy a „x és y közötti” feltétel mindig `ÉS`: `=ÉS(C2>=30;C2<45)`. A hétköznapi „vagy” és „és” sokszor félrevezet, ezért gondold végig a példán, hogy melyik kell.

## Egymásba ágyazott HA

Ha kettőnél több kimenet van, a `HA` hamis ágába újabb `HA` kerül. Osztályzat a pontszámból: 45 vagy több: 5; 38–44: 4; 30–37: 3; 20–29: 2; 20 alatt: 1. A képlet a `D2` cellában:

`=HA(C2>=45;5;HA(C2>=38;4;HA(C2>=30;3;HA(C2>=20;2;1))))`

A vizsgálat fentről lefelé halad, és az első igaz feltételnél megáll. Ezért a feltételeket szigorúan **sorrendben** kell megadni: nagyobbtól a kisebb felé. Az eredmény:

| Név | Pont | Jegy |
|---|---|---|
| Anna | 42 | 4 |
| Bence | 35 | 3 |
| Csilla | 48 | 5 |
| Dávid | 29 | 2 |
| Emma | 37 | 3 |
| Feri | 40 | 4 |
| Hanna | 44 | 4 |

Ellenőrizd Emmát: a 37 nem éri el a 45-öt, sem a 38-at, de eléri a 30-at, így a harmadik feltétel igaz: jegye 3. Ennél a megoldásnál minden `HA` után egy záró zárójel kell, tehát 4 `HA`-hoz 4 záró zárójel; a szerkesztőléc a zárójelpárokat színezi, ez segít az ellenőrzésben.

A sok ágú feltételre később a FKERES közelítő illesztése is megoldást ad, ott a határokat egy külön táblázatba írod.

## Gyakorold

1. Írj `HA` képletet, amely a `C2` pontszámra „átment” vagy „megbukott” szöveget ad, a határ 20 pont. Mi lesz Dávidnál (29)?
2. Írj képletet, amely akkor ad `IGAZ` értéket, ha a diák a 11.B osztályba jár **és** legalább 40 pontos. Melyik két diákra lesz igaz?
3. Írd meg a képletet, amely a `C2` pontszámra „kiváló” (45 vagy több), „jó” (38–44) vagy „gyenge” (38 alatt) szöveget ad. Mit ad Emmára (37)?
4. Mi a hiba a következő képletben: `=HA(C2>=20;2;HA(C2>=30;3;1))`? Mit ad a 42-re?

**Megoldás**

- 1. `=HA(C2>=20;"átment";"megbukott")`; Dávidnál „átment”.
- 2. `=ÉS(B2="11.B";C2>=40)`; Feri (40) és Hanna (44) esetén igaz.
- 3. `=HA(C2>=45;"kiváló";HA(C2>=38;"jó";"gyenge"))`; Emmára „gyenge”.
- 4. A feltételek rossz sorrendben vannak: a 42 már az első feltételnél (`>=20`) megáll, ezért 2-t ad, pedig 4-nek kellene lennie. A nagyobb küszöbbel kell kezdeni.

## Gyakori hibák

- A feltételek sorrendje rossz az egymásba ágyazott `HA`-nál.
- Hiányzó vagy felesleges zárójel a hosszú képletben.
- A szöveget idézőjel nélkül írod a képletbe (`megfelelt` helyett `"megfelelt"`).
- `ÉS`-t írsz oda, ahol `VAGY` kellene, vagy fordítva.
- Egy feltételt matematikai módra írsz: `30<=C2<45` helyett `ÉS(C2>=30;C2<45)` kell.

## Összefoglalás

A HA három argumentuma a feltétel, az igaz és a hamis ág. Az ÉS, VAGY, NEM összetett feltételt épít. A többágú döntés egymásba ágyazott HA-val oldható meg, ahol a sorrend számít. Ez a lecke közép szintű alap, az összetett feltételek az emelt feladatokban is visszatérnek.
