---
slug: kivalogatas-tetele
title: Kiválogatás
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi a kiválogatás?

A megszámlálás megmondja, **hány** elem felel meg a feltételnek. A **kiválogatás tétele** azt is megadja, **melyek** azok: egy új sorozatot épít a megfelelő elemekből. Olyan ez, mint amikor egy kosár gyümölcsből kiszeded az érett almákat egy másik kosárba.

## A mondatszerű leírás

> **Bemenet:** `N`, `A[1..N]`
>
> **Kimenet:** `B[1..Db]` (a feltételnek megfelelő elemek, az eredeti sorrendben)
>
> 1. A `Db` értéke legyen 0.
> 2. Ismételd az `i` értékével 1-től `N`-ig:
>    - Ha `A[i]` megfelel a feltételnek, akkor a `Db` értéke növekedjen 1-gyel, és `B[Db]` értéke legyen `A[i]`.
> 3. A program kimenete a `B` sorozat.

Az új sorozat hossza előre nem ismert, hiszen attól függ, hány elem felel meg. Ezért a számláló (`Db`) ugyanúgy szerepel, mint a megszámlálásnál: a tétel valójában megszámlálás, amely az elemeket is eltárolja.

## Csak kiírás: nem kell lista

Ha a találatokat csak ki kell írni, nem kell listát építeni: amint kiderül, hogy az elem megfelel, írd ki.

::: python

```python
n = int(input())
for _ in range(n):
    szam = int(input())
    if szam > 10:
        print(szam)
```

:::

::: csharp

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        for (int i = 0; i < n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam > 10)
            {
                Console.WriteLine(szam);
            }
        }
    }
}
```

:::

A `4`, majd `5`, `12`, `3`, `20` bemenetre a kimenet `12` és `20`, külön sorokban. Ha egyetlen szám sem nagyobb 10-nél, a program nem ír ki semmit.

## Lista építése

Ha a találatokra később még szükség van (például egy sorban kell kiírni őket, vagy meg kell számolni), gyűjtsd egy **listába**. Az üres lista a ciklus előtt jön létre, a találat pedig a végére kerül.

::: python

Az `append` a lista végére fűz egy elemet. A `" ".join(map(str, lista))` szóközzel elválasztva fűzi össze a lista számait.

```python
n = int(input())
lista = []
for _ in range(n):
    szam = int(input())
    if szam % 3 == 0:
        lista.append(szam)
if len(lista) == 0:
    print("NINCS")
else:
    print(" ".join(map(str, lista)))
```

:::

::: csharp

Az `Add` a lista végére tesz egy elemet; a `List<T>` használatához kell a `using System.Collections.Generic;` sor. A `string.Join(" ", lista)` szóközzel elválasztva fűzi össze a lista elemeit.

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        List<int> lista = new List<int>();
        for (int i = 0; i < n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam % 3 == 0)
            {
                lista.Add(szam);
            }
        }
        if (lista.Count == 0)
        {
            Console.WriteLine("NINCS");
        }
        else
        {
            Console.WriteLine(string.Join(" ", lista));
        }
    }
}
```

:::

A `6`, majd `3`, `4`, `9`, `10`, `12`, `7` bemenetre a kimenet `3 9 12`. Ha a lista üres, külön kell kezelni: a feladat szerint ilyenkor `NINCS` a kiírás.

## Szétválogatás két listába

Egy ciklusban akár két listát is építhetsz: az `if` ág az egyikbe, az `else` ág a másikba teszi az elemet. Így például a negatív és a nemnegatív számokat egy menetben szétválogathatod; az elemek az eredeti sorrendjüket megtartják.

## Egyedi elemek kiválogatása (emelt szint felé)

Az érettségin gyakori feladat, hogy minden értéket csak egyszer kell kiválogatni. A feltétel ilyenkor: *az elem még nincs a listában*.

::: python

```python
if szam not in egyedi:
    egyedi.append(szam)
```

:::

::: csharp

```csharp
if (!egyedi.Contains(szam))
{
    egyedi.Add(szam);
}
```

:::

A `3`, `1`, `3`, `2`, `1`, `3` sorozatból így a `3 1 2` lesz: minden érték az első megjelenésekor kerül a listába.

## Gyakori hibák

::: python

1. **A lista a ciklusban jön létre.** Ha a `lista = []` a ciklusmagban áll, minden lépésnél kiürül, és csak az utolsó találat marad meg.
2. **Az `append` helyett értékadás.** A `lista = szam` nem hozzáfűz, hanem felülírja a listát egy számmal.
3. **Üres lista kiírása.** Ha a feladat külön szöveget kér arra az esetre, amikor nincs találat, ellenőrizd a lista hosszát a kiírás előtt.

:::

::: csharp

1. **A lista a ciklusban jön létre.** Ha a `new List<int>()` a ciklusmagban áll, minden lépésnél kiürül, és csak az utolsó találat marad meg.
2. **Hiányzó `using System.Collections.Generic;`.** Nélküle a `List<int>` nem található, és a program nem fordul le.
3. **Üres lista kiírása.** Ha a feladat külön szöveget kér arra az esetre, amikor nincs találat, ellenőrizd a `Count` értékét a kiírás előtt.

:::

## Összefoglalás

- A kiválogatás kiszedi a feltételnek megfelelő elemeket, az eredeti sorrendben.
- Ha csak kiírni kell, a találatot rögtön kiírhatod; ha később kell, listába gyűjtsd.
- A listát a ciklus előtt hozd létre üresen.
- Több csoportra két (vagy több) listával választhatod szét az elemeket.
- Egyedi elemeknél a feltétel: még nincs a listában.
