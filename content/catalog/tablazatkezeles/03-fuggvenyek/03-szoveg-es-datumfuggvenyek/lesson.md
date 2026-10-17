---
slug: szoveg-es-datumfuggvenyek
title: Szöveg- és dátumfüggvények
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (a szöveg kivágása és a keresés az emelt feladatokban sűrűbben fordul elő).*

## Szövegfüggvények

Importált vagy gépelt adatok gyakran egy cellában tartalmaznak több információt: egy kódban az évszám, egy névben a vezeték- és keresztnév. A szövegfüggvények ezeket szedik szét és rakják össze. A mintatáblázat:

| | A | B |
|---|---|---|
| 1 | Kód | Dátum |
| 2 | TAN-2026-014 | 2026.10.17. |
| 3 | Kovács Anna | |

Az `A2` kód három részből áll: `TAN`, `2026`, `014`.

| Képlet | Jelentés | Eredmény |
|---|---|---|
| `=BAL(A2;3)` (LEFT) | az első 3 karakter | `TAN` |
| `=JOBB(A2;3)` (RIGHT) | az utolsó 3 karakter | `014` |
| `=KÖZÉP(A2;5;4)` (MID) | az 5. karaktertől 4 karakter | `2026` |
| `=HOSSZ(A2)` (LEN) | a karakterek száma | `12` |
| `=SZÖVEG.TALÁL("-";A2)` (FIND) | az első `-` jel helye | `4` |
| `=SZÖVEG.TALÁL("-";A2;5)` | az 5. karaktertől keresve a következő `-` | `9` |

A `KÖZÉP` argumentumai: honnan, hány karaktert. A kód karakterei: T(1) A(2) N(3) -(4) 2(5) 0(6) 2(7) 6(8) -(9) 0(10) 1(11) 4(12). A `SZÖVEG.TALÁL` kis- és nagybetűre érzékeny, a rokon `SZÖVEG.KERES` (SEARCH) nem az, és használhat helyettesítő jeleket (`?`, `*`). Ha nem találja a szöveget, `#ÉRTÉK!` hibát ad.

**Összefűzés**: az `&` jellel vagy az **ÖSSZEFŰZ** (CONCATENATE) függvénnyel:

- `=BAL(A2;3)&"/"&JOBB(A2;3)` → `TAN/014`
- `=ÖSSZEFŰZ(BAL(A2;3);"/";JOBB(A2;3))` → `TAN/014`

**Szöveg számmá**: a `JOBB(A2;3)` eredménye szöveg (`014`). Ha számként kell használni: `=ÉRTÉK(JOBB(A2;3))` (VALUE) → `14`. Az egyszerű számolás (`=JOBB(A2;3)+1`) is működik, a program átalakítja, de az `ÉRTÉK` biztosabb.

## Nevek szétszedése

Az `A3` cellában `Kovács Anna` áll. A szóköz helye `=SZÖVEG.TALÁL(" ";A3)` → `7`.

- Vezetéknév: `=BAL(A3;SZÖVEG.TALÁL(" ";A3)-1)` → `Kovács` (az első 6 karakter).
- Keresztnév: `=JOBB(A3;HOSSZ(A3)-SZÖVEG.TALÁL(" ";A3))` → `Anna` (a teljes hossz 11, mínusz 7 = 4 karakter).

A trükk az, hogy a pozíciót nem kézzel számolod, hanem a `SZÖVEG.TALÁL`-lal, így a képlet minden névre jó, bármilyen hosszú is.

## Dátumfüggvények

A dátum valójában szám (lásd az első leckét), ezért függvényekkel lehet részeit kinyerni. A `B2` cella értéke `2026.10.17.` dátum.

| Képlet | Jelentés | Eredmény |
|---|---|---|
| `=ÉV(B2)` (YEAR) | az évszám | `2026` |
| `=HÓNAP(B2)` (MONTH) | a hónap sorszáma | `10` |
| `=NAP(B2)` (DAY) | a hónap napja | `17` |
| `=HÉT.NAPJA(B2;2)` (WEEKDAY) | a hét napja, hétfő = 1 | `6` (szombat) |
| `=MA()` (TODAY) | a mai dátum | az aktuális nap |
| `=MOST()` (NOW) | a mai dátum és idő | az aktuális pillanat |

A `HÉT.NAPJA` második argumentuma a számozás módja: a `2` esetén hétfő az 1-es, vasárnap a 7-es. Ezzel egyszerű a hétvége vizsgálata: `=HA(HÉT.NAPJA(B2;2)>5;"hétvége";"hétköznap")` → `hétvége`. Az argumentum nélküli változatban (típus 1) a vasárnap az 1-es, ami félrevezető lehet.

Dátumokkal számolni is lehet: `=MA()-B2` az eltelt napok száma (a cella formátumát át kell állítani Számra, mert a program dátumként is megjelenítheti). Egy hónap korábbi dátumhoz a `=DÁTUM(ÉV(B2);HÓNAP(B2)+1;NAP(B2))` ad egy hónappal későbbi napot: `2026.11.17.`. A `MA` és a `MOST` a fájl megnyitásakor mindig újraszámolódik, ezért az eredményük változik; a gyakorlatban ez azt jelenti, hogy a mai nap eredménye nem rögzíthető.

Időnél: `ÓRA` (HOUR), `PERC` (MINUTE), `MPERC` (SECOND) függvények bontják az időértéket. Például a `12:30:45` értékre az `=ÓRA(...)` `12`, a `=PERC(...)` `30`, az `=MPERC(...)` `45`.

## Gyakorold

1. Add meg a képletet, amely az `A2` kódból kiveszi a végén lévő sorszámot (`014`) számként. Mi az eredmény?
2. A `B2` dátumhoz írj képletet, amely a hónap és a nap alapján „10-17” szöveget ad.
3. Az `A3` cellában „Kovács Anna” áll. Írd meg a képletet, amely „Anna Kovács” formában adja vissza.
4. Mi a `=HÉT.NAPJA(B2;2)` eredménye, ha a `B2` dátuma egy vasárnap?

**Megoldás**

- 1. `=ÉRTÉK(JOBB(A2;3))` → `14`.
- 2. `=HÓNAP(B2)&"-"&NAP(B2)` → `10-17`.
- 3. `=JOBB(A3;HOSSZ(A3)-SZÖVEG.TALÁL(" ";A3))&" "&BAL(A3;SZÖVEG.TALÁL(" ";A3)-1)` → `Anna Kovács`.
- 4. `7`, mert a második típusnál a vasárnap a hét 7. napja.

## Gyakori hibák

- A `KÖZÉP` argumentumainak összekeverése (a második a kezdőpozíció, a harmadik a hossz).
- Az ÖSSZEFŰZ-nél a szóközt elfelejted idézőjelben hozzáadni (`" "`).
- A dátumot szövegként gépelted be, ezért a `HÓNAP` `#ÉRTÉK!` hibát ad.
- A `MA()` miatt a feladat kimenete változik, mert más napon nyitják meg.
- A `SZÖVEG.TALÁL` hibát ad, ha a keresett jel nincs a szövegben.

## Összefoglalás

A BAL, JOBB, KÖZÉP, HOSSZ és a SZÖVEG.TALÁL a szöveg részeit kezelik, az & és az ÖSSZEFŰZ pedig összeraknak. Az ÉV, HÓNAP, NAP, HÉT.NAPJA a dátum részeit adják, a MA és a MOST az aktuális időt. Ezek közép szinten alapismeretek, az emelt feladatokban kombinálva, egymásba ágyazva jelennek meg.
