---
slug: probafelelet
title: "Próbafelelet"
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mire való a próbafelelet?

Ez a lecke egy **teljes, kidolgozott, 20 perces emelt szintű szóbeli mintát** mutat: az A) tétel kifejtését és a B) programozási feladat bemutatását, tanári kérdésekkel és jó válaszokkal. A példa saját szerkesztésű, nem hivatalos tétel, és nem a vizsga szövege. Olvasd végig, majd mondd el a saját változatodat hangosan, időmérővel.

A minta időbeosztása: bevezetés 1 perc, A) rész 7 perc, B) rész 8 perc, kérdések 4 perc.

## Bevezetés (1 perc)

"Tisztelt Bizottság! A tételem a táblázatkezelés: a hivatkozások, a függvények és az adatok szemléltetése. Három részben beszélek: először a cellahivatkozásokról, aztán a függvényekről, a rendezésről és a szűrésről, végül a diagramról. Ezután bemutatom a programozási feladat megoldását."

## A) rész: a táblázatkezelés tétele (7 perc)

**1. Hivatkozások.** "A képletekben cellákra hivatkozunk. A **relatív hivatkozás** másoláskor a célhelyhez igazodik: a C2-ben lévő =A2*B2 a C3-ban =A3*B3 lesz. Az **abszolút hivatkozás** rögzített: ha az áfakulcs az F1 cellában van, minden sor képlete =B2*$F$1 lehet. A vegyes hivatkozás ($A2, A$2) csak az oszlopot vagy csak a sort rögzíti." *(Gépen: lemásolom a képletet az oszlopra, és megmutatom, mit változtat a dollárjel.)*

**2. Függvények.** "A függvény előre megírt képlet, amelynek **argumentumai** vannak. Összesítésre az SZUM és az ÁTLAG, számlálásra a DARAB és a DARABTELI, feltételes összegzésre a SZUMHA való. A HA függvény elágazást valósít meg, a FKERES egy tábla első oszlopában keres, és a találat sorából ad vissza értéket." *(Példa a gépen: a diákok pontjaiból a HA függvény adja az osztályzatot.)*

**3. Rendezés és szűrés.** "A rendezés a rekordok sorrendjét módosítja egy vagy több kulcs szerint. A szűrés nem töröl, csak elrejti a feltételnek nem megfelelő sorokat. A feltételes formázás a cella értékétől függően változtatja a megjelenést, például pirosra színezi az elégtelent."

**4. Diagram.** "Az oszlopdiagram értékeket hasonlít össze, a kördiagram részarányokat mutat, a vonaldiagram időbeli változást. Fontos a cím, a tengelyfelirat és a jelmagyarázat." *(Gépen: kijelölöm az adatokat, beszúrok oszlopdiagramot, és hozzáadom a feliratokat.)*

**Záró mondat:** "Összefoglalva: a hivatkozás adja a képlet másolhatóságát, a függvény a számítást, a rendezés és a szűrés az áttekinthetőséget, a diagram a szemléltetést."

## B) rész: a programozási feladat bemutatása (8 perc)

A minta feladat: *Egy lista egy hét napi hőmérsékletét tartalmazza egész számokban. Írd ki a legmagasabb hőmérsékletet, hányadik napon volt, és hány napon volt fagypont alatt.*

Az ötlépéses séma szerint:

"**A feladat** az volt, hogy ... **Bemenet:** hét egész szám, **kimenet:** a maximum, a helye és a fagyos napok száma. **Az ötlet:** két programozási tétel egyetlen ciklusban, maximumkiválasztás és megszámlálás. Az első elemet feltételezem legnagyobbnak, majd végigmegyek a többin. Ha nagyobbat találok, felülírom a maximumot és a helyét. Közben minden negatív értéknél növelem a számlálót."

```python
homerseklet = [3, -2, 7, -5, 7, 0, -1]
maximum = homerseklet[0]
nap = 1
fagyos = 0
for i, ertek in enumerate(homerseklet, start=1):
    if ertek > maximum:
        maximum = ertek
        nap = i
    if ertek < 0:
        fagyos += 1
print(maximum, nap, fagyos)
```

"Futtatom: a kimenet `7 3 3`. Ez stimmel, mert a legnagyobb érték a 7, az első előfordulása a harmadik napon van, és három negatív szám van. Szándékosan **szigorú** `>` összehasonlítást használtam, ezért az első maximumot jelzi, a másodikat (5. nap) nem. Szélső esetként kipróbáltam, ha minden érték negatív, és ha csak egy elem van. Üres adatnál a program hibát adna, ezért ott előbb ellenőrizni kellene, van-e adat. A ciklus egyszer fut végig, tehát az idő arányos az elemszámmal."

## Tanári kérdések és jó válaszok (4 perc)

**K1: Mi változik, ha az utolsó legmagasabb napot kérdezik?** "A `>` helyett `>=` kell, így egyenlőség esetén is felülírom a helyet. Kipróbálom: a kimenet ekkor `7 5 3`."

**K2: Hogyan számolná meg a 0 fok feletti napokat?** "Egy második számlálót tennék a ciklusba, a feltétel `ertek > 0`. Ez ugyanaz a megszámlálás tétel, csak más feltétellel."

**K3: Hogyan oldaná meg ugyanezt táblázatkezelőben?** "A DARABTELI függvény a "<0" feltétellel megszámolná a fagyos napokat, a MAX adná a legnagyobb értéket, a HOL.VAN pedig a helyét. A táblázatban tehát függvényekkel oldanám meg, programban ciklussal."

**K4: Mit csinál, ha nem tudja a függvény pontos nevét?** "Megnézem a függvénysúgóban, vagy leírom, mit kellene tennie. A szintaxist nem tudom fejből biztosan, de az elvet igen."

Figyeld meg: minden válasz **rövid, konkrét, szakszerű**, és kapcsolatot teremt a két rész között.

## Önértékelő lista

Mondd el a saját feleletedet, majd jelöld meg, mi teljesült.

- [ ] Az első mondatban megneveztem a tételt, és elmondtam a vázlatot.
- [ ] Az időt tartottam: az A) rész legfeljebb 8, a B) rész legfeljebb 8 perc volt.
- [ ] Minden fogalmat megneveztem, értelmeztem és példával szemléltettem.
- [ ] A gépen szemléltettem, és közben beszéltem.
- [ ] A B) részben megneveztem a programozási tételt.
- [ ] Futtattam a programot, és előre megmondtam, mit várok.
- [ ] Szélső esetet is teszteltem.
- [ ] Nem olvastam fel, a bizottságra néztem.
- [ ] Kérdésnél visszakérdeztem vagy pontosítottam.
- [ ] Zárásként összefoglaltam a lényeget.

## Gyakori hibák

- **Az A) rész túlnyúlik**, és a B) részre alig marad idő, pedig az 10 pontot ér.
- **Futtatás nélkül magyarázod a programot.**
- **Elfelejted megnevezni a tételt**, pedig az szaknyelvi pont.
- **Védekezel a kérdésekkel szemben**, ahelyett hogy kiindulnál belőlük.
- **Csak egyszer próbálod el** a feleletet: legalább háromszor mondd el hangosan.

## Összefoglalás

- A 20 perc: 1 bevezetés, 7 A), 8 B), 4 kérdések.
- Az A) rész: pontos fogalmak, példák, gépes szemléltetés, záró összefoglalás.
- A B) rész: feladat, bemenet és kimenet, tétel, kód blokkonként, futtatás, szélső eset.
- A kérdésekre rövid, konkrét válasz kell, és ha elakadsz, indulj ki abból, amit tudsz.
- Az önértékelő listával minden próbafelelet után ellenőrizd magad.
