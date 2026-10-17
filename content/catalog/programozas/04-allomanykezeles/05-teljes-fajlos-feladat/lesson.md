---
slug: teljes-fajlos-feladat
title: Teljes fájlos feladat
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mini-érettségi

Ez a lecke az eddig tanultak összeépítése. Egy érettségi fájlos feladat általában egyetlen adatfájlra épül, és 5–8 részfeladatot tartalmaz: az első kicsi, a későbbiek egyre összetettebbek. A részfeladatok kimenete elé a mintafeladatokban mindig oda kell írni a sorszámot, például `1. feladat`, hogy a javító lássa, melyik válasz melyik kérdésre vonatkozik.

Ebben a leckében az `ut.txt` fájllal dolgozol: egy fuvarozó cég útjait tartalmazza tabulátorral tagolva.

```
datum<TAB>sofor<TAB>km<TAB>perc
2024-03-01<TAB>Kovacs<TAB>120<TAB>95
2024-03-01<TAB>Nagy<TAB>45<TAB>50
...
```

Az öt feladat mindegyike ugyanazt a fájlt használja. A program külön fut le feladatonként, tehát mindegyikben újra be kell olvasnod az adatokat.

## A megoldás menete

Egy ilyen feladatot érdemes mindig ugyanabban a sorrendben megoldani:

1. **Olvasd el a leírást, és nézd meg az adatfájl szerkezetét.** Melyik az elválasztó? Van-e fejléc? Melyik oszlop mit jelent, és szám-e?
2. **Olvasd be a fájlt egyszer**, a program elején, listába. A fejlécet hagyd ki, a számmezőket alakítsd át.
3. **Azonosítsd a programozási tételt.** A feladat összegzés, megszámlálás, maximumkeresés, kiválogatás vagy összetett?
4. **Írd ki a feladat sorszámát**, majd az eredményt a kért formában.
5. **Teszteld egy kisebb adattal**, amelynek az eredményét kézzel is ki tudod számolni.

## Beolvasás mezőkre bontva

::: python

```python
with open("ut.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
utak = []
for sor in sorok[1:]:
    mezok = sor.split("\t")
    utak.append((mezok[0], mezok[1], int(mezok[2]), int(mezok[3])))
```

Az `utak` listában minden elem egy négyes (egy `tuple`): dátum, sofőr, kilométer, percek. Az elemhez indexszel férsz hozzá: `ut[2]` a kilométer. A listát később többször is végigjárhatod, anélkül hogy a fájlt újra be kellene olvasnod.

:::

::: csharp

```csharp
string[] sorok = File.ReadAllLines("ut.txt");
List<string[]> utak = new List<string[]>();
for (int i = 1; i < sorok.Length; i++)
{
    utak.Add(sorok[i].Split('\t'));
}
```

Az `utak` listában minden elem a sor mezői `string[]` tömbként. A számokat használatkor kell átalakítani: `int.Parse(ut[2])`. A `List` használatához kell a `using System.Collections.Generic;` sor.

:::

## A feladatok

Az öt gyakorlófeladat mind az `ut.txt` fájlra épül, és az érettségi stílusát követi:

1. **Utak száma és hossza**: megszámlálás és összegzés. A legegyszerűbb feladat: kell hozzá a fájl beolvasása és a fejléc kihagyása.
2. **A leghosszabb út**: maximumkeresés. Nem elég a legnagyobb km érték: a hozzá tartozó dátumot és sofőrt is ki kell írni.
3. **Egy sofőr statisztikája**: a felhasználó megad egy nevet, a program az ő útjait összegzi. Gondolj arra az esetre, amikor a név nem szerepel a fájlban!
4. **Hosszú utak**: kiválogatás egy feltétel alapján, a találatok számával együtt.
5. **Sofőrök összesítése fájlba**: csoportonkénti összegzés (mezőnként más sofőr), majd az eredmény fájlba írása és visszaolvasása. Ez a legösszetettebb feladat.

A feladatok sorrendben nehezednek, de egymástól függetlenek: bármelyikkel kezdhetsz, ha elakadtál valamelyiken.

## Csoportonkénti összegzés

Az utolsó feladat új gondolat: nem egyetlen összeget kell számolni, hanem **sofőrönként külön**. Erre a szótár a legalkalmasabb: a kulcs a sofőr neve, az érték az összeg.

::: python

```python
km = {}
for ut in utak:
    nev = ut[1]
    if nev not in km:
        km[nev] = 0
    km[nev] += ut[2]
```

A `nev not in km` ellenőrzés az első előforduláskor nullára állítja az összeget. A szótár megőrzi a kulcsok beszúrási sorrendjét, tehát a nevek abban a sorrendben jönnek, ahogy először feltűntek a fájlban.

:::

::: csharp

```csharp
Dictionary<string, int> km = new Dictionary<string, int>();
foreach (string[] ut in utak)
{
    string nev = ut[1];
    if (!km.ContainsKey(nev))
    {
        km[nev] = 0;
    }
    km[nev] += int.Parse(ut[2]);
}
```

A `ContainsKey` az első előforduláskor nullára állítja az összeget. A `Dictionary` kulcssorrendje nem garantált, ezért ha a sorrend számít (mint az 5. feladatban), vezess külön `List<string>` listát a nevekről.

:::

## Gyakori hibák

- **A fejléc feldolgozása.** Az első sor szövegeit nem lehet számmá alakítani; mindig hagyd ki.
- **A sorszám kimarad.** Az érettségin a `1. feladat` sor is a kimenet része; itt is: a tesztek ezt ellenőrzik.
- **Eltérő kimeneti forma.** Ha a leírás szerint `Utak szama: 10` a sor, akkor pontosan így írd (szóköz, kettőspont, kisbetűk). A kiírt szöveget másold ki a leírásból.
- **Holtverseny.** Maximumkeresésnél a `>` az első találatot tartja meg, a `>=` az utolsót. A leírás megmondja, melyik kell.
- **Nem szereplő sofőr.** A feladat külön esetként kezelte: ne írj ki `0` értéket, ha a kimeneti forma mást kér.

## Összefoglalás

- Egy fájlos feladat részfeladatai ugyanazt a fájlt használják; a feladat szövege adja meg a kimenet pontos formáját.
- Menet: leírás, fájlszerkezet, beolvasás, programozási tétel, kiírás, tesztelés kis adattal.
- Maximumkeresésnél a hozzá tartozó adatot is tárold; csoportonkénti összegzéshez szótár való.
- A fájlba írt eredményt olvasd vissza, hogy ellenőrizhesd.
- A rejtett tesztek más adatot adnak ugyanazon a néven: a program ne támaszkodjon a látható adatok tulajdonságaira.
