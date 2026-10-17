---
slug: tablazatkezeles-tetel
title: "Táblázatkezelés: tételvázlat"
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## A tétel célja

A táblázatkezelés tételben az adatok rendezett tárolását, a számolást képletekkel és függvényekkel, az adatok elemzését és a diagramkészítést kell megmutatnod. A hivatalos tételek nem nyilvánosak, ez a vázlat **saját felkészítő anyag** a vizsgakövetelmény alapján.

## Kulcsfogalmak és pontos definíciók

- **Táblázatkezelő**: programok (Excel, Calc), amelyek cellákba rendezett adatokkal végeznek számításokat.
- **Munkafüzet, munkalap, cella**: a munkafüzet munkalapokból áll, a munkalap cellákból; a cella címe oszlop- és sorazonosító (`B3`).
- **Cellatartalom típusai**: szöveg, szám, dátum, logikai érték, képlet. A képlet `=` jellel kezdődik.
- **Relatív hivatkozás** (`A1`): másoláskor a cél helyzetéhez igazodik. **Abszolút hivatkozás** (`$A$1`): másoláskor nem változik. **Vegyes** (`$A1`, `A$1`): csak az egyik tengely rögzített.
- **Függvény**: előre megírt számítás, nevet és argumentumokat kap (`SZUM(A1:A10)`). A magyar és angol nevek eltérnek (SZUM és SUM).
- **Tartomány**: összefüggő cellacsoport, például `B2:B20`.
- **Szűrés**: a feltételnek nem megfelelő sorok elrejtése. **Rendezés**: a sorok átrendezése egy vagy több oszlop szerint.
- **Diagram**: az adatok grafikus ábrázolása.
- **Kimutatás (pivot)**: adatok csoportosító összesítése.

## Fontos függvénycsoportok

| Cél | Függvények (magyar) |
|---|---|
| Összegzés, statisztika | SZUM, ÁTLAG, DARAB, MIN, MAX |
| Feltételes számolás | HA, SZUMHA, DARABTELI, ÁTLAGHA |
| Keresés | FKERES, VKERES |
| Szöveg | BAL, JOBB, KÖZÉP, HOSSZ, ÖSSZEFŰZ |
| Dátum | MA, ÉV, HÓNAP, NAP |
| Kerekítés | KEREKÍT, EGÉSZ |

Fontos: `=HA(B2>=50;"megfelelt";"nem felelt meg")` az argumentumokat pontosvessző választja el a magyar nyelvű programban, és feltétel, igaz ág, hamis ág a sorrend. A `DARABTELI(A1:A10;">5")` megszámolja, hány cella teljesíti a feltételt. Az `FKERES` a keresett értéket a tartomány első oszlopában keresi, és a megadott oszlopból adja vissza az értéket.

## A kifejtés javasolt sorrendje

1. **A táblázatkezelő célja**, felépítése (cella, tartomány, munkalap).
2. **Adattípusok és formázás**: szám, dátum, pénznem, feltételes formázás.
3. **Képletek és hivatkozások**: relatív, abszolút, vegyes; példával (százalék számolása, szorzótábla).
4. **Függvények**: egyszerű, feltételes, kereső; egy-egy példa.
5. **Adatkezelés**: rendezés, szűrés, kimutatás.
6. **Diagramok**: típus kiválasztása az adat jellege szerint, címek, tengelyek.
7. **Hibák**: `#ZÉRÓOSZTÓ!`, `#HIV!`, `#ÉRTÉK!`, `#NÉV?`; ellenőrzés.
8. **Nyomtatás és mentés**: nyomtatási terület, formátumok (xlsx, ods, csv).

## Diagramok kiválasztása

- **Oszlopdiagram**: kategóriák összehasonlítása.
- **Vonaldiagram**: időbeli változás.
- **Kördiagram**: egy egész részei, legfeljebb néhány kategóriával, az összeg 100%.
- **Pontdiagram**: két mennyiség kapcsolata.

Minden diagramnak legyen címe, tengelyfelirata és értelmezhető jelmagyarázata. Kördiagramnál csak egy adatsor ábrázolható.

## Szemléltetés a gépen

Készíts elő egy kis adattáblát (például 10 diák pontszáma). Mutasd meg:

- az átlagot, a legnagyobbat és a darabszámot függvényekkel;
- egy `HA` képletet, amit lemásolsz lefelé;
- az abszolút hivatkozás szerepét: egy 5%-os kedvezmény egy rögzített cellában (`$F$1`) lent is jó marad;
- egy rendezést és szűrést;
- az adatokból készített oszlop- és kördiagramot.

## Tipikus bizottsági kérdések és mintaválaszok

**Mi a különbség a relatív és az abszolút hivatkozás között?**
Másoláskor a relatív hivatkozás eltolódik a másolás irányában, az abszolút (`$` jelekkel) ugyanarra a cellára mutat. Állandó értéknél, például egy árfolyamnál abszolút hivatkozást használunk.

**Mikor használunk `HA` függvényt?**
Ha az eredmény egy feltételtől függ: ha a feltétel igaz, az egyik, különben a másik értéket adja.

**Mit csinál az `FKERES`?**
Egy érték alapján keres egy táblázat első oszlopában, és a találat sorából egy megadott oszlop értékét adja. A negyedik argumentummal szabályozzuk a pontos egyezést.

**Melyik diagramot választanád és miért?**
Az adat jellegétől függ: időbeli alakulásra vonaldiagram, kategóriák összehasonlítására oszlopdiagram, részarányra kördiagram.

**Miért jobb képlet, mint a kézzel beírt eredmény?**
A képlet automatikusan frissül, ha a bemeneti adat változik, így kevesebb a hiba.

## Gyakori hibák

- Szám szövegként tárolva (balra igazodik), ezért a SZUM nem számolja.
- A `$` jel kihagyása másolás előtt.
- A cellát kézi számmal írják felül a képlet helyett.
- Kördiagram túl sok kategóriával vagy több adatsorral.
- A diagramról hiányzik a cím és a tengelyfelirat.
- Rendezés előtt nem jelölik ki az összes oszlopot, így az adatsorok szétcsúsznak.

## Összefoglalás

- A táblázatkezelő a cellákban tárolt adatokkal számol; a képlet `=` jellel indul.
- Relatív, abszolút és vegyes hivatkozás: másoláskor másképp viselkedik.
- A legfontosabb függvények: SZUM, ÁTLAG, HA, DARABTELI, FKERES.
- A diagramtípust az adat jellege dönti el.
- A felelet közben mindig mondd el, **miért** azt a képletet vagy diagramot választottad.
