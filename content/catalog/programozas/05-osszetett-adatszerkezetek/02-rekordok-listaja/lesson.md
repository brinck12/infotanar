---
slug: rekordok-listaja
title: Rekordok listája
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Egy rekord kevés: a rekordok listája

Az emelt érettségi feladatokban a bemenet jellemzően egy táblázat: egy fájl, amelynek minden sora egy rekord. A feladatok első lépése mindig ugyanaz: **beolvasod a sorokat, rekordokat készítesz belőlük, és a rekordokat listába teszed**. Utána a lista feldolgozása már ismerős: ugyanazok a bejárások és programozási tételek, csak a lista elemei nem számok, hanem rekordok, és a tételek egy-egy mezőn dolgoznak.

Ebben a leckében a bemenet formátuma mindig ez: az első sor a rekordok száma (N), utána N sor, amelyben a mezőket pontosvessző választja el.

```
3
Anna;9A;42
Bence;9B;37
Csilla;9A;45
```

## A lista felépítése

::: python

```python
from dataclasses import dataclass

@dataclass
class Tanulo:
    nev: str
    osztaly: str
    pont: int

n = int(input())
tanulok = []
for _ in range(n):
    resz = input().split(";")
    tanulok.append(Tanulo(resz[0], resz[1], int(resz[2])))
```

:::

::: csharp

```csharp
using System;
using System.Collections.Generic;

class Tanulo
{
    public string Nev;
    public string Osztaly;
    public int Pont;
}

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        var tanulok = new List<Tanulo>();
        for (int i = 0; i < n; i++)
        {
            string[] resz = Console.ReadLine().Split(';');
            tanulok.Add(new Tanulo { Nev = resz[0], Osztaly = resz[1], Pont = int.Parse(resz[2]) });
        }
    }
}
```

:::

A ciklus minden körben egy új rekordot készít, és a lista végére teszi. A lista a bemenet sorrendjét őrzi.

## Bejárás és mezők feldolgozása

A rekordok listáját úgy járod be, mint a számokét. A különbség annyi, hogy az elemnek a **mezőjét** használod.

::: python

```python
osszeg = 0
for t in tanulok:
    osszeg += t.pont
print(osszeg)
```

:::

::: csharp

```csharp
int osszeg = 0;
foreach (var t in tanulok)
{
    osszeg += t.Pont;
}
Console.WriteLine(osszeg);
```

:::

A példa adataival az eredmény `124`. Ugyanígy működik a megszámlálás (`t.osztaly == "9A"`) és az eldöntés is.

## Maximum rekordokon

Itt a legfontosabb szabály: a maximumkiválasztásnál **a rekordot (vagy az indexét) tartod meg, nem csak a számot**. Ha csak a legnagyobb pontszámot jegyzed meg, a nevét már nem tudod kiírni.

::: python

```python
legjobb = tanulok[0]
for t in tanulok:
    if t.pont > legjobb.pont:
        legjobb = t
print(legjobb.nev, legjobb.pont)
```

:::

::: csharp

```csharp
var legjobb = tanulok[0];
foreach (var t in tanulok)
{
    if (t.Pont > legjobb.Pont)
    {
        legjobb = t;
    }
}
Console.WriteLine(legjobb.Nev + " " + legjobb.Pont);
```

:::

Az eredmény `Csilla 45`. A szigorú `>` miatt holtversenynél az első marad meg; ezt a feladatok pontosan megmondják.

## Csoportosítás: szótár a rekordok mellett

Ha minden csoporthoz (például osztályhoz) külön eredmény kell, a csoport neve lesz a szótár kulcsa, az értéke pedig a csoport rekordjainak listája. A kulcsok sorrendjét külön listában érdemes őrizni, ha a feladat az első előfordulás sorrendjét kéri.

::: python

```python
csoport = {}
for t in tanulok:
    if t.osztaly not in csoport:
        csoport[t.osztaly] = []
    csoport[t.osztaly].append(t)
```

A Python szótára megőrzi a beszúrás sorrendjét, ezért a `for kulcs in csoport` ciklus az első előfordulás sorrendjében halad.

:::

::: csharp

```csharp
var csoport = new Dictionary<string, List<Tanulo>>();
var sorrend = new List<string>();
foreach (var t in tanulok)
{
    if (!csoport.ContainsKey(t.Osztaly))
    {
        csoport[t.Osztaly] = new List<Tanulo>();
        sorrend.Add(t.Osztaly);
    }
    csoport[t.Osztaly].Add(t);
}
```

A C# szótár bejárási sorrendje nem garantált, ezért az első előfordulás sorrendjét a `sorrend` lista őrzi.

:::

## Gyakori hibák

- A rekordot a ciklus előtt egyszer készíted el, és mindig ugyanazt módosítod: a lista végül ugyanannyiszor tartalmazza ugyanazt a példányt. Minden körben **új** rekordot készíts.
- A számot nem alakítod át, ezért szövegként hasonlítod össze (`"9" > "10"`).
- A maximumnál csak az értéket jegyzed meg, a rekordot nem.
- A `split` elválasztóját eltéveszted (`;` helyett szóköz).
- Üres bemenetnél (`N = 0`) a `tanulok[0]` hibát dob; a feladat kikötése megmondja, lehet-e ilyen.

## Összefoglalás

- A tipikus kezdés: N beolvasása, majd ciklusban sor → `split` → rekord → lista.
- A rekordok listáján a megszokott tételek működnek, a vizsgált mező szerint.
- Maximumnál a rekordot (vagy indexét) tartsd meg.
- Csoportosításhoz szótárat használj, a csoportnév a kulcs.
