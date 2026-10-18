---
slug: feltetelek-formazas
title: Feltételes formázás
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: emelt (a képlettel megadott feltétel); a cellaérték alapú egyszerű szabály közép szintű is lehet.*

## Mit jelent a feltételes formázás?

A feltételes formázás a cella megjelenését (betűszín, háttér, szegély) attól teszi függővé, hogy egy feltétel igaz-e. A cella tartalma nem változik, csak a kinézete. Ha az adat megváltozik, a formázás is magától igazodik. Például: pirosra színezni minden 30 pont alatti eredményt.

A mintatáblázat az előző lecke pontszámtáblája (`A1:C9`, a fejléc az 1. sorban):

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

## Egyszerű szabály: cellaérték

Az egyszerű szabály csak az adott cella értékét vizsgálja. Jelöld ki a `C2:C9` tartományt, majd:

- **Excel**: `Kezdőlap` > `Feltételes formázás` > `Kijelölt cellák szabályai` > `Kisebb, mint...`, megadod a `30` értéket és a formátumot (például piros háttér).
- **LibreOffice**: `Formátum` > `Feltételes` > `Feltétel...`, `A cella értéke` `kisebb, mint` `30`, és a `Stílus` mezőben új stílust hozol létre (háttérszín: piros).

A `Dávid` 29 pontját pirosra színezi. Figyeld meg: a program az üres `C8` cellát is „kisebb, mint 30”-nak veszi (nullának számít), ezért Gréta cellája is piros lehet. Ezt a képletes szabály ki tudja szűrni.

## Képletes szabály (emelt szint)

A **képlettel megadott feltétel** a leggyakoribb emelt feladat: a formázás egy logikai képlettől függ, és így **egész sort** is színezhetsz egy cella értéke alapján. Szabályok:

1. Jelöld ki azt a tartományt, amelyet formázni akarsz. Példa: `A2:C9` (az adatok fejléc nélkül).
2. Új szabály, **képlet használata**:
   - **Excel**: `Kezdőlap` > `Feltételes formázás` > `Új szabály...` > `Képlet használata a formázandó cellák kijelöléséhez`.
   - **LibreOffice**: `Formátum` > `Feltételes` > `Feltétel...`, majd `A képlet értéke`.
3. A képletet úgy írd meg, mintha a kijelölt tartomány **bal felső cellájára** (itt az `A2`-re) írnád.
4. Állítsd be a formátumot, és hagyd jóvá.

Az 1. példa: **színezd zöldre azokat a sorokat, ahol a pont legalább 45.**

`=$C2>=45`

Az `$C2` a lényeg: az **oszlop rögzített** (mindig a `C` oszlop pontszámát nézi), a **sor relatív** (soronként másik cellát). Így az `A2:C9` mindhárom cellája ugyanazt a feltételt látja, és az egész sor zöld lesz. Csilla sora (48) zöld, a többi nem.

A 2. példa: **piros betű, ha 11.A osztályú és 40 alatti a pontszám, de nem üres.**

`=ÉS($B2="11.A";$C2<>"";$C2<40)`

Emma (11.A, 37) sora piros betűs lesz; Gréta (11.A, üres) nem, mert a `$C2<>""` kizárja az üres cellát; Dávid (11.B, 29) nem, mert nem 11.A-s. Egy szabály csak akkor érvényesül, ha a képlet `IGAZ` értéket ad.

A 3. példa: **minden második sor szürke** (csíkozás): `=MARADÉK(SOR();2)=0` (MOD, ROW) a páros sorokat színezi.

A 4. példa dátummal: hétvégi dátum kiemelése, ha az `A2:A10` tartományban dátumok vannak: `=HÉT.NAPJA($A2;2)>5`.

## A rögzítés szabálya

A képletes szabályban a `$` jelnek ugyanaz a szerepe, mint a másolásnál (lásd az abszolút és vegyes hivatkozás leckét): a képletet a program minden cellára „lemásolja” a kijelölt tartományban.

| Cél | Képlet |
|---|---|
| a teljes sort a C oszlop alapján színezd | `=$C2>=45` |
| minden cella a saját értéke alapján | `=C2>=45` |
| az oszlopot az 1. sorban lévő érték alapján | `=C$1="Pont"` |

Gyakori hiba, hogy a `$` jelet elhagyod, és a színezés „elcsúszik”: a második oszlopban már a `D` oszlopra mutat.

## Szabályok kezelése

Több szabály is lehet egy tartományon. Megtekintés és módosítás: **Excel**: `Feltételes formázás` > `Szabályok kezelése...`; **LibreOffice**: `Formátum` > `Feltételes` > `Kezelés...`. Itt módosíthatod a sorrendet, a tartományt, és törölheted a szabályokat. Ha két szabály ütközik (például az egyik pirosra, a másik zöldre színez), a lista első szabálya (Excel: a legfelső) érvényesül.

## Gyakorold

1. Írd meg a képletet, amely a 11.B osztályú diákok teljes sorát színezi (`A2:C9` kijelölve). Kik lesznek színesek?
2. Írj szabályt, amely csak a `Pont` oszlop celláit színezi pirosra, ha a pont kisebb, mint az átlag. Hogyan hivatkozol az átlagra?
3. Mi a hiba abban, hogy `=C2>=45`-öt írsz a szabályba, amikor az `A2:C9` van kijelölve, és a teljes sort szeretnéd színezni?
4. Hogyan színezed ki azt a sort, ahol a pont üres?

**Megoldás**

- 1. `=$B2="11.B"`; Bence, Dávid, Feri, Hanna sora színes.
- 2. A `C2:C9` kijelölésével: `=C2<ÁTLAG($C$2:$C$9)` (az átlag tartománya abszolút, mert nem szabad elcsúsznia).
- 3. A `C2` hivatkozásnak az oszlopa nincs rögzítve: a `B` oszlopban `B2>=45` lesz, az `A` oszlopban `A2>=45`. Helyesen `=$C2>=45`.
- 4. `=$C2=""`; Gréta sora lesz színes.

## Gyakori hibák

- A képletet a jelölt tartomány bal felső celláján kívül más cellára írod meg.
- Hiányzik a `$` jel a teljes sort érintő szabályból.
- A szabály tartománya rossz (a fejlécet is kijelölted).
- A szabályt a cellák kézi színezésével helyettesíted, így az adat változásakor nem frissül.

## Összefoglalás

A feltételes formázás a megjelenést logikai feltételtől teszi függővé. Az egyszerű szabály a cella értékét vizsgálja, a képletes szabály a kijelölt tartomány bal felső celláját veszi alapul, és a `$` rögzítéssel az egész sort vagy oszlopot vezérelheti. A képletes szabály emelt szintű anyag.
