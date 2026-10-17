---
slug: szetvalogatas
title: Szétválogatás
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi a szétválogatás?

A kiválogatásnál egy feltételnek megfelelő elemeket gyűjtöttél egy új listába, a többit eldobtad. Gyakran viszont **mindkét csoportra szükség van**: a megfelelőkre és a többire is. Például egy osztálynévsorból külön listába kerülnek az átmenők és a bukottak. Ez a **szétválogatás**: egy sorozatból, egyetlen bejárással, egy feltétel szerint két sorozatot készítesz. Minden elem pontosan az egyik listába kerül, és a listákban az elemek az eredeti sorrendben maradnak.

## Az algoritmus mondatokban

Az érettségi leírásai a megoldást kódmentes, mondatszerű formában kérik vagy adják meg. Így néz ki a szétválogatás:

> **Bemenet:** `N` elemű sorozat, `F` feltétel
> **Kimenet:** `A` lista (a feltételnek megfelelők), `B` lista (a többi)
>
> 1. Az `A` és a `B` lista legyen üres.
> 2. Vedd sorra a sorozat elemeit az elsőtől az utolsóig. Minden elemre:
>    1. Ha az elem megfelel az `F` feltételnek, tedd az `A` lista végére.
>    2. Különben tedd a `B` lista végére.
> 3. Vége. Az `A` és a `B` lista együtt pontosan annyi elemet tartalmaz, mint a sorozat.

Érdemes megjegyezni a **próbát**: `len(A) + len(B) == N`. Ha ez nem teljesül, valahol elveszett vagy duplázódott egy elem.

## Kódolás

::: python

```python
szamok = [4, 7, 10, 3, 8]
paros = []
paratlan = []
for x in szamok:
    if x % 2 == 0:
        paros.append(x)
    else:
        paratlan.append(x)
print(paros)
print(paratlan)
```

Kimenet:

```
[4, 10, 8]
[7, 3]
```

:::

::: csharp

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        var szamok = new List<int> { 4, 7, 10, 3, 8 };
        var paros = new List<int>();
        var paratlan = new List<int>();
        foreach (int x in szamok)
        {
            if (x % 2 == 0)
            {
                paros.Add(x);
            }
            else
            {
                paratlan.Add(x);
            }
        }
        Console.WriteLine(string.Join(" ", paros));
        Console.WriteLine(string.Join(" ", paratlan));
    }
}
```

Kimenet:

```
4 10 8
7 3
```

:::

Próbáld ki: válogasd szét ugyanezt a sorozatot úgy, hogy a 5-nél nagyobbak és a többiek kerüljenek külön listába.

## Szétválogatás rekordokon

Rekordoknál ugyanez a minta: a feltétel valamelyik mezőre vonatkozik, és a **teljes rekordot** tesszük a megfelelő listába. A névsort például így osztod ketté:

::: python

```python
atment = []
bukott = []
for t in tanulok:
    if t.jegy >= 2:
        atment.append(t)
    else:
        bukott.append(t)
```

:::

::: csharp

```csharp
var atment = new List<Tanulo>();
var bukott = new List<Tanulo>();
foreach (var t in tanulok)
{
    if (t.Jegy >= 2)
    {
        atment.Add(t);
    }
    else
    {
        bukott.Add(t);
    }
}
```

:::

## Több csoport, két menet

A szétválogatás nem csak kettéosztás lehet. Három csoportnál (negatív, nulla, pozitív) három listád van, és `if / elif / else` dönt. Ha a feltétel egy **összesítéstől** függ (például "az átlagnál hosszabb szavak"), két menet kell: az első menetben kiszámolod az összesítést (összegzés), a másodikban szétválogatsz. Az átlagot nem tudod menet közben, mert a végén derül ki.

## Gyakori hibák

- Csak a megfelelőket tárolod, a többit elfelejted (ez kiválogatás, nem szétválogatás).
- Egy elem mindkét listába bekerül, mert a második `if` nem `else` ág.
- Az üres lista kiírásánál a feladat külön jelet kér (például `-`); ezt az esetet teszteld.
- Az átlaggal való összehasonlításnál az egész osztás miatt eltér az eredmény. A `hossz * N > osszeg` alak elkerüli az osztást.
- Az elem és a rekord keveredik: a rekord egészét tedd a listába, ne csak a mezőjét, ha később a többi mezőre is szükség lesz.

## Összefoglalás

- A szétválogatás egy bejárással két listát készít egy feltétel szerint; a sorrend megmarad.
- Mondatszerű leírása: két üres lista, minden elemre `ha feltétel, A végére, különben B végére`.
- Ellenőrzés: a két lista elemszáma összesen N.
- Több csoportnál több lista; összesítéstől függő feltételnél két menet kell.
