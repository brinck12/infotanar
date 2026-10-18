---
slug: lista-tomb
title: Lista és tömb
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mit tegyünk, ha sok adatunk van?

Eddig minden értéknek külön változót adtál: `a`, `b`, `nev`. De mi van, ha a program száz számot kap? Nem írhatsz száz változót! Erre való a **lista** (C#-ban a **tömb** és a `List`): egyetlen név alatt tárol sok, egymás után sorakozó értéket, mint egy sorszámozott fiókos szekrény.

Az egyes értékeket **elemnek** hívjuk. Minden elemnek van **indexe**, vagyis sorszáma, és az index **nullától** indul: az első elem indexe 0, a másodiké 1, és így tovább.

## Lista létrehozása

::: python

Pythonban a lista szögletes zárójelek között, vesszővel elválasztva adható meg. Az üres lista `[]`.

```python
jegyek = [5, 4, 3, 5]
nevek = ["Anna", "Béla"]
ures = []
```

:::

::: csharp

C#-ban kétféle sorozatot használunk. A **tömb** méretét létrehozáskor meg kell adni, és később nem változik. A **`List<int>`** viszont szabadon nőhet, ezért a feladatokban többnyire ezt fogjuk használni. A `List` használatához kell a `using System.Collections.Generic;` sor.

```csharp
int[] jegyek = { 5, 4, 3, 5 };
int[] tiz = new int[10];            // tíz darab 0 értékű elem
List<int> szamok = new List<int>(); // üres lista
```

:::

## Elemek elérése és a hossz

Az elemet a változó neve után szögletes zárójelbe írt indexszel éred el. Az utolsó elem indexe mindig eggyel kisebb, mint az elemek száma.

::: python

A `len(lista)` megadja az elemek számát.

```python
jegyek = [5, 4, 3, 5]
print(jegyek[0])            # 5, az első elem
print(jegyek[2])            # 3
print(len(jegyek))          # 4
print(jegyek[len(jegyek) - 1])  # 5, az utolsó elem
jegyek[1] = 2               # a második elem felülírása
```

:::

::: csharp

A tömb hossza a `Length`, a `List` elemszáma a `Count`.

```csharp
int[] jegyek = { 5, 4, 3, 5 };
Console.WriteLine(jegyek[0]);                 // 5, az első elem
Console.WriteLine(jegyek[2]);                 // 3
Console.WriteLine(jegyek.Length);             // 4
Console.WriteLine(jegyek[jegyek.Length - 1]); // 5, az utolsó elem
jegyek[1] = 2;                                // a második elem felülírása
```

:::

Ha olyan indexet kérsz, ami nincs (például a 4-es indexet egy négyelemű listában), a program hibával leáll. Ez az egyik leggyakoribb kezdő hiba.

## Elem hozzáadása

::: python

Az `append` a lista végére fűz egy új elemet.

```python
szamok = []
szamok.append(10)
szamok.append(20)
print(szamok)       # [10, 20]
```

:::

::: csharp

A `List` `Add` metódusa a végére fűz egy új elemet. (A sima tömbhöz nem lehet hozzáadni, ezért kell a `List`.)

```csharp
List<int> szamok = new List<int>();
szamok.Add(10);
szamok.Add(20);
Console.WriteLine(szamok.Count);   // 2
```

:::

## Bejárás

A lista igazi ereje, hogy ciklussal végigmehetsz rajta. Két módszer van: az indexekkel és az elemekkel.

::: python

```python
jegyek = [5, 4, 3, 5]

for i in range(len(jegyek)):    # indexekkel: i = 0, 1, 2, 3
    print(i, jegyek[i])

for jegy in jegyek:             # közvetlenül az elemekkel
    print(jegy)
```

Visszafelé az `range` három számot is kaphat: kezdet, vég (ez már nem tartozik bele) és lépés. A `range(3, -1, -1)` a 3, 2, 1, 0 számokat adja.

:::

::: csharp

```csharp
for (int i = 0; i < jegyek.Length; i++)   // indexekkel
{
    Console.WriteLine(i + " " + jegyek[i]);
}

foreach (int jegy in jegyek)              // közvetlenül az elemekkel
{
    Console.WriteLine(jegy);
}
```

Visszafelé úgy járhatsz be, hogy a ciklusváltozó hátulról indul és csökken: `for (int i = jegyek.Length - 1; i >= 0; i--)`.

:::

Ha csak az értékekre van szükséged, az elemes bejárás rövidebb. Ha az indexre is (például a fordított sorrendhez), az indexes kell.

## Teljes példa: N szám beolvasása és összege

A program előbb beolvassa, hány szám jön, aztán magukat a számokat, és a végén összeadja őket.

::: python

```python
n = int(input())
szamok = []
for i in range(n):
    szamok.append(int(input()))

osszeg = 0
for szam in szamok:
    osszeg = osszeg + szam
print(osszeg)
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
        int n = int.Parse(Console.ReadLine());
        List<int> szamok = new List<int>();
        for (int i = 0; i < n; i++)
        {
            szamok.Add(int.Parse(Console.ReadLine()));
        }

        int osszeg = 0;
        foreach (int szam in szamok)
        {
            osszeg = osszeg + szam;
        }
        Console.WriteLine(osszeg);
    }
}
```

:::

Ha a bemenet `3`, `10`, `20`, `5` (külön sorokban), a kimenet `35`. Próbáld ki, majd írd át úgy, hogy a legnagyobb elemet írja ki!

## Gyakori hibák

::: python

1. **Eggyel elcsúszott index.** A négyelemű lista utolsó eleme `lista[3]`, nem `lista[4]`. Az utolsó mindig `lista[len(lista) - 1]`.
2. **Az első elem sorszáma 1-nek tűnik.** Az index nulláról indul, a "harmadik elem" a `lista[2]`.
3. **Üres listához indexelés.** Üres listának nincs `lista[0]` eleme; előbb ellenőrizd a hosszát.
4. **Szöveg a számok között.** Az `input()` szöveget ad: a listába `int(...)` után tedd, különben nem lehet vele számolni.

:::

::: csharp

1. **Eggyel elcsúszott index.** A négyelemű tömb utolsó eleme `jegyek[3]`, nem `jegyek[4]`. A ciklusfeltétel `i < jegyek.Length`, nem `<=`.
2. **Az első elem sorszáma 1-nek tűnik.** Az index nulláról indul, a "harmadik elem" a `jegyek[2]`.
3. **`Length` és `Count` összekeverése.** A tömbnek `Length`, a `List`-nek `Count` van.
4. **Üres listához indexelés.** Üres `List`-nek nincs `[0]` eleme; előbb ellenőrizd a `Count` értékét.

:::

## Összefoglalás

::: python

- Lista: `[1, 2, 3]`, üres: `[]`; az index 0-tól indul.
- Elem: `lista[i]`; hossz: `len(lista)`; hozzáadás: `lista.append(x)`.
- Bejárás: `for elem in lista` vagy `for i in range(len(lista))`.

:::

::: csharp

- Tömb: `int[] t = { 1, 2, 3 };`, nőhető lista: `List<int>`; az index 0-tól indul.
- Elem: `t[i]`; hossz: `Length` (tömb), `Count` (`List`); hozzáadás: `lista.Add(x)`.
- Bejárás: `foreach (int e in lista)` vagy `for (int i = 0; i < lista.Count; i++)`.

:::

A feladatokban sok számot kell majd beolvasnod és feldolgoznod: ez a lista igazi terepe.
