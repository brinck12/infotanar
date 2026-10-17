---
slug: kepletek-es-relativ-hivatkozas
title: Képletek és relatív hivatkozás
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép.*

## Mi az a képlet?

A képlet egy `=` jellel kezdődő utasítás, amely értéket számol ki. A cellában az eredmény látszik, a képlet a szerkesztőlécen olvasható. A képlet lehet egyszerű számolás (`=3+4*2`, az eredmény `11`), vagy cellákra hivatkozhat (`=B2*C2`). A hivatkozás előnye: ha a hivatkozott cella értéke megváltozik, a képlet eredménye magától frissül.

A műveleti jelek: `+` összeadás, `-` kivonás, `*` szorzás, `/` osztás, `^` hatványozás, `&` szövegek összefűzése, `%` százalék. A műveletek sorrendje a matematikai: előbb a hatvány, aztán a szorzás és osztás, végül az összeadás és kivonás; a zárójel mindent felülír. Ezért `=2+3*4` értéke `14`, a `=(2+3)*4` értéke `20`.

## Egy mintatáblázat

Egy iskolai büfé árlistája és az eladások:

| | A | B | C | D |
|---|---|---|---|---|
| 1 | Termék | Egységár (Ft) | Mennyiség (db) | Érték (Ft) |
| 2 | Füzet | 250 | 4 | |
| 3 | Toll | 180 | 10 | |
| 4 | Radír | 90 | 3 | |
| 5 | Ceruza | 120 | 6 | |

Az érték az egységár és a mennyiség szorzata. A `D2` cellába kattintva beírod:

`=B2*C2`

és `Enter`. A cellában `1000` látszik (250 · 4). Fontos, hogy a hivatkozást nem kell begépelned: a `=` után kattints a `B2` cellára, írd be a `*` jelet, kattints a `C2`-re. A program beírja a címeket.

## Másolás a kitöltőjellel

A másik három sorba nem kell újra begépelni a képletet. Jelöld ki a `D2` cellát: a jobb alsó sarkában egy kis négyzet van, ez a **kitöltőjel** (másolófogantyú). Húzd le a `D5` celláig, vagy kattints rá duplán, ha mellette van kitöltött oszlop.

A `D3` cellában ezt találod: `=B3*C3`. Mi történt? Az eredeti képletben a `B2` és a `C2` **relatív hivatkozás** volt: nem a „B2 cellát” jelenti, hanem azt, hogy „két cellával balra, ugyanabban a sorban”. Egy sorral lejjebb másolva a hivatkozás is egy sorral lejjebb kerül:

| Cella | Képlet | Eredmény |
|---|---|---|
| D2 | `=B2*C2` | 1000 |
| D3 | `=B3*C3` | 1800 |
| D4 | `=B4*C4` | 270 |
| D5 | `=B5*C5` | 720 |

Vízszintesen is működik: ha a képletet jobbra másolod, az oszlopbetű változik. Ugyanez történik a másolás–beillesztés (`Ctrl+C`, `Ctrl+V`) során is, és a **kivágás–beillesztésnél** nem (a kivágott cella képlete a beillesztés után ugyanazokra a cellákra hivatkozik, mint előtte).

## Összeg és további példák

A `D6` cellába kerüljön az összes érték: `=D2+D3+D4+D5`. Eredmény: `3790` (1000 + 1800 + 270 + 720). Hosszabb listánál a SZUM függvényt használjuk: `=SZUM(D2:D5)`, ugyanennyi az eredmény (a függvényekről a következő modulban lesz szó).

Egy másik példa: a büfé 10% kedvezményt ad. Az `E2` cellába írd: `=D2*0,9`. Eredmény: `900`. A kedvezmény mértékét a képletbe írni nem szerencsés, mert ha változik, minden képletet át kell írni; erre az abszolút hivatkozás ad megoldást a következő leckében.

Százalék: ha a Füzet értéke az összes értékből hányad, a `F2` cellába: `=D2/D6`. Eredmény: `0,2638...`; százalék formátummal `26%` (1000/3790).

## Hibaüzenetek

| Üzenet | Mit jelent? |
|---|---|
| `#ZÉRÓOSZTÓ!` (`#DIV/0!`; LibreOffice: `#ZÉRÓOSZTÓ!` / `Err:532`) | nullával osztottál |
| `#ÉRTÉK!` (`#VALUE!`) | szöveg szerepel ott, ahol szám kellene |
| `#HIV!` (`#REF!`) | olyan cellára hivatkozik, amelyet törölték |
| `#NÉV?` (`#NAME?`) | ismeretlen függvény- vagy névelnevezés |
| `#####` | az oszlop túl keskeny |

## Gyakorold

1. Írd meg az `E2` cellába a kedvezményes ár képletét 5%-os kedvezményre, ha az érték a `D2`-ben van. Mi az eredmény a Füzetnél?
2. A `D4` cellában a képlet `=B4*C4`. Mi lesz a képlet, ha a `D4`-et a `G7` cellába másolod?
3. Mekkora az értéke a `=(B3-B4)*C3` képletnek a mintatáblázatban?
4. Mi a hiba abban, hogy a D2 cellába `=B2*C2` helyett `=250*4` írsz?

**Megoldás**

- 1. `=D2*0,95`, eredmény `950`.
- 2. A `D4`-ből `G7`-be 3 oszlop jobbra és 3 sor lefelé: `=E7*F7`.
- 3. `(180-90)*10 = 900`.
- 4. A képlet nem követi az adatok változását, és másoláskor mindenhova ugyanazt a számot adná.

## Gyakori hibák

- A hivatkozás helyett számot gépelsz a képletbe, így az eredmény nem frissül.
- A `=` jelet elfelejted, a program szövegnek veszi a bevitelt.
- Zárójelezés nélkül írod a képletet (`=B2-B3*C2`), pedig összeget akartál szorozni.
- A képletet csak az első sorba írod meg, és a többit nem töltöd ki.

## Összefoglalás

A képlet `=` jellel kezdődik, hivatkozik cellákra, és az eredménye az adatok változásával frissül. A relatív hivatkozás másoláskor az új helyzethez igazodik, ezt használjuk oszlopok kitöltésére a kitöltőjellel. A hibaüzenetek megmondják, mi a gond: nullával osztás, rossz típus, törölt hivatkozás. Ez a lecke közép szintű anyag.
