---
slug: kereso-es-adatbazis-fuggvenyek
title: Kereső és adatbázis-függvények
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (FKERES, VKERES, INDEX, HOL.VAN); emelt (adatbázis-függvények, tömbképlet).*

## Mire jó a kereső függvény?

Ha egy táblázatból kell kikeresni egy adatot egy kulcs alapján (például egy termékkód árát), nem kell kézzel nézegetni: a kereső függvények megtalálják. A mintatáblázat az `Árak` munkalap `A1:C5` tartományán:

| | A | B | C |
|---|---|---|---|
| 1 | Kód | Név | Egységár (Ft) |
| 2 | K01 | Füzet | 250 |
| 3 | K02 | Toll | 180 |
| 4 | K03 | Radír | 90 |
| 5 | K04 | Ceruza | 120 |

## FKERES

Az **FKERES** (VLOOKUP, a függőleges keresés) szerkezete:

`=FKERES(keresett_érték; tartomány; oszlopszám; pontos_egyezés)`

- A keresett érték a **tartomány első oszlopában** keresett kulcs.
- Az oszlopszám a **tartományon belüli** sorszám (a kulcsoszlop az 1-es).
- Az utolsó argumentum: `0` vagy `HAMIS` a pontos, `1` vagy `IGAZ` a közelítő illesztés.

Példák:

- `=FKERES("K03";A2:C5;3;0)` → `90`
- `=FKERES("K02";A2:C5;2;HAMIS)` → `Toll`

Ha a kód egy cellában van (például a `B2` cellában), a képlet: `=FKERES(B2;Árak!$A$2:$C$5;3;0)`. A keresési tartomány legyen abszolút hivatkozás, mert a képlet másolásakor nem szabad elcsúszni. Ha a kulcs nincs a táblázatban, pontos illesztésnél `#HIÁNYZIK!` (`#N/A`) hiba jön.

Az FKERES csak **jobbra** keres: a visszaadott oszlop csak a kulcsoszlop jobb oldalán lehet.

## VKERES

A **VKERES** (HLOOKUP) ugyanez vízszintesen: a kulcs az első sorban van. Mintatáblázat a `A10:D11` tartományon:

| | A | B | C | D |
|---|---|---|---|---|
| 10 | Hónap | jan | feb | már |
| 11 | Bevétel | 120 | 150 | 90 |

`=VKERES("feb";A10:D11;2;0)` → `150`. Itt a harmadik argumentum a **sorszám**, mert a keresés oszlopok mentén halad.

## INDEX és HOL.VAN

A két függvény külön is hasznos, együtt pedig az FKERES rugalmasabb változata.

- **HOL.VAN** (MATCH): megadja, hányadik a keresett elem a tartományban. `=HOL.VAN("K03";A2:A5;0)` → `3`.
- **INDEX**: megadja a tartomány adott sorszámú elemét. `=INDEX(C2:C5;3)` → `90`.

Együtt: `=INDEX(C2:C5;HOL.VAN("K03";A2:A5;0))` → `90`. Ezzel balra is lehet keresni: ha az ár alapján kell a nevet kikeresni, `=INDEX(B2:B5;HOL.VAN(90;C2:C5;0))` → `Radír`, amit az FKERES nem tud.

A `HOL.VAN` harmadik argumentuma: `0` pontos egyezés, `1` (vagy elhagyva) közelítő, növekvő sorrendben; `-1` közelítő, csökkenő sorrendben.

## Közelítő illesztés

Az osztályzatot a pontszám alapján határsávokból kereshetjük ki. A határokat külön táblázatba írjuk, **növekvő sorrendben**: az `E2:F6` tartományon:

| | E | F |
|---|---|---|
| 1 | Alsó határ | Jegy |
| 2 | 0 | 1 |
| 3 | 20 | 2 |
| 4 | 30 | 3 |
| 5 | 38 | 4 |
| 6 | 45 | 5 |

- `=FKERES(42;E2:F6;2;1)` → `4` (a 42 a 38 és 45 közé esik, a program a nála nem nagyobb legnagyobb határt, a 38-at választja).
- `=FKERES(29;E2:F6;2;1)` → `2`.
- `=FKERES(45;E2:F6;2;1)` → `5`.
- `=HOL.VAN(42;E2:E6;1)` → `4`.

A közelítő illesztésnél a kulcsoszlop **rendezettsége kötelező**; rendezetlen oszlopnál az eredmény hibás, anélkül hogy hibaüzenet jönne. Fontos a negyedik argumentum is: ha elhagyod, a program közelítő illesztést használ, és ezzel pontos keresésnél hibás értéket adhat. Ezt tipikus hibaforrás, ezért mindig írd ki.

Ez a megoldás sok ágú `HA` helyett is jó, és a határok változtatása a képletek átírása nélkül, a táblázatban megoldható.

## Adatbázis-függvények (emelt szint)

Az adatbázis-függvények egy fejléces táblázatból számolnak a **feltételtartományban** megadott feltételek szerint. Az előző leckék pontszámtábláját (`A1:C9`, fejléc: Név, Osztály, Pont) használjuk. A feltételtartomány egy külön kis tábla, melynek **első sora a fejlécnév** (pontosan megegyezik az adattábla fejlécével), alatta a feltétel: `E1` = `Osztály`, `E2` = `11.A`.

- `=AB.SZUM(A1:C9;"Pont";E1:E2)` (DSUM) → `127`
- `=AB.DARAB(A1:C9;"Pont";E1:E2)` (DCOUNT) → `3` (csak a számot tartalmazó cellákat számolja, Gréta üres cellája kimarad)

Az argumentumok: az adattábla (fejlécestől), a számolandó oszlop neve idézőjelben (vagy sorszáma), és a feltételtartomány. Több feltételt úgy adsz meg, hogy **ugyanabban a sorban** az `ÉS` kapcsolat, **külön sorokban** a `VAGY` kapcsolat. Ha az `E1:F2` tartományban `Osztály | Pont` fejléc alatt `11.A | >=40` áll, akkor az `AB.SZUM(A1:C9;"Pont";E1:F2)` értéke `90` (42 + 48), az `AB.DARAB` értéke `2`.

## Tömbképletek röviden (emelt szint)

A tömbképlet egy tartományon egyszerre számol, és a végén összesít. A feltételes összegzés tömbképlettel is megírható: `=SZUM(HA(B2:B9="11.A";C2:C9))` → `127`. Régebbi Excelben és LibreOffice-ban **`Ctrl+Shift+Enter`** gombbal kell lezárni (a képletet kapcsos zárójel `{ }` veszi körül), az újabb Excel (Microsoft 365) a sima `Enter`-t is elfogadja. Több feltétel szorzással kapcsolható: `=SZUM((B2:B9="11.A")*(C2:C9>=40))` → `2` (Anna és Csilla).

## Gyakorold

1. Az `Árak` táblázatból kereséssel add meg a `K04` termék nevét és árát. Mi a két eredmény?
2. Hogyan keresed ki a 120 forintos termék kódját FKERES nélkül?
3. A fenti jegytáblával milyen jegyet ad az `=FKERES(37;E2:F6;2;1)`?
4. Írd meg a 11.B osztály pontjainak összegét `AB.SZUM`-mal. Milyen feltételtartomány kell hozzá? Mi az eredmény?

**Megoldás**

- 1. `=FKERES("K04";A2:C5;2;0)` → `Ceruza`; `=FKERES("K04";A2:C5;3;0)` → `120`.
- 2. `=INDEX(A2:A5;HOL.VAN(120;C2:C5;0))` → `K04`.
- 3. `3`, mert a 37 a 30 és 38 között van.
- 4. Feltételtartomány: `E1` = `Osztály`, `E2` = `11.B`; `=AB.SZUM(A1:C9;"Pont";E1:E2)` → `148` (35 + 29 + 40 + 44).

## Gyakori hibák

- Az oszlopszámot a munkalap oszlopbetűje alapján számolod, nem a keresési tartományon belül.
- A negyedik argumentumot elhagyod, és közelítő keresést kapsz.
- A keresési tartomány nem abszolút, és másoláskor elcsúszik.
- A feltételtartomány fejléce nem egyezik pontosan az adattábla fejlécével, ezért az `AB.SZUM` nullát ad.
- Rendezetlen kulcsoszlopnál közelítő illesztést használsz.

## Összefoglalás

Az FKERES és VKERES a kulcs alapján keres egy táblázat első oszlopában, illetve sorában, az INDEX és HOL.VAN együtt bármely irányban. A negyedik argumentum dönti el, hogy pontos vagy közelítő az illesztés, közelítőnél a kulcsoknak növekvő sorrendben kell lenniük. Az AB.SZUM és AB.DARAB feltételtartománnyal dolgozik, a tömbképlet `Ctrl+Shift+Enter`-rel zárul; mindkettő emelt szintű anyag, a többi közép szintű.
