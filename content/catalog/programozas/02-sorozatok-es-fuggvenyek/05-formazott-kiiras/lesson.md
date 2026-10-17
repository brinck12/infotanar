---
slug: formazott-kiiras
title: Formázott kiírás
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért nem elég a sima kiírás?

Ha kiírod, hogy `100 / 7`, a program hosszú számot ad: `14.285714285714286`. Az érettségi feladatok viszont pontos kimeneti mintát kérnek, például:

```
A sebesseg: 13.4 m/s
```

Egy tizedesjegy, utána mértékegység. Ehhez a kiírást **formázni** kell: meg kell mondanod, hány tizedesjegy legyen, mekkora helyen jelenjen meg az érték, és merre legyen igazítva. Ebben a leckében mindezt megtanulod.

## Beépített értékek a szövegbe

::: python

Az **f-string** olyan szöveg, amely `f` betűvel kezdődik az idézőjel előtt. A kapcsos zárójelbe írt kifejezés értéke behelyettesítődik a szövegbe.

```python
nev = "Anna"
kor = 17
print(f"{nev} {kor} eves")          # Anna 17 eves
print(f"Jovore {kor + 1} eves lesz") # a zárójelben számolhatsz is
```

:::

::: csharp

A `$"..."` szöveg (amit már ismersz) a kapcsos zárójelbe írt kifejezés értékét helyettesíti be.

```csharp
string nev = "Anna";
int kor = 17;
Console.WriteLine($"{nev} {kor} eves");           // Anna 17 eves
Console.WriteLine($"Jovore {kor + 1} eves lesz");  // a zárójelben számolhatsz is
```

:::

## Tizedesjegyek

A kapcsos zárójelben az érték után kettősponttal **formátumot** adhatsz meg. Valós számoknál ez a tizedesjegyek száma. A kiíráskor **kerekít** a program, de a változó értéke nem változik.

::: python

A `.2f` azt jelenti: valós szám (`f`), két tizedesjeggyel.

```python
ar = 1234.5678
print(f"{ar:.2f}")        # 1234.57
print(f"{ar:.1f}")        # 1234.6
print(f"{ar:.0f}")        # 1235
sebesseg = 67 / 5
print(f"A sebesseg: {sebesseg:.1f} m/s")   # A sebesseg: 13.4 m/s
```

:::

::: csharp

Az `F2` azt jelenti: fix tizedesjegyek száma, kettő. **Vigyázat:** a C# a tizedeselválasztót a számítógép nyelvi beállítása szerint írja. Magyar beállításnál `1234,57` lesz, **vessző** a pont helyett, az érettségi kimeneti mintái viszont pontot használnak, és nem tudhatod, milyen beállítású gépen fut a programod. A biztos megoldás, hogy mindig megadod a **`CultureInfo.InvariantCulture`** értéket (ez a nyelvfüggetlen formátum, ahol a tizedeselválasztó pont). Ehhez kell a `using System.Globalization;` sor.

```csharp
using System.Globalization;

double ar = 1234.5678;
Console.WriteLine(ar.ToString("F2", CultureInfo.InvariantCulture));   // 1234.57
Console.WriteLine(ar.ToString("F1", CultureInfo.InvariantCulture));   // 1234.6
Console.WriteLine(ar.ToString("F0", CultureInfo.InvariantCulture));   // 1235

double sebesseg = 67 / 5.0;
Console.WriteLine(string.Format(CultureInfo.InvariantCulture,
    "A sebesseg: {0:F1} m/s", sebesseg));                              // A sebesseg: 13.4 m/s
```

A `string.Format` első paramétere a kultúra, a másodiké a minta, amelyben a `{0}` az első érték, a `{1}` a második stb. A `$"..."` formában is használhatod az `F2`-t, de az a rendszer nyelvi beállítását követi, ezért tizedestörtnél a `string.Format` biztosabb.

:::

## Valós szám beolvasása

::: python

Pythonban a `float(...)` pontot vár a tizedeselválasztónak: `float("12.5")`.

```python
tav = float(input())
```

:::

::: csharp

C#-ban a beolvasásnál is meg kell adni a kultúrát, különben a beolvasás a rendszer nyelvi beállításától függ, és a `12.5` sem biztos, hogy számként értelmeződik.

```csharp
double tav = double.Parse(Console.ReadLine(), CultureInfo.InvariantCulture);
```

:::

## Igazítás: szélesség és irány

Táblázatos kiíráshoz az kell, hogy az értékek mindig ugyanakkora helyet foglaljanak el. A formátumban a **szélességet** (hány karakter széles a mező) és az **igazítást** is megadhatod.

::: python

A kettőspont után: irány (`<` balra, `>` jobbra, `^` középre), utána a szélesség.

```python
nev = "alma"
ar = 120
print(f"{nev:<10}{ar:>6}")      # alma          120
print(f"[{nev:>8}]")            # [    alma]
print(f"[{nev:^8}]")            # [  alma  ]
print(f"{3.14159:>8.2f}")       # "    3.14"
```

A számok alapból jobbra, a szövegek balra igazodnak, de az irányt kérheted is.

:::

::: csharp

A kapcsos zárójelben az érték után **vesszővel** adod meg a szélességet: a pozitív szám jobbra, a negatív balra igazít.

```csharp
string nev = "alma";
int ar = 120;
Console.WriteLine($"{nev,-10}{ar,6}");   // alma          120
Console.WriteLine($"[{nev,8}]");         // [    alma]
Console.WriteLine(string.Format(CultureInfo.InvariantCulture, "{0,8:F2}", 3.14159));   // "    3.14"
```

A szélességet a formátum elé írod (`{0,8:F2}`: 8 széles, 2 tizedes).

:::

Ha az érték hosszabb a megadott szélességnél, a program nem vágja le, csak túlnyúlik.

## Tabulátor

A `\t` jel egy **tabulátort** jelent: egy ugrás a következő oszlopig. Táblázatszerű kimenetnél gyakran ezt várják oszlopelválasztónak.

::: python

```python
print("C\tF")
print(f"{36.6:.1f}\t{97.88:.1f}")
```

:::

::: csharp

```csharp
Console.WriteLine("C\tF");
Console.WriteLine(36.6.ToString("F1", CultureInfo.InvariantCulture) + "\t" +
    97.88.ToString("F1", CultureInfo.InvariantCulture));
```

:::

A kimenet két oszlop: `C`, tabulátor, `F`; alatta `36.6`, tabulátor, `97.9`. Az új sor jele a `\n`, a tabulátoré a `\t`.

## Teljes példa

Egy tárgy árából és a darabszámból kiszámoljuk az összeget, két tizedessel.

::: python

```python
ar = float(input())
db = int(input())
print(f"Osszesen: {ar * db:.2f} Ft")
```

:::

::: csharp

```csharp
using System;
using System.Globalization;

class Program
{
    static void Main()
    {
        double ar = double.Parse(Console.ReadLine(), CultureInfo.InvariantCulture);
        int db = int.Parse(Console.ReadLine());
        Console.WriteLine(string.Format(CultureInfo.InvariantCulture,
            "Osszesen: {0:F2} Ft", ar * db));
    }
}
```

:::

A `199.9` és a `3` bemenetre a kimenet: `Osszesen: 599.70 Ft`.

## Gyakori hibák

::: python

1. **Elfelejtett `f` az idézőjel előtt.** A `print("{ar:.2f}")` szó szerint kiírja a kapcsos zárójelet.
2. **Formázás szövegen.** A `.2f` számhoz való; ha az érték még a beolvasott szöveg, hibát kapsz. A beolvasott szöveget előbb alakítsd `float(...)`-tá.
3. **Kerekítés a számolás közben.** A formátum csak a kiírást érinti, a változó értéke változatlan; ne a kiírt számmal számolj tovább.

:::

::: csharp

1. **Hiányzó `CultureInfo.InvariantCulture`.** Tizedestörtnél vessző vagy pont jelenhet meg a gép beállítása szerint. Mindig add meg, és ne felejtsd el a `using System.Globalization;` sort.
2. **Egész osztás.** A `67 / 5` egész osztás, az eredmény `13`. A valós osztáshoz legalább az egyik tag legyen valós: `67 / 5.0`.
3. **Kerekítés a számolás közben.** A formátum csak a kiírást érinti, a változó értéke változatlan; ne a kiírt számmal számolj tovább.

:::

## Összefoglalás

::: python

- Értékek behelyettesítése: `f"{nev} {kor}"`.
- Tizedesjegyek: `f"{x:.2f}"`; szélesség és igazítás: `f"{x:<10}"`, `f"{x:>6}"`, `f"{x:^8}"`.
- Tabulátor: `\t`; valós beolvasás: `float(input())`.

:::

::: csharp

- Tizedesjegyek: `x.ToString("F2", CultureInfo.InvariantCulture)` vagy `string.Format(CultureInfo.InvariantCulture, "{0:F2}", x)`.
- Szélesség és igazítás: `$"{nev,-10}{ar,6}"` (negatív: balra, pozitív: jobbra).
- Valós beolvasás: `double.Parse(Console.ReadLine(), CultureInfo.InvariantCulture)`; tabulátor: `\t`; mindig `using System.Globalization;`.

:::

A feladatokban sebességet, árat és hőmérsékletet írsz ki pontos mintában, táblázatos formában.
