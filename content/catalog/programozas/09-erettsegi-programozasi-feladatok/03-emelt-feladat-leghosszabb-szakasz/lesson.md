---
slug: emelt-feladat-leghosszabb-szakasz
title: "Emelt feladat: leghosszabb szakasz"
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Sorozat, amelyben szakaszokat keresünk

Az előző leckében sorokból rekordokat építettél. Most olyan adatot kapsz, amelynek a **sorrendje** számít: egy folyó vízállását mérik naponta, és a fájl sorai időrendben követik egymást. Az ilyen adatot **sorozatnak** hívjuk. A sorozatos feladatok kedvenc kérdései:

- Mikor volt valami **először**, és mikor **utoljára**?
- Mekkora a **leghosszabb egybefüggő szakasz**, amelyben egy feltétel teljesül?
- Hány ilyen szakasz van?

A beolvasás ugyanaz a rekordos minta, mint eddig: egy `Meres` osztály (dátum, vízállás) és egy lista. Az adatfájl a `vizallas.txt`, tabulátorral tagolt, fejlécsoros, minden sor az előző nap utáni nap mérése.

```python
class Meres:
    def __init__(self, datum, allas):
        self.datum = datum
        self.allas = allas

with open("vizallas.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
meresek = []
for sor in sorok[1:]:
    r = sor.split("\t")
    meresek.append(Meres(r[0], int(r[1])))
```

```csharp
using System;
using System.Collections.Generic;
using System.IO;

class Meres
{
    public string Datum;
    public int Allas;
}

class Program
{
    static void Main()
    {
        string[] sorok = File.ReadAllLines("vizallas.txt");
        List<Meres> meresek = new List<Meres>();
        for (int i = 1; i < sorok.Length; i++)
        {
            string[] r = sorok[i].Split('\t');
            Meres m = new Meres();
            m.Datum = r[0];
            m.Allas = int.Parse(r[1]);
            meresek.Add(m);
        }
        Console.WriteLine(meresek.Count);
    }
}
```

A dátumot nem kell dátumtípusra alakítanod: a `2024-03-14` alakú szöveget elég kiírni, és mivel a napok hézag nélkül követik egymást, a lista **indexe** már elárulja a sorrendet. Próbáld ki: írd ki az első és az utolsó mérést.

## Először és utoljára

Tegyük fel, hogy a legmagasabb vízállás 230 cm, és kíváncsiak vagyunk, mikor volt ekkora **először** és **utoljára**. A trükk a két változó kezelésében van:

- az **első** előfordulást csak akkor jegyezzük meg, ha még nincs (a változó üres: `None` / `null`),
- az **utolsó** előfordulást minden találatkor felülírjuk.

```python
elso = None
utolso = None
for m in meresek:
    if m.allas == 230:
        if elso is None:
            elso = m.datum
        utolso = m.datum
```

```csharp
string elso = null;
string utolso = null;
foreach (Meres m in meresek)
{
    if (m.Allas == 230)
    {
        if (elso == null)
        {
            elso = m.Datum;
        }
        utolso = m.Datum;
    }
}
```

Ha egyszer volt csak ekkora a vízállás, a két változó ugyanazt a dátumot tartalmazza. Ha egyszer sem, mindkettő üres marad: ezt a feladat szövege szerint külön kell kezelned. A maximum értékét magát egy előző ciklusban keresd meg, vagy ha egy menetben akarod, amikor új maximumot találsz, nullázd az első/utolsó változókat. Próbáld ki mindkét módon.

## A leghosszabb szakasz

Ez az emelt feladatok legjellemzőbb eleme. A gondolat: haladj végig a sorozaton, és **tartsd számon az éppen folyó szakasz hosszát**.

- Ha a feltétel teljesül erre az elemre, a hossz eggyel nő.
- Ha nem, a szakasz véget ér, a hossz visszaáll nullára (vagy egyre, a feladattól függően).
- Közben, valahányszor a folyó szakasz hosszabb az eddigi legjobbnál, jegyezd meg a hosszát **és a kezdetét**.

A kezdetet nem kell külön eltárolni: a szakasz az `i` indexen végződik, hossza `hossz`, tehát `i - hossz + 1` indexen kezdődött.

Példa: a leghosszabb szakasz, amelyben a vízállás minden napon 200 cm fölött van.

```python
legjobb_hossz = 0
legjobb_kezdet = 0
hossz = 0
for i in range(len(meresek)):
    if meresek[i].allas > 200:
        hossz += 1
        if hossz > legjobb_hossz:
            legjobb_hossz = hossz
            legjobb_kezdet = i - hossz + 1
    else:
        hossz = 0
```

```csharp
int legjobbHossz = 0;
int legjobbKezdet = 0;
int hossz = 0;
for (int i = 0; i < meresek.Count; i++)
{
    if (meresek[i].Allas > 200)
    {
        hossz++;
        if (hossz > legjobbHossz)
        {
            legjobbHossz = hossz;
            legjobbKezdet = i - hossz + 1;
        }
    }
    else
    {
        hossz = 0;
    }
}
```

A végén `legjobb_hossz == 0` azt jelenti, hogy egy nap sem volt 200 felett. Egyébként a szakasz a `legjobb_kezdet` és `legjobb_kezdet + legjobb_hossz - 1` index között van, ezeken az indexeken olvasod ki a dátumokat.

**Holtverseny:** ha két szakasz ugyanolyan hosszú, a `>` az **előbb kezdődőt** hagyja meg, a `>=` a **később kezdődőt**. A feladat mindig megmondja, melyik kell: a rejtett tesztek között biztosan van ilyen eset.

## Szakasz, amely az előző elemhez viszonyít

Nem minden szakasz-feltétel egy elemre vonatkozik. Az "emelkedő szakasz" azt jelenti, hogy minden nap **nagyobb az előzőnél**; ilyenkor két szomszédos elemet hasonlítasz össze. Az `i = 1` indexről indulsz, és az első elem magában mindig egy 1 hosszú szakasz:

```python
hossz = 1
for i in range(1, len(meresek)):
    if meresek[i].allas > meresek[i - 1].allas:
        hossz += 1
    else:
        hossz = 1
```

```csharp
int hossz = 1;
for (int i = 1; i < meresek.Count; i++)
{
    if (meresek[i].Allas > meresek[i - 1].Allas)
    {
        hossz++;
    }
    else
    {
        hossz = 1;
    }
}
```

Figyeld meg a különbséget: az egyelemű feltételnél a hossz nullára áll vissza, a szomszédos összehasonlításnál egyre, mert az aktuális elem maga már egy új szakasz kezdete. A két változatot a feladat szövegéből kell felismerni.

## Összes szakasz: megszámlálás és felsorolás

Ha nem a leghosszabbat, hanem **az összes** szakaszt kell megadni (például azokat, amelyek legalább 3 naposak), a belső ciklusos módszer a legátláthatóbb: ha elkezdődik egy szakasz, egy második ciklussal lépj a végéig, majd ugorj a végén túlra.

```python
hullamok = []
i = 0
while i < len(meresek):
    if meresek[i].allas > 200:
        j = i
        while j + 1 < len(meresek) and meresek[j + 1].allas > 200:
            j += 1
        if j - i + 1 >= 3:
            hullamok.append((i, j))
        i = j + 1
    else:
        i += 1
```

```csharp
List<int[]> hullamok = new List<int[]>();
int i = 0;
while (i < meresek.Count)
{
    if (meresek[i].Allas > 200)
    {
        int j = i;
        while (j + 1 < meresek.Count && meresek[j + 1].Allas > 200)
        {
            j++;
        }
        if (j - i + 1 >= 3)
        {
            hullamok.Add(new int[] { i, j });
        }
        i = j + 1;
    }
    else
    {
        i++;
    }
}
```

A `j + 1 < len(...)` feltétel az, ami megóvja a programot a túlindexeléstől, ha a szakasz a fájl legvégén ér véget. Ez a leggyakoribb rejtett tesztek által kiszúrt hiba.

## Gyakori hibák

- **Az utolsó szakasz elvész.** Ha a szakaszt csak akkor értékeled, amikor véget ér, a fájl végén futó szakaszra nem kerül sor. A "folyamatos hossz" módszer ezt eleve elkerüli, mert minden lépésben frissít.
- **Rossz visszaállítás.** Nulla vagy egy a hossz? Az egyelemű feltételnél nulla, a szomszédos összehasonlításnál egy.
- **Holtverseny.** `>` vagy `>=`: a feladat dönti el.
- **Egyelemű sorozat.** Az `i - 1` indexű hozzáférés ellenőrzés nélkül hibát okoz: kezdd az `i = 1` indexről, és az egyelemű fájlra gondolj külön.
- **Kezdőindex.** `i - hossz + 1`, nem `i - hossz`.
- **Szigorú és nem szigorú összehasonlítás.** "Nagyobb" és "legalább" nem ugyanaz; a küszöbbel egyenlő érték nem számít "fölöttinek".

## Összefoglalás

- A sorozatnál az elemek sorrendje számít; a dátumot elég szövegként kezelni, ha az adatok hézag nélkül következnek.
- "Először": egyszer állítsd be, ha még üres. "Utoljára": minden találatkor írd felül.
- Leghosszabb szakasz: folyó hossz + eddigi legjobb hossz és kezdőindex; a kezdet `i - hossz + 1`.
- Az egyelemű feltételnél nullára, a szomszédos összehasonlításnál egyre áll vissza a hossz.
- Az összes szakasz felsorolásához belső ciklus és a szakasz utáni ugrás kell; ügyelj a fájl végére.
- A holtverseny, az üres eset és az egyelemű sorozat a rejtett tesztek kedvencei.
