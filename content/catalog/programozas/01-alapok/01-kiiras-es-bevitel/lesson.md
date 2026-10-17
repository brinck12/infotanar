---
slug: kiiras-es-bevitel
title: Kiírás és bevitel
position: 0
free: true
published: false
reviewed_by:
reviewed_at:
---

## Mi az a program?

A program utasítások sorozata, amelyet a számítógép egymás után, fentről lefelé hajt végre. Minden program két dolgot csinál: adatot kap (bevitel), és eredményt mutat (kiírás). Ebben a leckében mindkettőt megtanulod. A fenti lapfülön választhatsz, hogy Pythonban vagy C#-ban látod a leckét; a választásod megmarad.

## Kiírás

::: python

A képernyőre írást a `print` utasítás végzi. A kiírandó szöveget idézőjelek közé kell tenni.

```python
print("Helló, világ!")
```

:::

::: csharp

A képernyőre írást a `Console.WriteLine` utasítás végzi. A kiírandó szöveget idézőjelek közé kell tenni, az utasítást pontosvessző zárja.

```csharp
Console.WriteLine("Helló, világ!");
```

A példák sokszor csak egy-egy utasítást mutatnak; egy teljes C# programhoz kell a `using System;` sor, egy osztály (`class Program`) és a `static void Main()` metódus, ahogy a lenti teljes példában is látod. A feladatoknál mindig teljes programot írj.

:::

A kiírás végén az utasítás új sort kezd, tehát a következő kiírás a következő sorba kerül.

## Bevitel

::: python

A felhasználótól az `input()` kér be egy sort. A beolvasott érték mindig **szöveg**; ha számként akarod használni, át kell alakítani az `int(...)` függvénnyel.

```python
nev = input()
szam = int(input())
```

:::

::: csharp

A felhasználótól a `Console.ReadLine()` kér be egy sort. A beolvasott érték mindig **szöveg**; ha számként akarod használni, át kell alakítani az `int.Parse(...)` metódussal.

```csharp
var nev = Console.ReadLine();
var szam = int.Parse(Console.ReadLine());
```

:::

A `nev` és a `szam` **változó**: egy névvel ellátott hely, ahol a program egy értéket tárol.

## Bevitel és kiírás együtt

Az alábbi teljes program beolvassa a nevedet, és köszön neked.

::: python

Pythonban a `+` összefűzi a szövegeket.

```python
nev = input()
print("Szia, " + nev + "!")
```

:::

::: csharp

C#-ban a `$"..."` szöveg fűzi össze a szöveget és a változókat: a `{}` közé írt változó értéke behelyettesítődik.

```csharp
using System;

class Program
{
    static void Main()
    {
        var nev = Console.ReadLine();
        Console.WriteLine($"Szia, {nev}!");
    }
}
```

:::

Ha a bemenet `Anna`, a kimenet `Szia, Anna!` lesz.

## Gyakori hibák

::: python

1. **Hiányzó idézőjel vagy zárójel.** A `print("Szia)` hibaüzenetet ad, mert a szöveg és a zárójel nincs lezárva.
2. **Szám beolvasása átalakítás nélkül.** Az `input()` szöveget ad, ezért a `"2" + "3"` eredménye `23`, nem `5`. Számoláshoz mindig alakítsd át számmá: `int(...)`.

:::

::: csharp

1. **Hiányzó idézőjel, zárójel vagy pontosvessző.** A `Console.WriteLine("Szia";` hibaüzenetet ad, mert a szöveg és a zárójel nincs lezárva.
2. **Szám beolvasása átalakítás nélkül.** A `Console.ReadLine()` szöveget ad, ezért a `"2" + "3"` eredménye `23`, nem `5`. Számoláshoz mindig alakítsd át számmá: `int.Parse(...)`.

:::

## Összefoglalás

::: python

- Kiírás: `print(...)`.
- Bevitel: `input()`; a beolvasott érték szöveg.
- Számmá alakítás: `int(...)`.

:::

::: csharp

- Kiírás: `Console.WriteLine(...)`.
- Bevitel: `Console.ReadLine()`; a beolvasott érték szöveg.
- Számmá alakítás: `int.Parse(...)`.

:::

Most jönnek a feladatok: próbáld ki mindegyiket a választott nyelveden.
