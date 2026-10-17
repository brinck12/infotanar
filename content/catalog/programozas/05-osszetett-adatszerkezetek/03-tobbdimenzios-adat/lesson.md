---
slug: tobbdimenzios-adat
title: Többdimenziós adat
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Táblázat a memóriában

Sok adat természetesen táblázat alakú: egy sakktábla, egy mozi ülésrendje, egy napi hőmérséklet-táblázat városonként. Az ilyen adatot **kétdimenziós** (2D) szerkezetben tárolod: sorokból áll, minden sor ugyanannyi oszlopot tartalmaz. Egy elemet két index azonosít: a sor és az oszlop sorszáma, mindkettő 0-tól indul.

Ebben a leckében a bemenet formátuma: az első sor `R C` (a sorok és az oszlopok száma), utána R sor, mindegyikben C egész szám szóközzel elválasztva.

```
2 3
5 1 4
2 8 3
```

## Mátrix beolvasása

::: python

Pythonban a 2D adat listák listája: a külső lista egy eleme egy sor.

```python
r, c = input().split()
r = int(r)
c = int(c)
matrix = []
for _ in range(r):
    sor = input().split()
    matrix.append([int(x) for x in sor])
print(matrix[1][2])
```

Az utolsó sor `3`-at ír ki: az 1. sor 2. eleme (a számozás 0-tól indul). Az `[int(x) for x in sor]` rövid írásmód: minden szövegből számot csinál, és listába teszi.

:::

::: csharp

C#-ban kétféle módon tárolhatsz táblázatot. A **téglalap alakú tömb** (`int[,]`) fix méretű, kétindexes. A **fogazott tömb** (`int[][]`) tömbök tömbje, ahol a sorok hossza akár eltérhet is. Feladatnál az `int[,]` kényelmes, ha a méret biztosan R × C.

```csharp
using System;

class Program
{
    static void Main()
    {
        string[] meret = Console.ReadLine().Split(' ');
        int r = int.Parse(meret[0]);
        int c = int.Parse(meret[1]);
        int[,] matrix = new int[r, c];
        for (int i = 0; i < r; i++)
        {
            string[] sor = Console.ReadLine().Split(' ');
            for (int j = 0; j < c; j++)
            {
                matrix[i, j] = int.Parse(sor[j]);
            }
        }
        Console.WriteLine(matrix[1, 2]);
    }
}
```

Az eredmény `3`. A fogazott tömbnél a létrehozás `new int[r][]`, az elemhozzáférés `matrix[i][j]`. A sorokat egyenként kell létrehozni: `matrix[i] = new int[c];`.

:::

## Sorok és oszlopok bejárása

A mátrix bejárása **egymásba ágyazott ciklus**: a külső ciklus a sorokon, a belső az oszlopokon megy végig. Így az elemek soronként követik egymást.

::: python

```python
for i in range(r):
    for j in range(c):
        print(matrix[i][j], end=" ")
    print()
```

:::

::: csharp

```csharp
for (int i = 0; i < r; i++)
{
    for (int j = 0; j < c; j++)
    {
        Console.Write(matrix[i, j] + " ");
    }
    Console.WriteLine();
}
```

:::

A sorösszeg a belső ciklusban gyűlik, és a belső ciklus **elején** nullázódik. Az oszlopösszegnél a két ciklus szerepe felcserélődik: a külső ciklus megy az oszlopokon (`j`), a belső a sorokon (`i`), és az elem továbbra is `matrix[i][j]`. A példa mátrixszal a sorösszegek `10` és `13`, az oszlopösszegek `7`, `9`, `7`.

## Átlók

Négyzetes mátrixban (R = C = N) a **főátló** elemei azok, ahol a sor és az oszlop indexe egyenlő (`i == j`). A **mellékátló** elemeinél `i + j == N - 1`. Az átlók bejárásához nem kell két ciklus, elég egy: az `i` fut, a másik index kiszámolható.

::: python

```python
fo = 0
mellek = 0
for i in range(n):
    fo += matrix[i][i]
    mellek += matrix[i][n - 1 - i]
```

:::

::: csharp

```csharp
int fo = 0;
int mellek = 0;
for (int i = 0; i < n; i++)
{
    fo += matrix[i, i];
    mellek += matrix[i, n - 1 - i];
}
```

:::

## Szomszédok és a szélek

Sok feladat az elem **szomszédjait** nézi: a fölötte, alatta, balra és jobbra állót. A szélső elemnek nincs minden szomszédja, ezért az indexet **előbb ellenőrizd**, és csak utána olvasd ki az elemet. Ha az `i - 1` kisebb 0-nál vagy az `i + 1` eléri R-et, az a szomszéd nincs. Az ellenőrzés elhagyása Pythonban hibát nem jelez, de a negatív index a lista végéről olvas (rossz eredmény!), C#-ban pedig kivételt dob.

## Gyakori hibák

- Az `r` és `c` felcserélése: a sorok száma az első szám.
- A sorösszeg nullázását a belső ciklus belsejébe teszed, vagy a külső ciklus elé.
- Pythonban a `[[0] * c] * r` ugyanazt a sort ismétli r-szer; ha módosítod, mind változik. Használj ciklust vagy `[[0] * c for _ in range(r)]` alakot.
- A negatív index Pythonban nem hibát ad, hanem hátulról olvas.
- Az 1-től számozott kimenetet (soronként "3. sor") elfelejted eggyel megnövelni.

## Összefoglalás

- A 2D adat sorok és oszlopok táblázata; elemét két index adja meg, 0-tól.
- Python: listák listája; C#: `int[,]` vagy fogazott `int[][]` tömb.
- Bejárás: egymásba ágyazott ciklus, a külső a sorokon megy.
- Főátló: `i == j`, mellékátló: `i + j == N - 1`.
- Szomszédnál a határokat előbb ellenőrizd.
