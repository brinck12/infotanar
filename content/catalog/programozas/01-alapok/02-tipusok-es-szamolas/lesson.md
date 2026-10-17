---
slug: tipusok-es-szamolas
title: Típusok és számolás
position: 1
free: true
published: false
reviewed_by:
reviewed_at:
---

## Miért számít, hogy mi az adat?

Az előző leckében már láttad, hogy az `input` szöveget ad, és a `"2" + "3"` eredménye `23`, nem `5`. Ennek az oka, hogy a program minden értékről tudja, **milyen fajta**: ezt hívjuk **típusnak**. A típus dönti el, mit lehet az értékkel csinálni, és mit jelent rajta a `+`. Ebben a leckében megismered a négy alap típust, megtanulsz számolni, és átalakítani egyik típust a másikba.

## A négy alap típus

- **Egész szám**: például `7`, `-3`, `0`. Nincs tizedesrésze.
- **Valós szám** (tizedes tört): például `3.5`, `-0.25`. A programozásban a tizedesvessző helyett **tizedespontot** írunk.
- **Szöveg**: idézőjelek között, például `"alma"`. A `"7"` is szöveg, nem szám!
- **Logikai érték**: csak két értéke van, igaz vagy hamis. Ezzel a következő leckében sokat dolgozunk.

::: python

Pythonban a típusok neve `int`, `float`, `str` és `bool`. A `type()` megmutatja egy érték típusát.

```python
print(type(7))        # <class 'int'>
print(type(3.5))      # <class 'float'>
print(type("alma"))   # <class 'str'>
print(type(True))     # <class 'bool'>
```

A `#` utáni rész megjegyzés: a gép figyelmen kívül hagyja, csak nekünk szól.

:::

::: csharp

C#-ban a típusok neve `int`, `double`, `string` és `bool`. A változó létrehozásakor megadhatod a típust is, de a `var` kulcsszóval a gép kitalálja az értékből.

```csharp
int egesz = 7;
double valos = 3.5;
string szoveg = "alma";
bool igaz = true;
```

A `//` utáni rész megjegyzés: a gép figyelmen kívül hagyja, csak nekünk szól.

:::

## Számolás

A négy alapművelet jele `+`, `-`, `*` (szorzás) és `/` (osztás). A szokásos matematikai sorrend érvényes: a szorzás és osztás előbb fut le, mint az összeadás és kivonás; a zárójellel ezt felülbírálhatod.

::: python

```python
a = 7
b = 2
print(a + b)    # 9
print(a * b)    # 14
print(a / b)    # 3.5
print((a + b) * 3)   # 27
```

Pythonban a `/` osztás mindig valós számot ad, még akkor is, ha az eredmény kerek: a `6 / 3` értéke `2.0`.

:::

::: csharp

```csharp
int a = 7;
int b = 2;
Console.WriteLine(a + b);         // 9
Console.WriteLine(a * b);         // 14
Console.WriteLine((a + b) * 3);   // 27
```

Vigyázz: C#-ban két egész szám osztása **egész osztás**, az eredmény is egész: a `7 / 2` értéke `3`, nem `3.5`. Ha tizedes eredményt szeretnél, legalább az egyik számnak valósnak kell lennie: a `7 / 2.0` értéke `3.5`.

:::

## Egész osztás és maradék

Gyakran nem a tört eredmény kell, hanem az, hogy hányszor fér bele az egyik szám a másikba, és mennyi marad. Például 17 cukorkát osztunk szét 5 gyerek között: mindenki 3-at kap, 2 marad.

::: python

Pythonban a `//` az egész osztás, a `%` pedig a maradék.

```python
print(17 // 5)   # 3
print(17 % 5)    # 2
```

:::

::: csharp

C#-ban két egész szám `/` jele maga is egész osztást végez, a maradékot pedig a `%` adja.

```csharp
Console.WriteLine(17 / 5);   // 3
Console.WriteLine(17 % 5);   // 2
```

:::

A maradék sok mindenre jó. Ha `n % 2` értéke 0, az `n` páros. Az óra átváltásánál is ez kell: 135 percből `135 / 60` (egész osztással) 2 óra, a maradék `135 % 60` pedig 15 perc.

## Típusátalakítás

Az `input` szöveget ad, ezért számoláshoz át kell alakítani. Fordítva is gyakori: ha számot akarsz szövegbe fűzni, azt szöveggé kell alakítani.

::: python

```python
szam = int(input())          # szövegből egész szám
tort = float("3.5")          # szövegből valós szám
szoveg = str(42)             # számból szöveg
print("Az eredmeny: " + str(szam + 1))
```

Ha a `+` két oldalán egy szöveg és egy szám áll, Python hibát jelez, ezért kell a `str(...)`.

:::

::: csharp

```csharp
int szam = int.Parse(Console.ReadLine());   // szövegből egész szám
double tort = double.Parse("3.5");          // szövegből valós szám
string szoveg = 42.ToString();              // számból szöveg
Console.WriteLine("Az eredmeny: " + (szam + 1));
```

A `$"..."` szöveggel egyszerűbb: `Console.WriteLine($"Az eredmeny: {szam + 1}");`, itt nem kell külön átalakítani.

:::

## Kerekítés

Ha egy tizedes eredményt egész számra kell kerekíteni, külön utasítás kell hozzá.

::: python

A `round(x)` a legközelebbi egészre kerekít, és egész számot ad vissza.

```python
print(round(2.7))   # 3
print(round(2.2))   # 2
```

Fontos: pontosan `.5` esetén a Python a **páros** egész felé kerekít, tehát a `round(2.5)` értéke `2`, a `round(3.5)` pedig `4`.

:::

::: csharp

A `Math.Round(x)` a legközelebbi egészre kerekít, de valós számot ad vissza; ha egész kell, alakítsd át: `(int)Math.Round(x)`.

```csharp
Console.WriteLine((int)Math.Round(2.7));   // 3
Console.WriteLine((int)Math.Round(2.2));   // 2
```

Fontos: pontosan `.5` esetén a C# is a **páros** egész felé kerekít, tehát a `Math.Round(2.5)` értéke `2`, a `Math.Round(3.5)` pedig `4`.

:::

Az érettségin a kimenetben a tizedesvessző és a tizedespont kérdése is gondot okozhat, ezért a feladataink ebben a leckében egész számú eredményt kérnek (kerekítéssel, ha kell).

## Egy teljes példa

Beolvasunk egy hosszt centiméterben, és kiírjuk, hány egész méter van benne, és mennyi marad.

::: python

```python
cm = int(input())
print(str(cm // 100) + " m " + str(cm % 100) + " cm")
```

:::

::: csharp

```csharp
using System;

class Program
{
    static void Main()
    {
        int cm = int.Parse(Console.ReadLine());
        Console.WriteLine($"{cm / 100} m {cm % 100} cm");
    }
}
```

:::

A `275` bemenetre a kimenet `2 m 75 cm`.

## Gyakori hibák

::: python

1. **Szám és szöveg összefűzése.** A `"Kor: " + 15` hibát ad; helyesen `"Kor: " + str(15)`.
2. **Az `/` és a `//` összekeverése.** A `7 / 2` értéke `3.5`, a `7 // 2` értéke `3`.
3. **Átalakítás nélküli számolás.** Az `input()` eredményével addig ne számolj, amíg nem tetted `int(...)` vagy `float(...)` függvénybe.

:::

::: csharp

1. **Egész osztás meglepetése.** A `7 / 2` értéke `3`, nem `3.5`; ha tizedes eredmény kell, használj valós számot.
2. **A `Math.Round` valós számot ad.** Ha egész kell, tedd elé az `(int)` átalakítást.
3. **Átalakítás nélküli számolás.** A `Console.ReadLine()` eredményével addig ne számolj, amíg nem tetted `int.Parse(...)` vagy `double.Parse(...)` hívásba.

:::

## Összefoglalás

- Négy alap típus: egész, valós, szöveg, logikai.
- Műveletek: `+ - * /`, zárójellel csoportosíthatsz.
- Egész osztás és maradék: `//` és `%` Pythonban, `/` és `%` egész számokkal C#-ban.
- Átalakítás: szövegből számmá `int(...)` / `int.Parse(...)`, számból szöveggé `str(...)` / `.ToString()`.
- Kerekítés: `round(...)` / `Math.Round(...)`; a `.5` a páros egész felé kerekítődik.

Jöhetnek a feladatok.
