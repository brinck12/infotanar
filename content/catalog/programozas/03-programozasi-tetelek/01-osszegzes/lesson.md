---
slug: osszegzes-tetele
title: Összegzés
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az az összegzés?

Mennyi pénz van a perselyedben, ha minden érmét egyenként beledobtál? Úgy számolod ki, hogy elölről indulsz, és minden érmével növeled a végösszeget. Ugyanezt csinálja az **összegzés tétele**: egy számsorozat elemeit egyenként hozzáadja egy közös összeghez. Az ilyen, sokszor használt gondolatmenetet **programozási tételnek** hívjuk. Az érettségin is ezekből építkeznek a feladatok.

## A mondatszerű leírás

Az érettségin az algoritmust először mondatokban kell leírni vagy értelmezni, programkód nélkül. Az összegzés így szól:

> **Bemenet:** `N` (a számok darabszáma), `A[1..N]` (a számok)
>
> **Kimenet:** `Osszeg` (a számok összege)
>
> 1. Az `Osszeg` értéke legyen 0.
> 2. Ismételd az `i` értékével 1-től `N`-ig:
>    - Az `Osszeg` értéke növekedjen `A[i]`-vel.
> 3. A program kimenete az `Osszeg`.

A kulcs a **kezdőérték**: az összeg 0-ról indul, mert még semmit nem adtunk hozzá. A 0 az összeadás "semleges eleme": hozzáadva nem változtat az eredményen.

## Összegzés kódban

::: python

A **halmozó változó** (`osszeg`) a ciklus előtt kap kezdőértéket, a ciklusmagban pedig minden szám hozzáadódik. A `+=` jelentése: "növeld ennyivel".

```python
n = int(input())
osszeg = 0
for _ in range(n):
    szam = int(input())
    osszeg += szam
print(osszeg)
```

:::

::: csharp

A **halmozó változó** (`osszeg`) a ciklus előtt kap kezdőértéket, a ciklusmagban pedig minden szám hozzáadódik. A `+=` jelentése: "növeld ennyivel".

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        int osszeg = 0;
        for (int i = 0; i < n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            osszeg += szam;
        }
        Console.WriteLine(osszeg);
    }
}
```

:::

Ha a bemenet `3`, majd `5`, `10`, `15`, a kimenet `30` lesz. Próbáld ki, és kövesd végig papíron, hogyan változik az `osszeg`: 0, 5, 15, 30.

## Átlag

Az átlag az összeg osztva a darabszámmal. Az összeget ugyanúgy gyűjtöd, az osztás csak a ciklus **után** jön.

::: python

Pythonban a `/` osztás mindig tizedes törtet ad. A `:.2f` két tizedesjegyre kerekít.

```python
atlag = osszeg / n
print(f"{atlag:.2f}")
```

:::

::: csharp

C#-ban két egész szám osztása egész osztás, ezért az egyiket `double`-ra kell alakítani. A `"F2"` két tizedesjegyre kerekít; az `InvariantCulture` miatt a tizedesjel mindig pont (ehhez kell a `using System.Globalization;` sor).

```csharp
double atlag = osszeg / (double)n;
Console.WriteLine(atlag.ToString("F2", CultureInfo.InvariantCulture));
```

:::

Ha a számok `4`, `5`, `8`, az összeg 17, az átlag `5.67`.

## Feltételes összegzés

Néha nem minden számot kell összeadni, csak azokat, amelyek megfelelnek egy feltételnek, például csak a pozitívakat. Ilyenkor az összeadás elé egy `if` kerül:

> 2. Ismételd az `i` értékével 1-től `N`-ig:
>    - Ha `A[i] > 0`, akkor az `Osszeg` értéke növekedjen `A[i]`-vel.

::: python

```python
if szam > 0:
    osszeg += szam
```

:::

::: csharp

```csharp
if (szam > 0)
{
    osszeg += szam;
}
```

:::

A kezdőérték itt is 0, tehát ha egyetlen szám sem felel meg, az eredmény 0 lesz. Ez helyes: az üres összeg nulla.

## Számjegyek összege és futó összeg

Az összegzés nem csak a beolvasott számokra működik. A számjegyek összegénél a számot **szövegként** olvasod be, és karakterenként haladsz végig rajta; minden karaktert számjeggyé alakítasz, mielőtt hozzáadod.

::: python

```python
szoveg = input()
osszeg = 0
for jegy in szoveg:
    osszeg += int(jegy)
```

:::

::: csharp

C#-ban egy számjegy karakter és a `'0'` karakter különbsége a számjegy értéke.

```csharp
string szoveg = Console.ReadLine();
int osszeg = 0;
foreach (char jegy in szoveg)
{
    osszeg += jegy - '0';
}
```

:::

A **futó összeg** annyiban más, hogy az `osszeg` értékét nem a ciklus végén, hanem minden lépés után kiírod. Így látod, hogyan épül fel az összeg.

## Gyakori hibák

::: python

1. **Hiányzó kezdőérték.** Ha elfelejted az `osszeg = 0` sort, a program hibával áll le, mert még nincs ilyen változó.
2. **A kezdőérték a ciklusban van.** Ha az `osszeg = 0` a ciklusmagba kerül, minden lépésnél nullázódik, és az eredmény csak az utolsó szám lesz.
3. **Számmá alakítás hiánya.** Az `input()` szöveget ad; az `int(...)` nélkül az összeadás hibát okoz.

:::

::: csharp

1. **Hiányzó kezdőérték.** A C# nem engedi használni azt a változót, amely nem kapott értéket, ezért a program le sem fordul.
2. **A kezdőérték a ciklusban van.** Ha az `int osszeg = 0;` a ciklusmagba kerül, minden lépésnél nullázódik, és az eredmény csak az utolsó szám lesz.
3. **Egész osztás.** Az `osszeg / n` két egész szám esetén egész eredményt ad: az átlagnál alakítsd az egyiket `double`-ra.

:::

## Összefoglalás

- Az összegzés tétele egy sorozat elemeit összeadja: kezdőérték 0, ciklus, hozzáadás.
- A kezdőértéket mindig a ciklus **előtt** állítsd be.
- Feltételes összegzésnél az összeadás elé `if` kerül.
- Az átlag az összeg és a darabszám hányadosa, a ciklus után számolva.

A feladatoknál az érettségi stílusát is gyakorold: előbb gondold végig a mondatszerű leírást, és csak aztán kódolj.
