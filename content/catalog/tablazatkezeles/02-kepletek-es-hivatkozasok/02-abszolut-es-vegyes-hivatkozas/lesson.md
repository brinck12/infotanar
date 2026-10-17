---
slug: abszolut-es-vegyes-hivatkozas
title: Abszolút és vegyes hivatkozás
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (munkalapok közötti hivatkozás is).*

## Mikor nem jó a relatív hivatkozás?

Az előző leckében láttad, hogy a relatív hivatkozás másoláskor „követi” az új helyet. Néha viszont az kell, hogy a hivatkozás egy adott cellán maradjon, például egy ÁFA-kulcson, amelyet minden sor használ. Erre való az **abszolút hivatkozás**: a sor és az oszlop elé `$` jelet teszünk.

## Abszolút hivatkozás

Mintatáblázat: az `F1` cellában az ÁFA-kulcs van (`27%`), a nettó árak a `B` oszlopban.

| | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| 1 | Termék | Nettó ár | Bruttó ár | | ÁFA | 27% |
| 2 | Füzet | 250 | | | | |
| 3 | Toll | 180 | | | | |
| 4 | Radír | 90 | | | | |

A `C2` cellába ezt írod:

`=B2*(1+$F$1)`

Eredmény: `317,5` (250 · 1,27). Ha lemásolod a `C4`-ig, a `C3` képlete `=B3*(1+$F$1)` (eredmény `228,6`), a `C4`-é `=B4*(1+$F$1)` (eredmény `114,3`): a `B` hivatkozás követte a sort, a `$F$1` nem mozdult. Ha relatív `F1` lenne a képletben, a `C3`-ban `F2` állna, az üres cella pedig nullának számítana, és az eredmény hibás lenne.

Gyorsan beírni a `$` jeleket így lehet: a képlet szerkesztése közben a hivatkozásra állsz a kurzorral, és megnyomod az `F4` billentyűt (Excel és LibreOffice is). Az `F4` ismételt nyomása sorban körbejár: `$F$1` → `F$1` → `$F1` → `F1`. (Egyes laptopokon az `Fn+F4` kell.)

## Vegyes hivatkozás

Ha csak az egyik részt rögzíted, **vegyes hivatkozást** kapsz:

| Alak | Jelentés |
|---|---|
| `$A1` | az oszlop rögzített, a sor változik |
| `A$1` | a sor rögzített, az oszlop változik |
| `$A$1` | mindkettő rögzített |
| `A1` | mindkettő változik |

Klasszikus példa a szorzótábla. A `B1:E1` tartományban az 1, 2, 3, 4 számok, az `A2:A4` tartományban az 1, 2, 3 számok vannak. A `B2` cellába írd:

`=$A2*B$1`

és másold a `B2:E4` tartományba. A képlet `$A2` része mindig az `A` oszlopra mutat, de a sort követi; a `B$1` része mindig az 1. sorra mutat, de az oszlopot követi. A kapott tábla:

| | A | B | C | D | E |
|---|---|---|---|---|---|
| 1 | | 1 | 2 | 3 | 4 |
| 2 | 1 | 1 | 2 | 3 | 4 |
| 3 | 2 | 2 | 4 | 6 | 8 |
| 4 | 3 | 3 | 6 | 9 | 12 |

Az `D3` cellában például `=$A3*D$1` áll, értéke `2*3 = 6`. Csak vegyes hivatkozással lehet ilyen táblát **egyetlen képlettel** kitölteni.

## Hivatkozás másik munkalapra

Egy képlet másik munkalap celláira is hivatkozhat. Tegyük fel, hogy az `Árak` nevű munkalap `B2` cellájában a füzet egységára (`250`), és az `Eladás` munkalapon számolsz. Az `Eladás` munkalap `C2` cellájában:

- **Excel**: `=Árak!B2*B2`
- **LibreOffice**: `=$Árak.B2*B2`

Mindkét program magától beírja a hivatkozást, ha a képlet közben a másik lapra kattintasz, és kijelölöd a cellát. Ha az `Árak.B2` értéke `250`, az `Eladás.B2` pedig `4`, akkor az eredmény `1000`. A munkalapnév és a cellacím együtt is lehet abszolút: `=Árak!$B$2*B2` (Excel), illetve `=$Árak.$B$2*B2` (LibreOffice). Ha a lap neve szóközt tartalmaz, Excelben aposztróf kell: `='Heti árak'!B2`.

Tartományra is hivatkozhatsz, például `=SZUM(Árak!B2:B5)`. A munkalap átnevezésekor a program a hivatkozásokat magától javítja.

## Gyakorold

1. Az `F1` cellában 500 (szállítási díj), a `B2:B4` tartományban az árak. A `C2` cellába olyan képletet írj, amely hozzáadja az árhoz a szállítási díjat, és lemásolható `C4`-ig.
2. Mi lesz a `=$A2*B$1` képlet, ha a `B2` cellából a `D4`-be másolod?
3. A `Havi` munkalap `B1` cellájában az átlag, és a `Napi` munkalapon a `C2` cellában ezt az átlagot szeretnéd megszorozni 2-vel. Írd meg a képletet mindkét program formájában.
4. Melyik hivatkozást kell használni, ha egy sorban minden cellát ugyanahhoz az `E1` cellához akarsz viszonyítani, és a képletet oszlopba is és sorba is másolod?

**Megoldás**

- 1. `=B2+$F$1`
- 2. Két oszlop jobbra, két sor lefelé: `=$A4*D$1`.
- 3. Excel: `=Havi!B1*2`, LibreOffice: `=$Havi.B1*2`.
- 4. Az abszolút `$E$1` hivatkozást.

## Gyakori hibák

- Az `F4`-gyel véletlenül rossz változatot választasz (`F$1` helyett `$F$1`), és másoláskor elcsúszik a képlet.
- Szorzótáblánál mindkét hivatkozást teljesen rögzíted, ezért minden cellában ugyanaz az eredmény.
- A munkalapnév szóközt tartalmaz, de Excelben az aposztróf hiányzik.
- LibreOffice-ban `!` jelet írsz a lapnév és a cella közé, pedig ott pont (`.`) kell.

## Összefoglalás

A `$` jel rögzíti az oszlopot, a sort vagy mindkettőt. Az abszolút hivatkozás (`$F$1`) egy kijelölt cellára mutat másoláskor is, a vegyes (`$A2`, `A$1`) az egyik irányt rögzíti. Munkalapok között `Munkalap!Cella` (Excel) vagy `$Munkalap.Cella` (LibreOffice) alakban hivatkozunk. Ez a lecke közép szintű anyag.
