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

A program utasítások sorozata, amelyet a számítógép egymás után, fentről lefelé hajt végre. Minden program két dolgot csinál: adatot kap (bevitel), és eredményt mutat (kiírás). Ebben a leckében mindkettőt megtanulod.

## Kiírás

A képernyőre írást a Pythonban a `print`, C#-ban a `Console.WriteLine` utasítás végzi. A kiírandó szöveget idézőjelek közé kell tenni.

```python
print("Helló, világ!")
```

```csharp
Console.WriteLine("Helló, világ!");
```

A C# példák ebben a leckében sokszor csak egy-egy utasítást mutatnak; egy teljes C# programhoz kell a `using System;` sor, egy osztály (`class Program`) és a `static void Main()` metódus, ahogy a lenti példában is látod. A feladatoknál mindig teljes programot írj.

Mindkét utasítás a kiírás végén új sort kezd, tehát a következő kiírás a következő sorba kerül.

## Bevitel

A felhasználótól a Pythonban az `input()`, C#-ban a `Console.ReadLine()` kér be egy sort. A beolvasott érték mindig **szöveg**; ha számként akarod használni, át kell alakítani: Pythonban `int(...)`, C#-ban `int.Parse(...)` segítségével.

```python
nev = input()
szam = int(input())
```

```csharp
var nev = Console.ReadLine();
var szam = int.Parse(Console.ReadLine());
```

A `nev` és a `szam` **változó**: egy névvel ellátott hely, ahol a program egy értéket tárol.

## Bevitel és kiírás együtt

Az alábbi teljes program beolvassa a nevedet, és köszön neked. Pythonban a `+` összefűzi a szövegeket, C#-ban ugyanezt a `$"..."` szöveg végzi, ahol a `{}` közé írt változó értéke behelyettesítődik.

```python
nev = input()
print("Szia, " + nev + "!")
```

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

Ha a bemenet `Anna`, a kimenet `Szia, Anna!` lesz.

## Gyakori hibák

1. **Hiányzó idézőjel vagy zárójel.** A `print("Szia)` vagy a `Console.WriteLine("Szia";` hibaüzenetet ad, mert a szöveg vagy a zárójel nincs lezárva.
2. **Szám beolvasása átalakítás nélkül.** Az `input()` szöveget ad, ezért a `"2" + "3"` eredménye `23`, nem `5`. Számoláshoz mindig alakítsd át számmá (`int(...)`, `int.Parse(...)`).

## Összefoglalás

- Kiírás: `print(...)` / `Console.WriteLine(...)`.
- Bevitel: `input()` / `Console.ReadLine()`; a beolvasott érték szöveg.
- Számmá alakítás: `int(...)` / `int.Parse(...)`.

Most jönnek a feladatok: próbáld ki mindegyiket mindkét nyelven.
